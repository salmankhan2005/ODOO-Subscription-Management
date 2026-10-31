"""
app/routes/report_routes.py
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import report_service
from app.utils.response import success_response, error_response
from app.utils.pagination import get_pagination_params

report_bp = Blueprint('reports', __name__)


def _filters():
    return {
        'date_from': request.args.get('date_from'),
        'date_to': request.args.get('date_to'),
    }


@report_bp.get('/revenue')
@require_auth
@admin_or_staff
def revenue():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    customer_id = request.args.get('customer_id')
    data, pagination, err = report_service.revenue_report(f['date_from'], f['date_to'], customer_id, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/subscriptions')
@require_auth
@admin_or_staff
def subscriptions():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    status = request.args.get('status')
    data, pagination, err = report_service.subscription_report(f['date_from'], f['date_to'], status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/payments')
@require_auth
@admin_or_staff
def payments():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    method = request.args.get('method')
    data, pagination, err = report_service.payment_report(f['date_from'], f['date_to'], method, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/invoices')
@require_auth
@admin_or_staff
def invoices():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    status = request.args.get('status')
    customer_id = request.args.get('customer_id')
    data, pagination, err = report_service.invoice_report(f['date_from'], f['date_to'], status, customer_id, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/overdue')
@require_auth
@admin_or_staff
def overdue():
    page, per_page, _ = get_pagination_params()
    data, pagination, err = report_service.overdue_report(page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/customers')
@require_auth
@admin_or_staff
def customers():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    status = request.args.get('status')
    data, pagination, err = report_service.customer_report(f['date_from'], f['date_to'], status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/products')
@require_auth
@admin_or_staff
def products():
    page, per_page, _ = get_pagination_params()
    data, pagination, err = report_service.product_report(page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@report_bp.get('/discounts')
@require_auth
@admin_or_staff
def discounts():
    page, per_page, _ = get_pagination_params()
    f = _filters()
    data, pagination, err = report_service.discount_usage_report(f['date_from'], f['date_to'], page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)
