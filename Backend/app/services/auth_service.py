"""
app/services/auth_service.py

Handles all authentication operations via Supabase Auth.
"""
from __future__ import annotations

import logging
from app.extensions import create_supabase_anon_client, supabase_admin
from app.utils.validators import validate_password, validate_email, require_fields

logger = logging.getLogger(__name__)


def register_customer(data: dict) -> tuple[dict, str | None]:
    """
    Register a new customer account.
    Returns (result_dict, error_message).
    """
    # Validate required fields
    missing = require_fields(data, ['email', 'password', 'full_name'])
    if missing:
        return None, f'Missing required fields: {", ".join(missing)}'

    email = data['email'].strip().lower()
    password = data['password']
    full_name = data['full_name'].strip()

    if not validate_email(email):
        return None, 'Invalid email address'

    errors = validate_password(password)
    if errors:
        return None, '; '.join(errors)

    user = None
    try:
        # Create Supabase Auth user
        auth_resp = supabase_admin.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,  # auto-confirm for now; enable email verify in production
            'user_metadata': {'full_name': full_name, 'role': 'customer'},
        })
        user = auth_resp.user
        if not user:
            return None, 'Failed to create user account'

        # Insert into customers table
        customer_data = {
            'name': full_name,
            'email': email,
            'phone': data.get('phone', ''),
            'company_name': data.get('company_name', ''),
            'billing_address': data.get('billing_address', ''),
            'country': data.get('country', ''),
            'tax_id': data.get('tax_id', ''),
            'status': 'active',
        }
        cust_resp = supabase_admin.table('customers').insert(customer_data).execute()
        customer = cust_resp.data[0] if cust_resp.data else {}

        # Insert profile
        profile_data = {
            'id': user.id,
            'email': email,
            'full_name': full_name,
            'role': 'customer',
            'customer_id': customer.get('id'),
        }
        supabase_admin.table('profiles').insert(profile_data).execute()

        return {
            'user_id': user.id,
            'email': email,
            'full_name': full_name,
            'role': 'customer',
            'customer_id': customer.get('id'),
        }, None

    except Exception as e:
        logger.exception('Registration error: %s', e)
        if user:
            try:
                supabase_admin.auth.admin.delete_user(user.id)
            except Exception:
                logger.exception('Could not roll back Auth user after customer registration failed')
        msg = str(e)
        if 'already registered' in msg.lower() or 'duplicate' in msg.lower():
            return None, 'Email address is already registered'
        return None, 'Registration failed. Please try again.'


def login_user(email: str, password: str) -> tuple[dict, str | None]:
    """
    Authenticate with Supabase and return access/refresh tokens.
    """
    try:
        auth_client = create_supabase_anon_client()
        resp = auth_client.auth.sign_in_with_password({'email': email.strip().lower(), 'password': password})
        session = resp.session
        user = resp.user
        if not session or not user:
            return None, 'Invalid email or password'

        # Fetch profile
        profile_resp = supabase_admin.table('profiles').select('*').eq('id', user.id).single().execute()
        profile = profile_resp.data or {}
        if not profile:
            return None, 'Account profile is unavailable. Contact an administrator.'
        if profile.get('role') not in ('admin', 'staff', 'customer'):
            return None, 'Account role is invalid. Contact an administrator.'
        if profile.get('status', 'active') != 'active':
            return None, 'This account is inactive. Contact an administrator.'
        if profile.get('role') == 'customer' and not profile.get('customer_id'):
            return None, 'Customer profile is not linked. Contact an administrator.'

        return {
            'access_token': session.access_token,
            'refresh_token': session.refresh_token,
            'expires_at': session.expires_at,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': profile.get('role', 'customer'),
                'full_name': profile.get('full_name', ''),
                'customer_id': profile.get('customer_id'),
            }
        }, None
    except Exception as e:
        logger.exception('Login error: %s', e)
        return None, 'Invalid email or password'


def logout_user(token: str, refresh_token: str) -> tuple[bool, str | None]:
    """Revoke only the caller's current Supabase session."""
    try:
        auth_client = create_supabase_anon_client()
        auth_client.auth.set_session(token, refresh_token)
        auth_client.auth.sign_out({'scope': 'local'})
        return True, None
    except Exception as e:
        logger.exception('Logout error: %s', e)
        return False, 'Logout failed'


def forgot_password(email: str, redirect_url: str) -> tuple[bool, str | None]:
    """Trigger Supabase password reset email."""
    try:
        auth_client = create_supabase_anon_client()
        auth_client.auth.reset_password_email(email.strip().lower(), {'redirect_to': redirect_url})
        return True, None
    except Exception as e:
        logger.exception('Forgot password error: %s', e)
        return False, 'Could not send reset email'


def refresh_token(refresh_tok: str) -> tuple[dict, str | None]:
    """Refresh access token using the refresh token."""
    try:
        auth_client = create_supabase_anon_client()
        resp = auth_client.auth.refresh_session(refresh_tok)
        session = resp.session
        if not session:
            return None, 'Could not refresh session'
        if not session.user:
            return None, 'Could not validate refreshed user'
        profile_resp = (
            supabase_admin.table('profiles')
            .select('role, status, customer_id')
            .eq('id', session.user.id)
            .single()
            .execute()
        )
        profile = profile_resp.data or {}
        if (
            profile.get('role') not in ('admin', 'staff', 'customer')
            or profile.get('status', 'active') != 'active'
            or (profile.get('role') == 'customer' and not profile.get('customer_id'))
        ):
            return None, 'Account is unavailable'
        return {
            'access_token': session.access_token,
            'refresh_token': session.refresh_token,
            'expires_at': session.expires_at,
        }, None
    except Exception as e:
        logger.exception('Token refresh error: %s', e)
        return None, 'Session refresh failed'


def create_staff_account(data: dict, created_by_id: str) -> tuple[dict, str | None]:
    """Admin-only: create a staff account."""
    missing = require_fields(data, ['email', 'password', 'full_name'])
    if missing:
        return None, f'Missing required fields: {", ".join(missing)}'

    email = data['email'].strip().lower()
    password = data['password']
    full_name = data['full_name'].strip()
    role = data.get('role', 'staff')
    if role not in ('staff', 'admin'):
        return None, 'Role must be staff or admin'

    if not validate_email(email):
        return None, 'Invalid email address'

    errors = validate_password(password)
    if errors:
        return None, '; '.join(errors)

    user = None
    try:
        auth_resp = supabase_admin.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {'full_name': full_name, 'role': role},
        })
        user = auth_resp.user
        if not user:
            return None, 'Failed to create staff account'

        profile_data = {
            'id': user.id,
            'email': email,
            'full_name': full_name,
            'role': role,
            'phone': data.get('phone', ''),
            'created_by': created_by_id,
        }
        supabase_admin.table('profiles').insert(profile_data).execute()

        return {
            'user_id': user.id,
            'email': email,
            'full_name': full_name,
            'role': role,
        }, None
    except Exception as e:
        logger.exception('Staff creation error: %s', e)
        if user:
            try:
                supabase_admin.auth.admin.delete_user(user.id)
            except Exception:
                logger.exception('Could not roll back Auth user after staff profile creation failed')
        msg = str(e)
        if 'already registered' in msg.lower() or 'duplicate' in msg.lower():
            return None, 'Email address is already registered'
        return None, 'Failed to create staff account'
