"""
app/routes/payment_routes.py
"""
from __future__ import annotations

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import payment_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

payment_bp = Blueprint('payments', __name__)


@payment_bp.get('')
@require_auth
@admin_or_staff
def list_payments():
    page, per_page, _ = get_pagination_params()
    customer_id = request.args.get('customer_id')
    data, pagination, err = payment_service.list_payments(customer_id, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@payment_bp.post('')
@require_auth
@admin_or_staff
def record_payment():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['invoice_id', 'amount'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = payment_service.record_payment(data)
    if err:
        return error_response(err, 422, 'PAYMENT_ERROR')
    return created_response(result, 'Payment recorded successfully')


@payment_bp.get('/<payment_id>')
@require_auth
@admin_or_staff
def get_payment(payment_id):
    result, err = payment_service.get_payment(payment_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@payment_bp.put('/<payment_id>')
@require_auth
@admin_or_staff
def update_payment(payment_id):
    data = request.get_json(force=True, silent=True) or {}
    from app.extensions import supabase_admin
    allowed = ['notes', 'transaction_reference']
    payload = {k: v for k, v in data.items() if k in allowed}
    resp = supabase_admin.table('payments').update(payload).eq('id', payment_id).execute()
    return success_response(resp.data[0] if resp.data else None, 'Payment updated')


@payment_bp.post('/<payment_id>/refund')
@require_auth
@admin_or_staff
def refund_payment(payment_id):
    data = request.get_json(force=True, silent=True) or {}
    reason = data.get('reason', '')
    result, err = payment_service.refund_payment(payment_id, reason)
    if err:
        return error_response(err, 422, 'REFUND_ERROR')
    return success_response(result, 'Payment refunded')


@payment_bp.get('/<payment_id>/allocations')
@require_auth
@admin_or_staff
def get_allocations(payment_id):
    data, err = payment_service.get_payment_allocations(payment_id)
    if err:
        return error_response(err, 500)
    return success_response(data)
