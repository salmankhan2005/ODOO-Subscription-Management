"""
app/services/payment_service.py

Manual payment recording with invoice reconciliation.
Supports partial payments and multiple payments per invoice.
"""
from __future__ import annotations

import logging
from datetime import date
from app.extensions import supabase_admin
from app.utils.pagination import build_pagination_meta
from decimal import Decimal

logger = logging.getLogger(__name__)

VALID_METHODS = {'Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'}
VALID_STATUSES = {'pending', 'completed', 'failed', 'refunded'}


def _generate_payment_ref() -> str:
    year = date.today().year
    resp = supabase_admin.rpc('next_sequence_value', {'p_key': 'payment'}).execute()
    seq = resp.data if resp.data else 1
    return f'PAY-{year}-{str(seq).zfill(5)}'


def list_payments(customer_id: str = None, page: int = 1, per_page: int = 20):
    try:
        try:
            query = supabase_admin.table('payments').select(
                '*, customers(name, email), payment_allocations(invoice_id, allocated_amount, invoices(id, invoice_number))', count='exact'
            )
            if customer_id:
                query = query.eq('customer_id', customer_id)
            query = query.order('created_at', desc=True)
            offset = (page - 1) * per_page
            resp = query.range(offset, offset + per_page - 1).execute()
        except Exception as query_err:
            logger.warning('Falling back from nested payment_allocations query: %s', query_err)
            query = supabase_admin.table('payments').select(
                '*, customers(name, email)', count='exact'
            )
            if customer_id:
                query = query.eq('customer_id', customer_id)
            query = query.order('created_at', desc=True)
            offset = (page - 1) * per_page
            resp = query.range(offset, offset + per_page - 1).execute()

        raw_data = resp.data or []
        missing_customer_ids: list = []
        missing_payment_ids: list = []

        for p in raw_data:
            # Flatten nested customer join
            customer = p.get('customers') or {}
            if isinstance(customer, dict) and customer.get('name'):
                p['customer_name'] = customer.get('name', '')
                p['customer_email'] = customer.get('email', '')
            else:
                p.setdefault('customer_name', '')
                p.setdefault('customer_email', '')
                if p.get('customer_id') and not p.get('customer_name'):
                    missing_customer_ids.append(p['customer_id'])

            # Flatten nested payment_allocations + invoices join
            allocs = p.get('payment_allocations') or []
            if allocs and isinstance(allocs, list):
                first_alloc = allocs[0] or {}
                p['invoice_id'] = p.get('invoice_id') or first_alloc.get('invoice_id', '')
                inv = first_alloc.get('invoices') or {}
                if isinstance(inv, dict) and inv.get('invoice_number'):
                    p['invoice_number'] = inv.get('invoice_number', '')
                else:
                    p.setdefault('invoice_number', '')
                    if p.get('id') and not p.get('invoice_number'):
                        missing_payment_ids.append(p['id'])
            else:
                p.setdefault('invoice_id', '')
                p.setdefault('invoice_number', '')
                if p.get('id'):
                    missing_payment_ids.append(p['id'])

        # Fallback: bulk-resolve customer names that the join missed
        if missing_customer_ids:
            try:
                cust_resp = supabase_admin.table('customers').select('id, name, email').in_(
                    'id', list(set(missing_customer_ids))
                ).execute()
                cust_map = {c['id']: c for c in (cust_resp.data or [])}
                for p in raw_data:
                    if not p.get('customer_name') and p.get('customer_id') in cust_map:
                        c = cust_map[p['customer_id']]
                        p['customer_name'] = c.get('name', '')
                        p['customer_email'] = c.get('email', '')
            except Exception as cust_err:
                logger.warning('Customer fallback lookup failed: %s', cust_err)

        # Fallback: bulk-resolve invoice numbers that the join missed
        if missing_payment_ids:
            try:
                alloc_resp = supabase_admin.table('payment_allocations').select(
                    'payment_id, invoice_id, invoices(id, invoice_number)'
                ).in_('payment_id', list(set(missing_payment_ids))).execute()
                alloc_map: dict = {}
                for alloc in (alloc_resp.data or []):
                    pid = alloc.get('payment_id')
                    if pid and pid not in alloc_map:
                        inv = alloc.get('invoices') or {}
                        alloc_map[pid] = {
                            'invoice_id': alloc.get('invoice_id', ''),
                            'invoice_number': inv.get('invoice_number', '') if isinstance(inv, dict) else '',
                        }
                for p in raw_data:
                    pid = p.get('id')
                    if pid in alloc_map and not p.get('invoice_number'):
                        p['invoice_id'] = alloc_map[pid]['invoice_id']
                        p['invoice_number'] = alloc_map[pid]['invoice_number']
            except Exception as alloc_err:
                logger.warning('Allocation fallback lookup failed: %s', alloc_err)

        return raw_data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        logger.exception('list_payments failed: %s', e)
        return None, None, str(e)


