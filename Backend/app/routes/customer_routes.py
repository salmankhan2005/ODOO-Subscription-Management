"""
app/routes/customer_routes.py
"""

from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import customer_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

customer_bp = Blueprint('customers', __name__)


@customer_bp.get('')
@require_auth
@admin_or_staff
def list_customers():
    page, per_page, _ = get_pagination_params()
    search = request.args.get('search', '')
    status = request.args.get('status', 'all')
    data, pagination, err = customer_service.list_customers(search, status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@customer_bp.post('')
@require_auth
@admin_or_staff
def create_customer():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name', 'email'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = customer_service.create_customer(data)
    if err:
        status = 409 if 'already exists' in err else 400
        return error_response(err, status, 'CUSTOMER_ERROR')
    return created_response(result, 'Customer created')


@customer_bp.get('/<customer_id>')
@require_auth
@admin_or_staff
def get_customer(customer_id):
    result, err = customer_service.get_customer(customer_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@customer_bp.put('/<customer_id>')
@require_auth
@admin_or_staff
def update_customer(customer_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = customer_service.update_customer(customer_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Customer updated')


@customer_bp.delete('/<customer_id>')
@require_auth
@admin_or_staff
def delete_customer(customer_id):
    result, err = customer_service.deactivate_customer(customer_id)
    if err:
        return error_response(err, 400)
    return success_response(None, 'Customer deactivated')


@customer_bp.get('/<customer_id>/subscriptions')
@require_auth
@admin_or_staff
def customer_subscriptions(customer_id):
    from app.services.subscription_service import list_subscriptions
    page, per_page, _ = get_pagination_params()
    data, pagination, err = list_subscriptions(customer_id=customer_id, page=page, per_page=per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@customer_bp.get('/<customer_id>/invoices')
@require_auth
@admin_or_staff
def customer_invoices(customer_id):
    from app.services.invoice_service import list_invoices
    page, per_page, _ = get_pagination_params()
    data, pagination, err = list_invoices(customer_id=customer_id, page=page, per_page=per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@customer_bp.get('/<customer_id>/payments')
@require_auth
@admin_or_staff
def customer_payments(customer_id):
    from app.services.payment_service import list_payments
    page, per_page, _ = get_pagination_params()
    data, pagination, err = list_payments(customer_id=customer_id, page=page, per_page=per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@customer_bp.get('/<customer_id>/balance')
@require_auth
@admin_or_staff
def customer_balance(customer_id):
    result, err = customer_service.get_customer_balance(customer_id)
    if err:
        return error_response(err, 500)
    return success_response(result)
