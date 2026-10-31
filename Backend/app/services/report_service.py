"""
app/services/report_service.py

Reporting queries using database-side aggregation.
All queries support date_from / date_to filters and pagination.
"""
from __future__ import annotations

import logging
from app.extensions import supabase_admin
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)


def _date_filter(query, date_from: str = None, date_to: str = None, field: str = 'created_at'):
    if date_from:
        query = query.gte(field, date_from)
    if date_to:
        query = query.lte(field, date_to)
    return query


def revenue_report(date_from: str = None, date_to: str = None, customer_id: str = None,
                   page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('invoices').select(
            'invoice_number, customer_id, total_amount, amount_paid, amount_due, status, invoice_date, customers(name)',
            count='exact'
        ).neq('status', 'cancelled')
        query = _date_filter(query, date_from, date_to, 'invoice_date')
        if customer_id:
            query = query.eq('customer_id', customer_id)
        offset = (page - 1) * per_page
        resp = query.order('invoice_date', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def subscription_report(date_from: str = None, date_to: str = None, status: str = None,
                        page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('subscriptions').select(
            '*, customers(name, email), subscription_plans(name)', count='exact'
        )
        if status:
            query = query.eq('status', status)
        query = _date_filter(query, date_from, date_to, 'start_date')
        offset = (page - 1) * per_page
        resp = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def payment_report(date_from: str = None, date_to: str = None, method: str = None,
                   page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('payments').select(
            '*, customers(name)', count='exact'
        ).eq('status', 'completed')
        if method:
            query = query.eq('payment_method', method)
        query = _date_filter(query, date_from, date_to, 'payment_date')
        offset = (page - 1) * per_page
        resp = query.order('payment_date', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def invoice_report(date_from: str = None, date_to: str = None, status: str = None,
                   customer_id: str = None, page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('invoices').select(
            '*, customers(name)', count='exact'
        )
        if status:
            query = query.eq('status', status)
        if customer_id:
            query = query.eq('customer_id', customer_id)
        query = _date_filter(query, date_from, date_to, 'invoice_date')
        offset = (page - 1) * per_page
        resp = query.order('invoice_date', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def overdue_report(page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('invoices').select(
            '*, customers(name, email)', count='exact'
        ).eq('status', 'overdue')
        offset = (page - 1) * per_page
        resp = query.order('due_date').range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def customer_report(date_from: str = None, date_to: str = None, status: str = None,
                    page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('customers').select('*', count='exact')
        if status:
            query = query.eq('status', status)
        query = _date_filter(query, date_from, date_to, 'created_at')
        offset = (page - 1) * per_page
        resp = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def product_report(page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('products').select(
            '*, product_variants(*)', count='exact'
        )
        offset = (page - 1) * per_page
        resp = query.order('name').range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def discount_usage_report(date_from: str = None, date_to: str = None, page: int = 1, per_page: int = 50):
    try:
        query = supabase_admin.table('discount_usages').select(
            '*, discount_rules(name, code, discount_type, value)', count='exact'
        )
        query = _date_filter(query, date_from, date_to, 'created_at')
        offset = (page - 1) * per_page
        resp = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)
