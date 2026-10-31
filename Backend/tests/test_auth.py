"""
tests/test_auth.py — Basic auth endpoint tests.
Run with: pytest tests/ -v
"""

import pytest
from app import create_app


@pytest.fixture
def app():
    application = create_app()
    application.config['TESTING'] = True
    return application


@pytest.fixture
def client(app):
    return app.test_client()


def test_health(client):
    resp = client.get('/api/v1/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['success'] is True


def test_register_missing_fields(client):
    resp = client.post('/api/v1/auth/register', json={'email': 'test@example.com'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['success'] is False


def test_register_invalid_password(client):
    resp = client.post('/api/v1/auth/register', json={
        'email': 'test@example.com',
        'password': 'weak',
        'full_name': 'Test User'
    })
    assert resp.status_code == 400
    assert resp.get_json()['success'] is False


def test_login_missing_credentials(client):
    resp = client.post('/api/v1/auth/login', json={})
    assert resp.status_code == 400


def test_forgot_password_invalid_email(client):
    resp = client.post('/api/v1/auth/forgot-password', json={'email': 'not-an-email'})
    assert resp.status_code == 400


def test_forgot_password_valid_email(client):
    # Should always return 200 (prevent email enumeration)
    resp = client.post('/api/v1/auth/forgot-password', json={'email': 'nonexistent@example.com'})
    assert resp.status_code == 200


def test_protected_route_without_token(client):
    resp = client.get('/api/v1/auth/me')
    assert resp.status_code == 401


def test_customers_without_auth(client):
    resp = client.get('/api/v1/customers')
    assert resp.status_code == 401


def test_admin_only_route_without_auth(client):
    resp = client.post('/api/v1/staff', json={})
    assert resp.status_code == 401


def test_billing_run_without_auth_or_secret(client):
    resp = client.post('/api/v1/billing/run')
    assert resp.status_code == 401
