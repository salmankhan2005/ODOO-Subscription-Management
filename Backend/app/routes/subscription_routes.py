"""
app/routes/subscription_routes.py
"""

from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import subscription_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

subscription_bp = Blueprint('subscriptions', __name__)


@subscription_bp.get('')
@require_auth
@admin_or_staff
def list_subscriptions():
    page, per_page, _ = get_pagination_params()
    status = request.args.get('status', 'all')
    customer_id = request.args.get('customer_id')
    data, pagination, err = subscription_service.list_subscriptions(customer_id, status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@subscription_bp.post('')
@require_auth
@admin_or_staff
def create_subscription():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['customer_id'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    result, err = subscription_service.create_subscription(data)
    if err:
        return error_response(err, 400)
    return created_response(result, 'Subscription created')


@subscription_bp.get('/<subscription_id>')
@require_auth
@admin_or_staff
def get_subscription(subscription_id):
    result, err = subscription_service.get_subscription(subscription_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@subscription_bp.put('/<subscription_id>')
@require_auth
@admin_or_staff
def update_subscription(subscription_id):
    data = request.get_json(force=True, silent=True) or {}
    result, err = subscription_service.update_subscription(subscription_id, data)
    if err:
        return error_response(err, 400, 'UPDATE_ERROR')
    return success_response(result, 'Subscription updated')


@subscription_bp.delete('/<subscription_id>')
@require_auth
@admin_or_staff
def delete_subscription(subscription_id):
    result, err = subscription_service.delete_subscription(
        subscription_id, g.user['id']
    )
    if err:
        return error_response(err, 422, 'DELETE_ERROR')
    message = (
        'Draft subscription deleted'
        if result.get('deleted')
        else f'Subscription is now {result.get("status", "closed")}; billing history retained'
    )
    return success_response(result, message)


def _transition(subscription_id, target):
    data = request.get_json(force=True, silent=True) or {}
    notes = data.get('notes', data.get('reason', ''))
    result, err = subscription_service.transition_subscription(
        subscription_id, target, notes, g.user['id']
    )
    if err:
        return error_response(err, 422, 'TRANSITION_ERROR')
    return success_response(result, f'Subscription is now {target}')


@subscription_bp.post('/<subscription_id>/confirm')
@require_auth
@admin_or_staff
def confirm(subscription_id):
    return _transition(subscription_id, 'confirmed')


@subscription_bp.post('/<subscription_id>/activate')
@require_auth
@admin_or_staff
def activate(subscription_id):
    return _transition(subscription_id, 'active')


@subscription_bp.post('/<subscription_id>/pause')
@require_auth
@admin_or_staff
def pause(subscription_id):
    return _transition(subscription_id, 'paused')


@subscription_bp.post('/<subscription_id>/resume')
@require_auth
@admin_or_staff
def resume(subscription_id):
    return _transition(subscription_id, 'active')


@subscription_bp.post('/<subscription_id>/cancel')
@require_auth
@admin_or_staff
def cancel(subscription_id):
    return _transition(subscription_id, 'cancelled')


@subscription_bp.post('/<subscription_id>/close')
@require_auth
@admin_or_staff
def close(subscription_id):
    return _transition(subscription_id, 'closed')


@subscription_bp.post('/<subscription_id>/renew')
@require_auth
@admin_or_staff
def renew(subscription_id):
    result, err = subscription_service.renew_subscription(subscription_id)
    if err:
        return error_response(err, 422, 'RENEW_ERROR')
    return success_response(result, 'Subscription renewed')


@subscription_bp.get('/<subscription_id>/history')
@require_auth
@admin_or_staff
def history(subscription_id):
    data, err = subscription_service.get_subscription_history(subscription_id)
    if err:
        return error_response(err, 500)
    return success_response(data)
