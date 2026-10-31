"""
tests/test_permissions.py — Role-based access control tests.
"""

import pytest
from app import create_app


@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def test_admin_only_discounts_without_auth(client):
    resp = client.get('/api/v1/discounts')
    assert resp.status_code == 401


def test_admin_only_create_staff_without_auth(client):
    resp = client.post('/api/v1/staff', json={'email': 'x@x.com', 'password': 'P@ssword1', 'full_name': 'X'})
    assert resp.status_code == 401


def test_billing_run_without_secret(client):
    resp = client.post('/api/v1/billing/run')
    assert resp.status_code == 401


def test_billing_run_with_wrong_secret(client):
    resp = client.post(
        '/api/v1/billing/run',
        headers={'X-Billing-Secret': 'wrong-secret'}
    )
    # Without auth token, should be 401 first
    assert resp.status_code == 401


def test_portal_without_auth(client):
    resp = client.get('/api/v1/portal/profile')
    assert resp.status_code == 401


def test_portal_subscriptions_without_auth(client):
    resp = client.get('/api/v1/portal/subscriptions')
    assert resp.status_code == 401


def test_validators_password():
    from app.utils.validators import validate_password
    errors = validate_password('weak')
    assert len(errors) > 0

    errors_strong = validate_password('Str0ng@Pass!')
    assert len(errors_strong) == 0


def test_validators_email():
    from app.utils.validators import validate_email
    assert validate_email('valid@example.com') is True
    assert validate_email('not-an-email') is False
    assert validate_email('@nodomain.com') is False


def test_subscription_transitions():
    from app.utils.validators import validate_subscription_transition
    assert validate_subscription_transition('draft', 'confirmed') is True
    assert validate_subscription_transition('active', 'paused') is True
    assert validate_subscription_transition('cancelled', 'active') is False
    assert validate_subscription_transition('paid', 'active') is False
    assert validate_subscription_transition('active', 'expired') is True
