from types import SimpleNamespace

from app.services import subscription_service


def test_delete_removes_unbilled_draft_subscription(monkeypatch):
    subscription = {'id': 'sub-one', 'status': 'draft'}
    deleted = []

    class Query:
        def select(self, fields):
            return self

        def eq(self, field, value):
            return self

        def execute(self):
            return SimpleNamespace(data=[])

        def delete(self):
            deleted.append(True)
            return self

    class FakeSupabase:
        def table(self, name):
            return Query()

    monkeypatch.setattr(subscription_service, 'get_subscription', lambda sub_id: (subscription, None))
    monkeypatch.setattr(subscription_service, 'supabase_admin', FakeSupabase())

    result, error = subscription_service.delete_subscription('sub-one', 'staff-one')

    assert error is None
    assert result == {'id': 'sub-one', 'deleted': True}
    assert deleted == [True]


def test_delete_closes_billed_active_subscription_and_retains_history(monkeypatch):
    subscription = {'id': 'sub-one', 'status': 'active'}
    captured = {}

    class Query:
        def select(self, fields):
            return self

        def eq(self, field, value):
            return self

        def execute(self):
            return SimpleNamespace(data=[{'id': 'invoice-one'}])

    class FakeSupabase:
        def table(self, name):
            return Query()

    def transition(subscription_id, target, notes, actor_id, enforce_plan_policy=True):
        captured.update(
            id=subscription_id,
            target=target,
            actor=actor_id,
            enforce_plan_policy=enforce_plan_policy,
        )
        return {'id': subscription_id, 'status': target}, None

    monkeypatch.setattr(subscription_service, 'get_subscription', lambda sub_id: (subscription, None))
    monkeypatch.setattr(subscription_service, 'supabase_admin', FakeSupabase())
    monkeypatch.setattr(subscription_service, 'transition_subscription', transition)

    result, error = subscription_service.delete_subscription('sub-one', 'staff-one')

    assert error is None
    assert result['status'] == 'closed'
    assert captured == {
        'id': 'sub-one',
        'target': 'closed',
        'actor': 'staff-one',
        'enforce_plan_policy': False,
    }
