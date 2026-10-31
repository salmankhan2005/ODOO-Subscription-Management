"""
app/routes/discount_routes.py
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only, admin_or_staff
from app.services import discount_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields

discount_bp = Blueprint('discounts', __name__)


@discount_bp.get('')
@require_auth
@admin_only
def list_discounts():
    status = request.args.get('status', 'all')
    data, err = discount_service.list_discounts(status)
    if err:
        return error_response(err, 500)
    return success_response(data)


@discount_bp.post('')
@require_auth
@admin_only
def create_discount():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name', 'discount_type', 'value'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = discount_service.create_discount(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Discount rule created')


@discount_bp.get('/<discount_id>')
@require_auth
@admin_only
def get_discount(discount_id):
    result, err = discount_service.get_discount(discount_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@discount_bp.put('/<discount_id>')
@require_auth
@admin_only
def update_discount(discount_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = discount_service.update_discount(discount_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Discount updated')


@discount_bp.delete('/<discount_id>')
@require_auth
@admin_only
def delete_discount(discount_id):
    ok, err = discount_service.delete_discount(discount_id)
    if err:
        return error_response(err, 400)
    return success_response(None, 'Discount disabled')


@discount_bp.post('/validate')
@require_auth
@admin_or_staff
def validate_discount():
    data = request.get_json(force=True, silent=True) or {}
    code = data.get('code', '')
    product_ids = data.get('product_ids', [])
    amount = float(data.get('amount', 0))
    quantity = int(data.get('quantity', 1))
    if not code:
        return error_response('Discount code is required', 400, 'VALIDATION_ERROR')
    result, err = discount_service.validate_discount(code, product_ids, amount, quantity)
    if err:
        return error_response(err, 422, 'DISCOUNT_INVALID')
    return success_response(result, 'Discount is valid')


@discount_bp.get('/<discount_id>/usage')
@require_auth
@admin_only
def get_usage(discount_id):
    data, err = discount_service.get_discount_usage(discount_id)
    if err:
        return error_response(err, 500)
    return success_response(data)
