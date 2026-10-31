from types import SimpleNamespace

import pytest

from app.services import recommendation_service


def test_monthly_cost_normalizes_all_billing_intervals():
    assert recommendation_service._monthly_cost(10, 'daily') == pytest.approx(10 * 365 / 12)
    assert recommendation_service._monthly_cost(20, 'weekly') == pytest.approx(20 * 52 / 12)
    assert recommendation_service._monthly_cost(120, 'monthly', 3) == 40
    assert recommendation_service._monthly_cost(1200, 'yearly', 2) == 50


def test_recommendations_rank_plan_history_and_run_optimizer_for_existing_subscriber(monkeypatch):
    today = recommendation_service.date.today().isoformat()
    plans = [
        {
            'id': 'plan-current',
            'name': 'Annual Basic',
            'status': 'active',
            'start_date': today,
            'end_date': None,
            'billing_interval': 'yearly',
            'interval_count': 1,
            'base_price': 1200,
            'minimum_quantity': 1,
            'products': {'name': 'Brightloop', 'product_type': 'software'},
        },
        {
            'id': 'plan-alternative',
            'name': 'Monthly Plus',
            'status': 'active',
            'start_date': today,
            'end_date': None,
            'billing_interval': 'monthly',
            'interval_count': 1,
            'base_price': 60,
            'minimum_quantity': 2,
            'products': {'name': 'Brightloop Plus', 'product_type': 'software'},
        },
    ]
    history = [
        {
            'id': 'subscription-one',
            'subscription_number': 'SUB-1',
            'customer_id': 'customer-one',
            'plan_id': 'plan-current',
            'status': 'active',
            'total_amount': 1200,
            'billing_interval': 'yearly',
            'interval_count': 1,
            'start_date': '2025-01-01',
            'expiry_date': '2026-01-01',
        },
        {
            'id': 'subscription-two',
            'subscription_number': 'SUB-2',
            'customer_id': 'customer-two',
            'plan_id': 'plan-alternative',
            'status': 'active',
            'total_amount': 120,
            'billing_interval': 'monthly',
            'interval_count': 1,
        },
    ]
    plan_details = [
        {
            'id': plan['id'],
            'name': plan['name'],
            'billing_interval': plan['billing_interval'],
            'interval_count': plan['interval_count'],
            'base_price': plan['base_price'],
            'minimum_quantity': plan['minimum_quantity'],
        }
        for plan in plans
    ]

    class Query:
        def __init__(self, table):
            self.table = table
            self.selection = ''

        def select(self, fields):
            self.selection = fields
            return self

        def eq(self, field, value):
            return self

        def lte(self, field, value):
            return self

        def in_(self, field, values):
            return self

        def range(self, start, end):
            return self

        def execute(self):
            if self.table == 'subscription_plans':
                data = plans if 'products(' in self.selection else plan_details
            else:
                data = history
            return SimpleNamespace(data=data)

    class FakeSupabase:
        def table(self, name):
            return Query(name)

    class FakeModel:
        classes_ = ['upgrade', 'downgrade']

        def predict(self, rows):
            self.rows = rows
            return ['upgrade'] * len(rows)

        def predict_proba(self, rows):
            return [[0.9, 0.1] for _ in rows]

    model = FakeModel()
    monkeypatch.setattr(recommendation_service, 'supabase_admin', FakeSupabase())
    monkeypatch.setattr(recommendation_service, '_load_optimizer', lambda: model)

    result, error = recommendation_service.get_customer_recommendations('customer-one')

    assert error is None
    assert len(result['plans']) == 2
    assert next(plan for plan in result['plans'] if plan['id'] == 'plan-alternative')[
        'recommendation_reasons'
    ] == ['Chosen in 1 subscription']
    assert result['optimizer_recommendations'] == [{
        'subscription_id': 'subscription-one',
        'subscription_number': 'SUB-1',
        'current_plan_id': 'plan-current',
        'current_plan_name': 'Annual Basic',
        'alternative_plan_id': 'plan-alternative',
        'alternative_plan_name': 'Monthly Plus',
        'action': 'upgrade',
        'confidence': 0.9,
        'current_monthly_cost': 100.0,
        'alternative_monthly_cost': 120.0,
    }]
    features = model.rows[0]
    assert len(features) == 17
    assert features[:4] == [100.0, 120.0, 20.0, -0.2]


def test_new_customer_popularity_recommendations_do_not_require_optimizer(monkeypatch):
    today = recommendation_service.date.today().isoformat()
    plans = [{
        'id': 'popular-plan',
        'name': 'Popular',
        'status': 'active',
        'start_date': today,
        'end_date': None,
        'billing_interval': 'monthly',
        'interval_count': 1,
        'base_price': 50,
        'minimum_quantity': 1,
        'products': {'name': 'Brightloop', 'product_type': 'software'},
    }]
    history = [{
        'id': 'subscription-one',
        'customer_id': 'another-customer',
        'plan_id': 'popular-plan',
        'status': 'active',
        'total_amount': 50,
        'billing_interval': 'monthly',
    }]
    plan_details = [{'id': 'popular-plan', 'name': 'Popular'}]

    class Query:
        def __init__(self, table):
            self.table = table
            self.selection = ''

        def select(self, fields):
            self.selection = fields
            return self

        def eq(self, field, value):
            return self

        def lte(self, field, value):
            return self

        def in_(self, field, values):
            return self

        def range(self, start, end):
            return self

        def execute(self):
            if self.table == 'subscription_plans':
                data = plans if 'products(' in self.selection else plan_details
            else:
                data = history
            return SimpleNamespace(data=data)

    class FakeSupabase:
        def table(self, name):
            return Query(name)

    def fail_if_loaded():
        raise AssertionError('The optimizer should only load for existing subscribers')

    monkeypatch.setattr(recommendation_service, 'supabase_admin', FakeSupabase())
    monkeypatch.setattr(recommendation_service, '_load_optimizer', fail_if_loaded)

    result, error = recommendation_service.get_customer_recommendations('new-customer')

    assert error is None
    assert result['plans'][0]['id'] == 'popular-plan'
    assert result['plans'][0]['popularity_count'] == 1
    assert result['optimizer_recommendations'] == []
