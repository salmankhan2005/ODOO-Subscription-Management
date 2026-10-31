"""
app/services/customer_service.py
"""
from __future__ import annotations

import logging
from app.extensions import supabase_admin
from app.utils.pagination import get_pagination_params, build_pagination_meta

logger = logging.getLogger(__name__)


def _base_query():
    return supabase_admin.table('customers')


def list_customers(search: str = '', status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = _base_query().select('*', count='exact')
        if status and status != 'all':
            query = query.eq('status', status)
        if search:
            query = query.or_(
                f'name.ilike.%{search}%,email.ilike.%{search}%,company_name.ilike.%{search}%'
            )
        query = query.order('created_at', desc=True)
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)
        resp = query.execute()
        total = resp.count or 0
        pagination = build_pagination_meta(page, per_page, total)
        return resp.data, pagination, None
    except Exception as e:
        logger.exception('list_customers error: %s', e)
        return None, None, str(e)


def get_customer(customer_id: str):
    try:
        resp = _base_query().select('*').eq('id', customer_id).single().execute()
        return resp.data, None
    except Exception as e:
        logger.exception('get_customer error: %s', e)
        return None, 'Customer not found'


def create_customer(data: dict):
    try:
        payload = {
            'name': data['name'],
            'email': data['email'].strip().lower(),
            'phone': data.get('phone', ''),
            'company_name': data.get('company_name', ''),
            'billing_address': data.get('billing_address', ''),
            'country': data.get('country', ''),
            'tax_id': data.get('tax_id', ''),
            'status': 'active',
        }
        resp = _base_query().insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        logger.exception('create_customer error: %s', e)
        if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
            return None, 'Email address already exists'
        return None, str(e)


def update_customer(customer_id: str, data: dict):
    try:
        allowed = ['name', 'phone', 'company_name', 'billing_address', 'country', 'tax_id', 'status']
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = _base_query().update(payload).eq('id', customer_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        logger.exception('update_customer error: %s', e)
        return None, str(e)


def deactivate_customer(customer_id: str):
    """Soft-delete: set status=inactive instead of deleting."""
    try:
        resp = _base_query().update({'status': 'inactive'}).eq('id', customer_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def get_customer_balance(customer_id: str):
    try:
        resp = supabase_admin.table('invoices').select(
            'total_amount, amount_paid, amount_due, status'
        ).eq('customer_id', customer_id).neq('status', 'cancelled').execute()
        invoices = resp.data or []
        outstanding = sum(float(i.get('amount_due', 0)) for i in invoices)
        total_paid = sum(float(i.get('amount_paid', 0)) for i in invoices)
        overdue = [i for i in invoices if i['status'] == 'overdue']
        return {
            'outstanding_balance': outstanding,
            'total_paid': total_paid,
            'overdue_count': len(overdue),
            'overdue_amount': sum(float(i.get('amount_due', 0)) for i in overdue),
        }, None
    except Exception as e:
        return None, str(e)
