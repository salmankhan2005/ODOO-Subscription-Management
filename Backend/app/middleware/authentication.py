"""
app/middleware/authentication.py

Verifies Supabase JWT access tokens sent in the Authorization header.
Injects `g.user` (dict with id, email, role) for downstream handlers.
"""
from __future__ import annotations

import functools
from flask import request, g
from app.utils.response import error_response
from app.extensions import supabase_admin


def _extract_token() -> str | None:
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None


def _get_user_profile(user_id: str) -> dict | None:
    """Fetch profile row from the `profiles` table."""
    try:
        res = supabase_admin.table('profiles').select('*').eq('id', user_id).single().execute()
        return res.data
    except Exception:
        return None


def require_auth(f):
    """
    Decorator — validates Supabase JWT and attaches g.user.
    Usage: @require_auth
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_token()
        if not token:
            return error_response('Authentication token missing', 401, 'AUTH_TOKEN_MISSING')

        try:
            # Validate via Supabase admin — get_user verifies the JWT signature
            user_resp = supabase_admin.auth.get_user(token)
            supabase_user = user_resp.user
            if not supabase_user:
                return error_response('Invalid or expired token', 401, 'AUTH_INVALID_TOKEN')
        except Exception as e:
            return error_response('Token validation failed', 401, 'AUTH_INVALID_TOKEN')

        # Fetch application profile (role, display name, etc.)
        profile = _get_user_profile(supabase_user.id)
        if not profile:
            return error_response('User profile not found', 401, 'PROFILE_NOT_FOUND')
        if profile.get('status', 'active') != 'active':
            return error_response('This account is inactive', 403, 'PROFILE_INACTIVE')
        if profile.get('role') not in ('admin', 'staff', 'customer'):
            return error_response('Account role is invalid', 403, 'PROFILE_INVALID_ROLE')

        g.user = {
            'id': supabase_user.id,
            'email': supabase_user.email,
            'role': profile.get('role', 'customer'),
            'name': profile.get('full_name', ''),
            'customer_id': profile.get('customer_id'),
            'profile': profile,
        }
        g.token = token

        return f(*args, **kwargs)
    return decorated
