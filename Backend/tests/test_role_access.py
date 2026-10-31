from datetime import date
from types import SimpleNamespace

import pytest

from app import create_app
from app.middleware import authentication
from app.routes import portal_routes


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
        ('staff', '/api/v1/portal/recommendations', 'get'),
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


def test_customer_can_load_recommendations_for_their_profile(client, monkeypatch):
    client.set_test_role('customer', customer_id='customer-one')
    expected = {'plans': [{'id': 'popular-plan'}], 'optimizer_recommendations': []}
    monkeypatch.setattr(
        portal_routes,
        'get_customer_recommendations',
        lambda customer_id: (expected, None),
    )

    response = client.get(
        '/api/v1/portal/recommendations',
        headers={'Authorization': 'Bearer customer-test-token'},
    )

    assert response.status_code == 200, response.get_json()
    assert response.get_json()['data'] == expected


def test_customer_sees_only_currently_available_plans(client, monkeypatch):
    client.set_test_role('customer', customer_id='customer-one')
    today = date.today().isoformat()
    profile = {
        'id': 'customer-user',
        'email': 'customer@example.com',
        'full_name': 'Customer',
        'role': 'customer',
        'customer_id': 'customer-one',
        'status': 'active',
    }
    plans = [
        {'id': 'available', 'status': 'active', 'start_date': today, 'end_date': None},
        {'id': 'expired', 'status': 'active', 'start_date': '2020-01-01', 'end_date': '2020-12-31'},
        {'id': 'future', 'status': 'active', 'start_date': '2999-01-01', 'end_date': None},
    ]

    class Query:
        def __init__(self, data):
            self.data = data
            self.filters = {}

        def select(self, fields):
            return self

        def eq(self, field, value):
            self.filters[field] = value
            return self

        def lte(self, field, value):
            self.filters[f'{field}_lte'] = value
            return self

        def single(self):
            return self

        def execute(self):
            if self.data is profile:
                return SimpleNamespace(data=profile)
            results = [
                plan for plan in self.data
                if plan.get('status') == self.filters.get('status')
                and plan.get('start_date') <= self.filters.get('start_date_lte')
            ]
            return SimpleNamespace(data=results)

    monkeypatch.setattr(
        authentication.supabase_admin,
        'table',
        lambda name: Query(profile if name == 'profiles' else plans),
    )

    response = client.get(
        '/api/v1/portal/plans',
        headers={'Authorization': 'Bearer customer-token'},
    )

    assert response.status_code == 200
    assert [plan['id'] for plan in response.get_json()['data']] == ['available']


def test_staff_can_create_update_archive_and_reactivate_plans(client, monkeypatch):
    from app.routes import plan_routes

    client.set_test_role('staff')
    expected = {'id': 'plan-one'}
    monkeypatch.setattr(plan_routes.plan_service, 'create_plan', lambda data: (expected, None))
    monkeypatch.setattr(
        plan_routes.plan_service, 'update_plan', lambda plan_id, data: (expected, None)
    )
    monkeypatch.setattr(
        plan_routes.plan_service, 'set_plan_status', lambda plan_id, status: (expected, None)
    )
    headers = {'Authorization': 'Bearer test-token'}

    create_response = client.post(
        '/api/v1/plans',
        json={'name': 'Standard', 'billing_interval': 'monthly', 'base_price': 20},
        headers=headers,
    )
    update_response = client.put(
        '/api/v1/plans/plan-one',
        json={'name': 'Standard Plus'},
        headers=headers,
    )
    archive_response = client.delete('/api/v1/plans/plan-one', headers=headers)
    activate_response = client.patch(
        '/api/v1/plans/plan-one/status',
        json={'status': 'active'},
        headers=headers,
    )

    assert create_response.status_code == 201
    assert update_response.status_code == 200
    assert archive_response.status_code == 200
    assert activate_response.status_code == 200


def test_customer_cannot_create_staff_plans(client, monkeypatch):
    client.set_test_role('customer', customer_id='customer-one')

    response = client.post(
        '/api/v1/plans',
        json={'name': 'Restricted', 'billing_interval': 'monthly', 'base_price': 20},
        headers={'Authorization': 'Bearer test-token'},
    )

    assert response.status_code == 403


def test_customer_purchase_uses_authenticated_customer_profile(client, monkeypatch):
    from app.routes import portal_routes

    client.set_test_role('customer', customer_id='customer-one')
    captured = {}

    def fake_purchase(customer_id, actor_id, plan_id, data):
        captured.update(
            customer_id=customer_id,
            actor_id=actor_id,
            plan_id=plan_id,
            data=data,
        )
        return {'subscription_id': 'subscription-one'}, None

    monkeypatch.setattr(portal_routes, 'purchase_plan', fake_purchase)
    response = client.post(
        '/api/v1/portal/plans/plan-one/purchase',
        json={'quantity': 1, 'payment_method': 'Cash', 'customer_id': 'customer-two'},
        headers={'Authorization': 'Bearer test-token'},
    )

    assert response.status_code == 201
    assert captured['customer_id'] == 'customer-one'
    assert captured['actor_id'] == 'customer-user'
    assert captured['plan_id'] == 'plan-one'
    assert captured['data']['customer_id'] == 'customer-two'


def test_staff_can_create_update_and_delete_subscriptions(client, monkeypatch):
    from app.routes import subscription_routes

    client.set_test_role('staff')
    expected = {'id': 'subscription-one', 'status': 'draft'}
    monkeypatch.setattr(
        subscription_routes.subscription_service,
        'create_subscription',
        lambda data: (expected, None),
    )
    monkeypatch.setattr(
        subscription_routes.subscription_service,
        'update_subscription',
        lambda subscription_id, data: (expected, None),
    )
    monkeypatch.setattr(
        subscription_routes.subscription_service,
        'delete_subscription',
        lambda subscription_id, actor_id: (
            {'id': subscription_id, 'deleted': True},
            None,
        ),
    )
    headers = {'Authorization': 'Bearer test-token'}

    create_response = client.post(
        '/api/v1/subscriptions',
        json={'customer_id': 'customer-one', 'plan_id': 'plan-one', 'quantity': 1},
        headers=headers,
    )
    update_response = client.put(
        '/api/v1/subscriptions/subscription-one',
        json={'notes': 'Updated note'},
        headers=headers,
    )
    delete_response = client.delete(
        '/api/v1/subscriptions/subscription-one',
        headers=headers,
    )

    assert create_response.status_code == 201
    assert update_response.status_code == 200
    assert delete_response.status_code == 200


def test_customer_cannot_manage_staff_subscriptions(client):
    client.set_test_role('customer', customer_id='customer-one')

    response = client.post(
        '/api/v1/subscriptions',
        json={'customer_id': 'customer-one', 'plan_id': 'plan-one', 'quantity': 1},
        headers={'Authorization': 'Bearer test-token'},
    )

    assert response.status_code == 403
