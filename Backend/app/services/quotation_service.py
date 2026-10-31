"""
app/services/quotation_service.py
"""

import logging
from datetime import date, timedelta
from app.extensions import supabase_admin
from app.utils.pricing import calculate_line_totals, calculate_invoice_totals
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)


def _generate_quotation_number() -> str:
    year = date.today().year
    resp = supabase_admin.rpc('next_sequence_value', {'p_key': 'quotation'}).execute()
    seq = resp.data if resp.data else 1
    return f'QT-{year}-{str(seq).zfill(4)}'


def list_quotations(customer_id: str = None, status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('quotations').select(
            '*, quotation_lines(*), customers(name, email)', count='exact'
        )
        if status and status != 'all':
            query = query.eq('status', status)
        if customer_id:
            query = query.eq('customer_id', customer_id)
        query = query.order('created_at', desc=True)
        offset = (page - 1) * per_page
        resp = query.range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        logger.exception('list_quotations: %s', e)
        return None, None, str(e)


def get_quotation(quotation_id: str):
    try:
        resp = supabase_admin.table('quotations').select(
            '*, quotation_lines(*), customers(name, email, company_name)'
        ).eq('id', quotation_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Quotation not found'


def create_quotation(data: dict):
    try:
        lines = data.get('lines', [])
        processed_lines = []
        for line in lines:
            totals = calculate_line_totals(
                line.get('unit_price', 0),
                line.get('quantity', 1),
                line.get('tax_rate', 0),
                line.get('discount_amount', 0),
            )
            processed_lines.append({**line, **totals})

        inv_totals = calculate_invoice_totals(processed_lines)
        validity_days = int(data.get('validity_days', 30))
        valid_until = (date.today() + timedelta(days=validity_days)).isoformat()

        qnum = _generate_quotation_number()

        payload = {
            'quotation_number': qnum,
            'customer_id': data['customer_id'],
            'template_id': data.get('template_id'),
            'plan_id': data.get('plan_id'),
            'quotation_date': date.today().isoformat(),
            'valid_until': data.get('valid_until', valid_until),
            'subtotal': inv_totals['subtotal'],
            'discount_amount': inv_totals['discount_total'],
            'tax_amount': inv_totals['tax_total'],
            'total_amount': inv_totals['total_amount'],
            'currency': data.get('currency', 'USD'),
            'payment_terms': data.get('payment_terms', 'Due on receipt'),
            'notes': data.get('notes', ''),
            'status': 'draft',
        }
        resp = supabase_admin.table('quotations').insert(payload).execute()
        quotation = resp.data[0] if resp.data else None
        if not quotation:
            return None, 'Failed to create quotation'

        # Insert lines
        for line in processed_lines:
            supabase_admin.table('quotation_lines').insert({
                'quotation_id': quotation['id'],
                'product_id': line.get('product_id'),
                'variant_id': line.get('variant_id'),
                'description': line.get('description', ''),
                'quantity': int(line.get('quantity', 1)),
                'unit_price': float(line.get('unit_price', 0)),
                'tax_rate': float(line.get('tax_rate', 0)),
                'tax_amount': float(line.get('tax_amount', 0)),
                'discount_amount': float(line.get('discount_amount', 0)),
                'subtotal': float(line.get('subtotal', 0)),
                'line_total': float(line.get('line_total', 0)),
            }).execute()

        return get_quotation(quotation['id'])[0], None
    except Exception as e:
        logger.exception('create_quotation: %s', e)
        return None, str(e)


def update_quotation(quotation_id: str, data: dict):
    try:
        existing, err = get_quotation(quotation_id)
        if err or not existing:
            return None, 'Quotation not found'
        if existing['status'] not in ('draft',):
            return None, 'Only draft quotations can be edited'

        allowed = ['plan_id', 'valid_until', 'payment_terms', 'notes', 'currency']
        payload = {k: v for k, v in data.items() if k in allowed}
        supabase_admin.table('quotations').update(payload).eq('id', quotation_id).execute()
        return get_quotation(quotation_id)[0], None
    except Exception as e:
        return None, str(e)


def confirm_quotation(quotation_id: str):
    existing, err = get_quotation(quotation_id)
    if err:
        return None, err
    if existing['status'] not in ('draft', 'quotation'):
        return None, f'Cannot confirm a quotation in status: {existing["status"]}'
    today = date.today().isoformat()
    if existing.get('valid_until') and existing['valid_until'] < today:
        return None, 'Quotation has expired and cannot be confirmed'
    try:
        resp = supabase_admin.table('quotations').update({'status': 'confirmed'}).eq('id', quotation_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def cancel_quotation(quotation_id: str):
    existing, err = get_quotation(quotation_id)
    if err:
        return None, err
    if existing['status'] in ('converted', 'cancelled'):
        return None, f'Cannot cancel a quotation in status: {existing["status"]}'
    try:
        resp = supabase_admin.table('quotations').update({'status': 'cancelled'}).eq('id', quotation_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def convert_to_subscription(quotation_id: str):
    """
    Convert a confirmed quotation to a subscription.
    Idempotent: if already converted, return the existing subscription.
    """
    existing, err = get_quotation(quotation_id)
    if err:
        return None, err

    if existing['status'] == 'converted' and existing.get('converted_subscription_id'):
        sub_resp = supabase_admin.table('subscriptions').select('*').eq(
            'id', existing['converted_subscription_id']
        ).single().execute()
        return sub_resp.data, None

    if existing['status'] != 'confirmed':
        return None, 'Only confirmed quotations can be converted to subscriptions'

    from app.services.subscription_service import create_subscription
    sub_data = {
        'customer_id': existing['customer_id'],
        'plan_id': existing.get('plan_id'),
        'quotation_id': quotation_id,
        'payment_terms': existing.get('payment_terms', 'Due on receipt'),
        'currency': existing.get('currency', 'USD'),
        'notes': existing.get('notes', ''),
        'lines': existing.get('quotation_lines', []),
        'subtotal': existing['subtotal'],
        'discount_amount': existing['discount_amount'],
        'tax_amount': existing['tax_amount'],
        'total_amount': existing['total_amount'],
    }
    sub, sub_err = create_subscription(sub_data)
    if sub_err:
        return None, sub_err

    # Mark quotation as converted
    supabase_admin.table('quotations').update({
        'status': 'converted',
        'converted_subscription_id': sub['id'],
    }).eq('id', quotation_id).execute()

    return sub, None
