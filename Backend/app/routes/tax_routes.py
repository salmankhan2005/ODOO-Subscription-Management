"""
app/routes/tax_routes.py
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only, admin_or_staff
from app.services import tax_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields

tax_bp = Blueprint('taxes', __name__)


@tax_bp.get('')
@require_auth
@admin_or_staff
def list_taxes():
    status = request.args.get('status', 'all')
    data, err = tax_service.list_taxes(status)
    if err:
        return error_response(err, 500)
    return success_response(data)


@tax_bp.post('')
@require_auth
@admin_only
def create_tax():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name', 'percentage'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = tax_service.create_tax(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Tax rule created')


@tax_bp.get('/<tax_id>')
@require_auth
@admin_or_staff
def get_tax(tax_id):
    result, err = tax_service.get_tax(tax_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@tax_bp.put('/<tax_id>')
@require_auth
@admin_only
def update_tax(tax_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = tax_service.update_tax(tax_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Tax rule updated')


@tax_bp.delete('/<tax_id>')
@require_auth
@admin_only
def delete_tax(tax_id):
    ok, err = tax_service.delete_tax(tax_id)
    if err:
        return error_response(err, 400)
    return success_response(None, 'Tax rule deactivated')


@tax_bp.post('/calculate')
@require_auth
@admin_or_staff
def calculate_tax():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get('product_id', '')
    amount = float(data.get('amount', 0))
    result = tax_service.calculate_tax_for_product(product_id, amount)
    return success_response(result)