def get_payment(payment_id: str):
    try:
        resp = supabase_admin.table('payments').select('*').eq('id', payment_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Payment not found'


def record_payment(data: dict) -> tuple[dict, str | None]:
    """
    Record a payment and allocate it to an invoice.
    Supports partial payments.
    """
    invoice_id = data.get('invoice_id')
    if not invoice_id:
        return None, 'invoice_id is required'

    # Fetch invoice
    inv_resp = supabase_admin.table('invoices').select('*').eq('id', invoice_id).single().execute()
    invoice = inv_resp.data
    if not invoice:
        return None, 'Invoice not found'

    if invoice['status'] in ('cancelled', 'paid'):
        return None, f'Cannot record payment for invoice in status: {invoice["status"]}'

    amount = Decimal(str(data.get('amount', 0)))
    if amount <= 0:
        return None, 'Payment amount must be greater than zero'

    method = data.get('payment_method', data.get('method', 'Cash'))
    if method not in VALID_METHODS:
        return None, f'Invalid payment method. Must be one of: {", ".join(VALID_METHODS)}'

    payment_ref = _generate_payment_ref()
    try:
        # Insert payment
        payment_data = {
            'payment_reference': payment_ref,
            'customer_id': invoice['customer_id'],
            'payment_method': method,
            'amount': float(amount),
            'payment_date': data.get('payment_date', date.today().isoformat()),
            'transaction_reference': data.get('transaction_reference', ''),
            'notes': data.get('notes', ''),
            'status': 'completed',
        }
        pay_resp = supabase_admin.table('payments').insert(payment_data).execute()
        payment = pay_resp.data[0] if pay_resp.data else None
        if not payment:
            return None, 'Failed to record payment'

        # Allocate to invoice
        supabase_admin.table('payment_allocations').insert({
            'payment_id': payment['id'],
            'invoice_id': invoice_id,
            'allocated_amount': float(amount),
        }).execute()

        # Recalculate invoice balance
        alloc_resp = supabase_admin.table('payment_allocations').select(
            'allocated_amount'
        ).eq('invoice_id', invoice_id).execute()
        allocations = alloc_resp.data or []
        total_paid = sum(Decimal(str(a['allocated_amount'])) for a in allocations)
        total_amount = Decimal(str(invoice['total_amount']))
        amount_due = max(Decimal('0'), total_amount - total_paid)

        if amount_due <= Decimal('0.01'):
            new_status = 'paid'
        elif total_paid > 0:
            new_status = 'partially_paid'
        else:
            new_status = invoice['status']

        supabase_admin.table('invoices').update({
            'amount_paid': float(total_paid),
            'amount_due': float(amount_due),
            'status': new_status,
        }).eq('id', invoice_id).execute()

        return payment, None
    except Exception as e:
        logger.exception('record_payment: %s', e)
        return None, str(e)


def refund_payment(payment_id: str, reason: str = '') -> tuple[dict, str | None]:
    """Mark a payment as refunded and reverse the invoice allocation."""
    payment, err = get_payment(payment_id)
    if err:
        return None, err
    if payment['status'] == 'refunded':
        return None, 'Payment already refunded'

    try:
        # Get allocation
        alloc_resp = supabase_admin.table('payment_allocations').select('*').eq(
            'payment_id', payment_id
        ).execute()
        allocations = alloc_resp.data or []

        supabase_admin.table('payments').update({
            'status': 'refunded',
            'notes': f"Refunded. {reason}",
        }).eq('id', payment_id).execute()

        # Reverse allocations
        for alloc in allocations:
            inv_id = alloc['invoice_id']
            inv_resp = supabase_admin.table('invoices').select('*').eq('id', inv_id).single().execute()
            invoice = inv_resp.data
            if invoice:
                new_paid = max(0, float(invoice.get('amount_paid', 0)) - float(alloc['allocated_amount']))
                new_due = min(float(invoice['total_amount']), float(invoice.get('amount_due', 0)) + float(alloc['allocated_amount']))
                new_status = 'confirmed' if new_paid == 0 else 'partially_paid'
                supabase_admin.table('invoices').update({
                    'amount_paid': new_paid,
                    'amount_due': new_due,
                    'status': new_status,
                }).eq('id', inv_id).execute()

        return get_payment(payment_id)[0], None
    except Exception as e:
        return None, str(e)


def get_payment_allocations(payment_id: str):
    try:
        resp = supabase_admin.table('payment_allocations').select(
            '*, invoices(invoice_number, total_amount, status)'
        ).eq('payment_id', payment_id).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)
