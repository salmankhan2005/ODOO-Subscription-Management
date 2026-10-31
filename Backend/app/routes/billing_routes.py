"""
app/routes/billing_routes.py
"""
from __future__ import annotations

from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only, admin_or_staff, require_billing_secret
from app.services import billing_service
from app.utils.response import success_response, error_response
from app.utils.pagination import get_pagination_params

billing_bp = Blueprint('billing', __name__)


@billing_bp.post('/run')
@require_auth
@require_billing_secret
def run_billing():
    """
    Execute the recurring billing cycle.
    Protected by admin role OR X-Billing-Secret header (for cron schedulers).
    """
    triggered_by = getattr(g, 'user', {}).get('email', 'scheduler') if hasattr(g, 'user') else 'scheduler'
    result, err = billing_service.run_billing(triggered_by)
    if err:
        return error_response(err, 500, 'BILLING_RUN_ERROR')
    return success_response(result, 'Billing run completed')


@billing_bp.get('/runs')
@require_auth
@admin_or_staff
def list_runs():
    page, per_page, _ = get_pagination_params()
    data, pagination, err = billing_service.list_billing_runs(page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@billing_bp.get('/runs/<run_id>')
@require_auth
@admin_or_staff
def get_run(run_id):
    result, err = billing_service.get_billing_run(run_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@billing_bp.get('/due-subscriptions')
@require_auth
@admin_or_staff
def due_subscriptions():
    data, err = billing_service.get_due_subscriptions()
    if err:
        return error_response(err, 500)
    return success_response(data)


@billing_bp.get('/preview')
@require_auth
@admin_or_staff
def preview():
    data, err = billing_service.preview_due_subscriptions()
    if err:
        return error_response(err, 500)
    return success_response(data)


@billing_bp.post('/retry/<run_item_id>')
@require_auth
@admin_only
def retry_item(run_item_id):
    result, err = billing_service.retry_billing_run_item(run_item_id)
    if err:
        return error_response(err, 422, 'RETRY_ERROR')
    return success_response(result, 'Retry completed')
