"""
app/services/dashboard_service.py

Role-specific dashboard data calculated from database aggregations.
MRR = sum of active monthly sub totals + (yearly totals / 12).
ARR = MRR × 12.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from app.extensions import supabase_admin

logger = logging.getLogger(__name__)


def get_admin_dashboard():
    try:
        today = date.today().isoformat()
        next_30 = (date.today() + timedelta(days=30)).isoformat()

        subs_resp = supabase_admin.table('subscriptions').select(
            'id, status, billing_interval, total_amount, next_billing_date'
        ).execute()
        subs = subs_resp.data or []

        customers_resp = supabase_admin.table('customers').select('id, status').execute()
        customers = customers_resp.data or []

        invoices_resp = supabase_admin.table('invoices').select(
            'id, status, total_amount, amount_paid, amount_due, due_date, created_at'
        ).execute()
        invoices = invoices_resp.data or []

        payments_resp = supabase_admin.table('payments').select(
            'id, amount, status, created_at, payment_method'
        ).order('created_at', desc=True).limit(10).execute()
        recent_payments = payments_resp.data or []

        # Compute MRR
        active_subs = [s for s in subs if s['status'] == 'active']
        mrr = 0.0
        for s in active_subs:
            amount = float(s.get('total_amount', 0))
            if s['billing_interval'] == 'yearly':
                mrr += amount / 12
            elif s['billing_interval'] == 'monthly':
                mrr += amount
            elif s['billing_interval'] == 'weekly':
                mrr += amount * 52 / 12
            elif s['billing_interval'] == 'daily':
                mrr += amount * 365 / 12

        arr = mrr * 12

        total_invoiced = sum(float(i.get('total_amount', 0)) for i in invoices if i['status'] != 'cancelled')
        total_collected = sum(float(i.get('amount_paid', 0)) for i in invoices)
        outstanding = sum(float(i.get('amount_due', 0)) for i in invoices if i['status'] not in ('paid', 'cancelled'))
        overdue = [i for i in invoices if i['status'] == 'overdue']
        upcoming_renewals = [s for s in active_subs if s.get('next_billing_date', '') <= next_30]

        recent_subs_resp = supabase_admin.table('subscriptions').select(
            '*, customers(name, email)'
        ).order('created_at', desc=True).limit(5).execute()

        return {
            'total_customers': len(customers),
            'active_customers': len([c for c in customers if c['status'] == 'active']),
            'total_subscriptions': len(subs),
            'active_subscriptions': len([s for s in subs if s['status'] == 'active']),
            'paused_subscriptions': len([s for s in subs if s['status'] == 'paused']),
            'cancelled_subscriptions': len([s for s in subs if s['status'] == 'cancelled']),
            'closed_subscriptions': len([s for s in subs if s['status'] == 'closed']),
            'mrr': round(mrr, 2),
            'arr': round(arr, 2),
            'total_invoiced': round(total_invoiced, 2),
            'total_collected': round(total_collected, 2),
            'outstanding_amount': round(outstanding, 2),
            'overdue_count': len(overdue),
            'overdue_amount': round(sum(float(i.get('amount_due', 0)) for i in overdue), 2),
            'upcoming_renewals_count': len(upcoming_renewals),
            'recent_payments': recent_payments,
            'recent_subscriptions': recent_subs_resp.data or [],
        }, None
    except Exception as e:
        logger.exception('get_admin_dashboard: %s', e)
        return None, str(e)


def get_staff_dashboard():
    try:
        invoices_resp = supabase_admin.table('invoices').select('id, status, due_date').execute()
        invoices = invoices_resp.data or []
        subs_resp = supabase_admin.table('subscriptions').select('id, status').execute()
        subs = subs_resp.data or []
        quotes_resp = supabase_admin.table('quotations').select('id, status').execute()
        quotes = quotes_resp.data or []
        customers_resp = supabase_admin.table('customers').select('id').execute()
        payments_resp = supabase_admin.table('payments').select(
            'id, amount, status, customer_id, created_at'
        ).order('created_at', desc=True).limit(8).execute()

        today = date.today().isoformat()
        next_30 = (date.today() + timedelta(days=30)).isoformat()
        active_subs = [s for s in subs if s['status'] == 'active']

        return {
            'total_customers': len(customers_resp.data or []),
            'active_subscriptions': len(active_subs),
            'pending_quotations': len([q for q in quotes if q['status'] in ('draft', 'quotation')]),
            'pending_invoices': len([i for i in invoices if i['status'] in ('draft', 'confirmed')]),
            'overdue_invoices': len([i for i in invoices if i['status'] == 'overdue']),
            'upcoming_renewals': len([s for s in active_subs]),
            'recent_payments': payments_resp.data or [],
        }, None
    except Exception as e:
        return None, str(e)


def get_customer_dashboard(customer_id: str):
    try:
        subs_resp = supabase_admin.table('subscriptions').select(
            '*, subscription_plans(name, billing_interval)'
        ).eq('customer_id', customer_id).eq('status', 'active').execute()

        invoices_resp = supabase_admin.table('invoices').select(
            'id, invoice_number, total_amount, amount_due, status, due_date, invoice_date'
        ).eq('customer_id', customer_id).order('created_at', desc=True).limit(5).execute()

        payments_resp = supabase_admin.table('payments').select(
            'id, payment_reference, amount, payment_date, payment_method, status'
        ).eq('customer_id', customer_id).order('created_at', desc=True).limit(5).execute()

        outstanding = sum(
            float(i.get('amount_due', 0))
            for i in (invoices_resp.data or [])
            if i['status'] not in ('paid', 'cancelled')
        )

        return {
            'active_subscriptions': subs_resp.data or [],
            'recent_invoices': invoices_resp.data or [],
            'payment_history': payments_resp.data or [],
            'outstanding_balance': round(outstanding, 2),
        }, None
    except Exception as e:
        return None, str(e)


def get_revenue_summary():
    try:
        subs_resp = supabase_admin.table('subscriptions').select(
            'id, status, billing_interval, total_amount'
        ).execute()
        subs = subs_resp.data or []
        invoices_resp = supabase_admin.table('invoices').select(
            'total_amount, amount_paid, amount_due, status'
        ).execute()
        invoices = invoices_resp.data or []

        active = [s for s in subs if s['status'] == 'active']
        mrr = sum(
            float(s['total_amount']) / (12 if s['billing_interval'] == 'yearly' else 1)
            for s in active if s['billing_interval'] in ('monthly', 'yearly')
        )
        return {
            'mrr': round(mrr, 2),
            'arr': round(mrr * 12, 2),
            'total_invoiced': round(sum(float(i['total_amount']) for i in invoices if i['status'] != 'cancelled'), 2),
            'total_collected': round(sum(float(i.get('amount_paid', 0)) for i in invoices), 2),
            'total_outstanding': round(sum(float(i.get('amount_due', 0)) for i in invoices if i['status'] not in ('paid', 'cancelled')), 2),
        }, None
    except Exception as e:
        return None, str(e)
