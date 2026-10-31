"""
app/services/invoice_service.py

CRITICAL RULES:
- Never generate duplicate invoices for the same subscription + billing period.
- Unique constraint on (subscription_id, billing_period_start) enforced at DB level.
- Never mark an invoice as paid just because it was generated.
- All totals are calculated server-side; never trust frontend totals.
"""

import logging
from datetime import date, timedelta
from app.extensions import supabase_admin
from app.utils.date_utils import calculate_next_billing_date, str_to_date, date_to_str
from app.utils.pricing import calculate_line_totals, calculate_invoice_totals
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)


def _generate_invoice_number() -> str:
    year = date.today().year
    resp = supabase_admin.rpc('next_sequence_value', {'p_key': 'invoice'}).execute()
    seq = resp.data if resp.data else 1
    return f'INV-{year}-{str(seq).zfill(5)}'


def list_invoices(customer_id: str = None, status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('invoices').select(
            '*, invoice_lines(*), customers(name, email)', count='exact'
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
        logger.exception('list_invoices: %s', e)
        return None, None, str(e)


def get_invoice(invoice_id: str):
    try:
        resp = supabase_admin.table('invoices').select(
            '*, invoice_lines(*), customers(name, email, company_name, billing_address)'
        ).eq('id', invoice_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Invoice not found'


def create_invoice_from_subscription(subscription_id: str, billing_period_start: date = None) -> tuple[dict, str | None]:
    """
    Generate an invoice for a subscription.
    Idempotent: if an invoice for the same billing period already exists, returns it.
    """
    # Fetch subscription with lines
    sub_resp = supabase_admin.table('subscriptions').select(
        '*, subscription_lines(*), customers(*)'
    ).eq('id', subscription_id).single().execute()
    sub = sub_resp.data
    if not sub:
        return None, 'Subscription not found'

    if sub['status'] not in ('active', 'confirmed'):
        return None, f'Cannot generate invoice for subscription in status: {sub["status"]}'

    billing_start = billing_period_start or str_to_date(sub['next_billing_date'])
    billing_start_str = date_to_str(billing_start)

    # Idempotency check — unique constraint also at DB level
    existing_resp = supabase_admin.table('invoices').select('id').eq(
        'subscription_id', subscription_id
    ).eq('billing_period_start', billing_start_str).execute()
    if existing_resp.data:
        return get_invoice(existing_resp.data[0]['id'])[0], None

    customer = sub.get('customers', {})
    lines = sub.get('subscription_lines', [])

    # Recalculate line totals server-side (never trust stored values blindly)
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
    inv_num = _generate_invoice_number()

    # Next billing date after this period
    interval = sub['billing_interval']
    count = sub.get('interval_count', 1)
    billing_end = calculate_next_billing_date(billing_start, interval, count) - timedelta(days=1)
    due_date = billing_start + timedelta(days=14)

    payload = {
        'invoice_number': inv_num,
        'customer_id': sub['customer_id'],
        'subscription_id': subscription_id,
        'invoice_date': date.today().isoformat(),
        'due_date': date_to_str(due_date),
        'billing_period_start': billing_start_str,
        'billing_period_end': date_to_str(billing_end),
        'subtotal': inv_totals['subtotal'],
        'discount_amount': inv_totals['discount_total'],
        'tax_amount': inv_totals['tax_total'],
        'total_amount': inv_totals['total_amount'],
        'amount_paid': 0,
        'amount_due': inv_totals['total_amount'],
        'currency': sub.get('currency', 'USD'),
        'status': 'draft',
        'notes': '',
    }

    try:
        resp = supabase_admin.table('invoices').insert(payload).execute()
        invoice = resp.data[0] if resp.data else None
        if not invoice:
            return None, 'Failed to create invoice'

        # Insert lines
        for line in processed_lines:
            supabase_admin.table('invoice_lines').insert({
                'invoice_id': invoice['id'],
                'product_id': line.get('product_id'),
                'variant_id': line.get('variant_id'),
                'description': line.get('description', ''),
                'quantity': int(line.get('quantity', 1)),
                'unit_price': float(line.get('unit_price', 0)),
                'tax_percentage': float(line.get('tax_rate', 0)),
                'tax_amount': float(line.get('tax_amount', 0)),
                'discount_amount': float(line.get('discount_amount', 0)),
                'line_total': float(line.get('line_total', 0)),
            }).execute()

        # Update subscription next billing date
        new_next = calculate_next_billing_date(billing_start, interval, count)
        supabase_admin.table('subscriptions').update({
            'next_billing_date': date_to_str(new_next)
        }).eq('id', subscription_id).execute()

        return get_invoice(invoice['id'])[0], None

    except Exception as e:
        logger.exception('create_invoice_from_subscription: %s', e)
        if 'unique' in str(e).lower():
            # Race condition: another request already created it
            existing = supabase_admin.table('invoices').select('id').eq(
                'subscription_id', subscription_id
            ).eq('billing_period_start', billing_start_str).execute()
            if existing.data:
                return get_invoice(existing.data[0]['id'])[0], None
        return None, str(e)


def confirm_invoice(invoice_id: str):
    inv, err = get_invoice(invoice_id)
    if err:
        return None, err
    if inv['status'] != 'draft':
        return None, f'Cannot confirm invoice in status: {inv["status"]}'
    try:
        resp = supabase_admin.table('invoices').update({'status': 'confirmed'}).eq('id', invoice_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def send_invoice(invoice_id: str):
    inv, err = get_invoice(invoice_id)
    if err:
        return None, err
    if inv['status'] == 'cancelled':
        return None, 'Cannot send a cancelled invoice'
    try:
        update = {'sent_at': date.today().isoformat()}
        if inv['status'] == 'draft':
            update['status'] = 'confirmed'
        supabase_admin.table('invoices').update(update).eq('id', invoice_id).execute()
        # TODO: send email via notification_service
        return get_invoice(invoice_id)[0], None
    except Exception as e:
        return None, str(e)


def cancel_invoice(invoice_id: str):
    inv, err = get_invoice(invoice_id)
    if err:
        return None, err
    if inv['status'] in ('paid', 'cancelled'):
        return None, f'Cannot cancel invoice in status: {inv["status"]}'
    if float(inv.get('amount_paid', 0)) > 0:
        return None, 'Cannot cancel a partially paid invoice. Issue a refund first.'
    try:
        supabase_admin.table('invoices').update({'status': 'cancelled'}).eq('id', invoice_id).execute()
        return get_invoice(invoice_id)[0], None
    except Exception as e:
        return None, str(e)


def get_overdue_invoices(page: int = 1, per_page: int = 20):
    try:
        today = date.today().isoformat()
        query = supabase_admin.table('invoices').select(
            '*, customers(name, email)', count='exact'
        ).in_('status', ['confirmed', 'partially_paid']).lt('due_date', today)
        # Mark them overdue in DB too
        supabase_admin.table('invoices').update({'status': 'overdue'}).in_(
            'status', ['confirmed', 'partially_paid']
        ).lt('due_date', today).execute()

        offset = (page - 1) * per_page
        resp = query.order('due_date').range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def get_invoice_payments(invoice_id: str):
    try:
        resp = supabase_admin.table('payment_allocations').select(
            '*, payments(*)'
        ).eq('invoice_id', invoice_id).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)
