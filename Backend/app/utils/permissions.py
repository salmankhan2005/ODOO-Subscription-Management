"""
app/utils/permissions.py — Ownership-check helpers to prevent IDOR.
"""

from flask import g
from app.utils.response import error_response


def customer_can_access(resource_customer_id: str):
    """
    Returns an error response tuple if the current user is a customer
    and is trying to access another customer's resource.
    Returns None if access is permitted.
    """
    user = getattr(g, 'user', None)
    if not user:
        return error_response('Not authenticated', 401, 'NOT_AUTHENTICATED')

    if user['role'] == 'customer':
        if user.get('customer_id') != resource_customer_id:
            return error_response('You do not have access to this resource', 403, 'FORBIDDEN')
    return None


def get_customer_filter(requested_customer_id: str = None) -> str | None:
    """
    For customer role: always return their own customer_id.
    For admin/staff: return the requested_customer_id filter (may be None = all).
    """
    user = getattr(g, 'user', None)
    if not user:
        return None
    if user['role'] == 'customer':
        return user.get('customer_id')
    return requested_customer_id
