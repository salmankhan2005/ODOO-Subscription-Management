"""
app/routes/auth_routes.py
"""
from __future__ import annotations

from flask import Blueprint, request, g, current_app
from app.middleware.authentication import require_auth
from app.services import auth_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields, validate_email

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/register')
def register():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['email', 'password', 'full_name'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')

    result, err = auth_service.register_customer(data)
    if err:
        status = 409 if 'already registered' in err else 400
        return error_response(err, status, 'REGISTRATION_ERROR')

    return created_response(result, 'Account created successfully')


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '')
    password = data.get('password', '')
    if not email or not password:
        return error_response('Email and password are required', 400, 'VALIDATION_ERROR')

    result, err = auth_service.login_user(email, password)
    if err:
        return error_response(err, 401, 'LOGIN_FAILED')

    return success_response(result, 'Login successful')


@auth_bp.post('/logout')
@require_auth
def logout():
    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token')
    if not refresh_token:
        return error_response('refresh_token is required', 400, 'VALIDATION_ERROR')
    ok, err = auth_service.logout_user(g.token, refresh_token)
    if err:
        return error_response(err, 500, 'LOGOUT_ERROR')
    return success_response(None, 'Logged out successfully')


@auth_bp.post('/forgot-password')
def forgot_password():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '')
    if not email or not validate_email(email):
        return error_response('Valid email address is required', 400, 'VALIDATION_ERROR')
    redirect = data.get('redirect_url', current_app.config.get('FRONTEND_URL', '') + '/reset-password')
    ok, err = auth_service.forgot_password(email, redirect)
    # Always return 200 to prevent email enumeration
    return success_response(None, 'If that email exists, a reset link has been sent')


@auth_bp.post('/reset-password')
def reset_password():
    # Password reset handled by Supabase redirect + client-side token update
    return success_response(None, 'Use the link from your email to reset your password')


@auth_bp.get('/me')
@require_auth
def me():
    return success_response(g.user, 'User profile')


@auth_bp.post('/refresh')
def refresh():
    data = request.get_json(force=True, silent=True) or {}
    refresh_tok = data.get('refresh_token', '')
    if not refresh_tok:
        return error_response('refresh_token is required', 400, 'VALIDATION_ERROR')
    result, err = auth_service.refresh_token(refresh_tok)
    if err:
        return error_response(err, 401, 'REFRESH_FAILED')
    return success_response(result, 'Token refreshed')
