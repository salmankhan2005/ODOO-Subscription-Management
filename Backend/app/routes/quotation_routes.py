"""
app/routes/quotation_routes.py
"""
from __future__ import annotations

from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import quotation_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

quotation_bp = Blueprint('quotations', __name__)


@quotation_bp.get('')
@require_auth
@admin_or_staff
def list_quotations():
    page, per_page, _ = get_pagination_params()
    status = request.args.get('status', 'all')
    customer_id = request.args.get('customer_id')
    data, pagination, err = quotation_service.list_quotations(customer_id, status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@quotation_bp.post('')
@require_auth
@admin_or_staff
def create_quotation():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['customer_id'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = quotation_service.create_quotation(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Quotation created')


@quotation_bp.get('/<quotation_id>')
@require_auth
@admin_or_staff
def get_quotation(quotation_id):
    result, err = quotation_service.get_quotation(quotation_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@quotation_bp.put('/<quotation_id>')
@require_auth
@admin_or_staff
def update_quotation(quotation_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = quotation_service.update_quotation(quotation_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Quotation updated')


@quotation_bp.post('/<quotation_id>/confirm')
@require_auth
@admin_or_staff
def confirm_quotation(quotation_id):
    result, err = quotation_service.confirm_quotation(quotation_id)
    if err:
        return error_response(err, 422, 'BUSINESS_RULE_ERROR')
    return success_response(result, 'Quotation confirmed')


@quotation_bp.post('/<quotation_id>/convert-to-subscription')
@require_auth
@admin_or_staff
def convert_quotation(quotation_id):
    result, err = quotation_service.convert_to_subscription(quotation_id)
    if err:
        return error_response(err, 422, 'CONVERSION_ERROR')
    return created_response(result, 'Quotation converted to subscription')


@quotation_bp.post('/<quotation_id>/cancel')
@require_auth
@admin_or_staff
def cancel_quotation(quotation_id):
    result, err = quotation_service.cancel_quotation(quotation_id)
    if err:
        return error_response(err, 422, 'BUSINESS_RULE_ERROR')
    return success_response(result, 'Quotation cancelled')
