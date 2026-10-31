"""
app/routes/plan_routes.py
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import plan_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

plan_bp = Blueprint('plans', __name__)


@plan_bp.get('')
@require_auth
@admin_or_staff
def list_plans():
    page, per_page, _ = get_pagination_params()
    status = request.args.get('status', 'all')
    data, pagination, err = plan_service.list_plans(status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@plan_bp.post('')
@require_auth
@admin_or_staff
def create_plan():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name', 'billing_interval', 'base_price'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = plan_service.create_plan(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Plan created')


@plan_bp.get('/<plan_id>')
@require_auth
@admin_or_staff
def get_plan(plan_id):
    result, err = plan_service.get_plan(plan_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@plan_bp.put('/<plan_id>')
@require_auth
@admin_or_staff
def update_plan(plan_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = plan_service.update_plan(plan_id, data)
    if err:
        return error_response(err, 400)
    return success_response(result, 'Plan updated')


@plan_bp.delete('/<plan_id>')
@require_auth
@admin_or_staff
def delete_plan(plan_id):
    result, err = plan_service.set_plan_status(plan_id, 'archived')
    if err:
        return error_response(err, 400)
    return success_response(None, 'Plan archived')


@plan_bp.patch('/<plan_id>/status')
@require_auth
@admin_or_staff
def set_plan_status(plan_id):
    data = request.get_json(force=True, silent=True) or {}
    status = data.get('status', 'active')
    result, err = plan_service.set_plan_status(plan_id, status)
    if err:
        return error_response(err, 400)
    return success_response(result, f'Plan status set to {status}')
