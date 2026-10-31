"""
app/routes/dashboard_routes.py
"""
from __future__ import annotations

from flask import Blueprint, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only, admin_or_staff, customer_only
from app.services import dashboard_service
from app.utils.response import success_response, error_response

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.get('/admin')
@require_auth
@admin_only
def admin_dashboard():
    data, err = dashboard_service.get_admin_dashboard()
    if err:
        return error_response(err, 500)
    return success_response(data)


@dashboard_bp.get('/staff')
@require_auth
@admin_or_staff
def staff_dashboard():
    data, err = dashboard_service.get_staff_dashboard()
    if err:
        return error_response(err, 500)
    return success_response(data)


@dashboard_bp.get('/customer')
@require_auth
@customer_only
def customer_dashboard():
    customer_id = g.user.get('customer_id')
    if not customer_id:
        return error_response('No customer profile found', 404, 'NOT_FOUND')
    data, err = dashboard_service.get_customer_dashboard(customer_id)
    if err:
        return error_response(err, 500)
    return success_response(data)


@dashboard_bp.get('/revenue-summary')
@require_auth
@admin_only
def revenue_summary():
    data, err = dashboard_service.get_revenue_summary()
    if err:
        return error_response(err, 500)
    return success_response(data)


@dashboard_bp.get('/subscription-summary')
@require_auth
@admin_or_staff
def subscription_summary():
    from app.extensions import supabase_admin
    resp = supabase_admin.table('subscriptions').select('status').execute()
    subs = resp.data or []
    summary = {}
    for s in subs:
        st = s['status']
        summary[st] = summary.get(st, 0) + 1
    return success_response(summary)


@dashboard_bp.get('/payment-summary')
@require_auth
@admin_or_staff
def payment_summary():
    from app.extensions import supabase_admin
    resp = supabase_admin.table('payments').select('amount, status, payment_method').execute()
    payments = resp.data or []
    completed = [p for p in payments if p['status'] == 'completed']
    by_method = {}
    for p in completed:
        m = p['payment_method']
        by_method[m] = by_method.get(m, 0) + float(p['amount'])
    return success_response({
        'total_payments': len(completed),
        'total_collected': round(sum(float(p['amount']) for p in completed), 2),
        'by_method': by_method,
    })


@dashboard_bp.get('/overdue-summary')
@require_auth
@admin_or_staff
def overdue_summary():
    from app.extensions import supabase_admin
    resp = supabase_admin.table('invoices').select(
        'id, invoice_number, amount_due, due_date'
    ).eq('status', 'overdue').execute()
    invoices = resp.data or []
    return success_response({
        'overdue_count': len(invoices),
        'overdue_amount': round(sum(float(i.get('amount_due', 0)) for i in invoices), 2),
        'invoices': invoices[:10],
    })
