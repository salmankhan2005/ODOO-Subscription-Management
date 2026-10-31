from types import SimpleNamespace

import pytest

from app import create_app
from app.middleware import authentication


@pytest.fixture
def client(monkeypatch):
    app = create_app()
    app.config['TESTING'] = True
    app_client = app.test_client()

    def set_role(role, customer_id=None):
        auth_user = SimpleNamespace(id=f'{role}-user', email=f'{role}@example.com')
        profile = {
            'id': auth_user.id,
            'email': auth_user.email,
            'full_name': role.title(),
            'role': role,
            'customer_id': customer_id,
            'status': 'active',
        }

        class ProfileQuery:
            def select(self, fields):
                return self

            def eq(self, field, value):
                return self

            def single(self):
                return self

            def execute(self):
                return SimpleNamespace(data=profile)

        monkeypatch.setattr(
            authentication.supabase_admin.auth,
            'get_user',
            lambda token: SimpleNamespace(user=auth_user),
        )
        monkeypatch.setattr(
            authentication.supabase_admin,
            'table',
            lambda name: ProfileQuery(),
        )

    app_client.set_test_role = set_role
    return app_client


@pytest.mark.parametrize(
    ('role', 'path', 'method'),
    [
        ('staff', '/api/v1/portal/plans', 'get'),
        ('customer', '/api/v1/staff', 'get'),
        ('staff', '/api/v1/dashboard/revenue-summary', 'get'),
        ('staff', '/api/v1/dashboard/customer', 'get'),
    ],
)
def test_users_cannot_access_another_roles_portal(client, role, path, method):
    client.set_test_role(role)

    response = getattr(client, method)(
        path,
        headers={'Authorization': 'Bearer test-token'},
    )

    assert response.status_code == 403


def test_customer_cannot_read_another_customers_subscription(client, monkeypatch):
    client.set_test_role('customer', customer_id='customer-one')

    class SubscriptionQuery:
        def select(self, fields):
            return self

        def eq(self, field, value):
            return self

        def single(self):
            return self

        def execute(self):
            return SimpleNamespace(data={
                'id': 'subscription-two',
                'customer_id': 'customer-two',
            })

    monkeypatch.setattr(
        authentication.supabase_admin,
        'table',
        lambda name: SubscriptionQuery(),
    )

    response = client.get(
        '/api/v1/portal/subscriptions/subscription-two',
        headers={'Authorization': 'Bearer test-token'},
    )

    assert response.status_code == 403
