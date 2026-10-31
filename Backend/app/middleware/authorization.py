"""
app/middleware/authorization.py

Role-based access-control decorators.
These are layered on top of @require_auth.
"""
from __future__ import annotations

import functools
from flask import g
from app.utils.response import error_response


def _check_role(allowed_roles):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, 'user', None)
            if not user:
                return error_response('Not authenticated', 401, 'NOT_AUTHENTICATED')
            if user['role'] not in allowed_roles:
                return error_response(
                    f"Access denied. Required roles: {allowed_roles}",
                    403,
                    'FORBIDDEN'
                )
            return f(*args, **kwargs)
        return decorated
    return decorator


def admin_only(f):
    """Only ADMIN role allowed."""
    return _check_role(['admin'])(f)


def admin_or_staff(f):
    """ADMIN or STAFF role allowed."""
    return _check_role(['admin', 'staff'])(f)


def any_authenticated(f):
    """Any authenticated user (admin, staff, customer)."""
    return _check_role(['admin', 'staff', 'customer'])(f)


def customer_only(f):
    """Only customer accounts may access customer portal endpoints."""
    return _check_role(['customer'])(f)


def require_billing_secret(f):
    """
    Protect billing execution endpoints with a dedicated secret header.
    Used by external schedulers / cron jobs.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        from flask import request, current_app
        secret = request.headers.get('X-Billing-Secret', '')
        expected = current_app.config.get('BILLING_SECRET', '')
        # Allow admin users OR valid billing secret
        user = getattr(g, 'user', None)
        if user and user['role'] == 'admin':
            return f(*args, **kwargs)
        if secret and secret == expected:
            return f(*args, **kwargs)
        return error_response('Billing secret required', 403, 'BILLING_FORBIDDEN')
    return decorated
