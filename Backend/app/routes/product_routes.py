"""
app/routes/product_routes.py
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only, admin_or_staff
from app.services import product_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

product_bp = Blueprint('products', __name__)


@product_bp.get('')
@require_auth
@admin_or_staff
def list_products():
    page, per_page, _ = get_pagination_params()
    search = request.args.get('search', '')
    status = request.args.get('status', 'all')
    data, pagination, err = product_service.list_products(search, status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@product_bp.post('')
@require_auth
@admin_only
def create_product():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = product_service.create_product(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Product created')


@product_bp.get('/<product_id>')
@require_auth
@admin_or_staff
def get_product(product_id):
    result, err = product_service.get_product(product_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@product_bp.put('/<product_id>')
@require_auth
@admin_only
def update_product(product_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = product_service.update_product(product_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Product updated')


@product_bp.delete('/<product_id>')
@require_auth
@admin_only
def delete_product(product_id):
    result, err = product_service.deactivate_product(product_id)
    if err:
        return error_response(err, 400)
    return success_response(None, 'Product archived')


@product_bp.get('/<product_id>/variants')
@require_auth
@admin_or_staff
def list_variants(product_id):
    data, err = product_service.list_variants(product_id)
    if err:
        return error_response(err, 500)
    return success_response(data)


@product_bp.post('/<product_id>/variants')
@require_auth
@admin_only
def create_variant(product_id):
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = product_service.create_variant(product_id, data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Variant added')


# Note: variant-level routes registered separately in __init__.py via /variants prefix
from flask import Blueprint as _BP
variant_bp = _BP('variants', __name__)

@variant_bp.put('/<variant_id>')
@require_auth
@admin_only
def update_variant(variant_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = product_service.update_variant(variant_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Variant updated')


@variant_bp.delete('/<variant_id>')
@require_auth
@admin_only
def delete_variant(variant_id):
    ok, err = product_service.delete_variant(variant_id)
    if err:
        return error_response(err, 400)
    return success_response(None, 'Variant archived')
