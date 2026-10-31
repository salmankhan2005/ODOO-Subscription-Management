from datetime import date
from types import SimpleNamespace

from app.services import portal_purchase_service


def test_purchase_creates_active_subscription_paid_invoice_and_manual_payment(monkeypatch):
    writes = []
    plan = {
        'id': 'plan-one',
        'name': 'Standard',
        'product_id': 'product-one',
        'base_price': 20,
        'billing_interval': 'monthly',
        'interval_count': 1,
        'minimum_quantity': 1,
        'status': 'active',
    }
    customer = {
        'id': 'customer-one',
        'status': 'active',
        'billing_address': '1 Main Street',
        'country': 'US',
    }

    class Query:
        def __init__(self, table):
            self.table = table
            self.operation = 'select'
            self.payload = None

        def select(self, fields):
            self.operation = 'select'
            return self

        def eq(self, field, value):
            return self

        def lte(self, field, value):
            return self

        def single(self):
            return self

        def insert(self, payload):
            self.operation = 'insert'
            self.payload = payload
            return self

        def update(self, payload):
            self.operation = 'update'
            self.payload = payload
            return self

        def execute(self):
            writes.append((self.table, self.operation, self.payload))
            if self.table == 'subscription_plans':
                return SimpleNamespace(data=plan)
            if self.table == 'customers' and self.operation == 'select':
                return SimpleNamespace(data=customer)
            if self.table == 'products':
                return SimpleNamespace(data={'name': 'Brightloop'})
            if self.table == 'tax_rules':
                return SimpleNamespace(data=[])
            if self.table == 'subscriptions' and self.operation == 'insert':
                return SimpleNamespace(data=[{'id': 'subscription-one'}])
            if self.table == 'payments' and self.operation == 'insert':
                return SimpleNamespace(data=[{'id': 'payment-one'}])
            return SimpleNamespace(data=[])

    class FakeSupabase:
        def table(self, name):
            return Query(name)

        def rpc(self, name, params):
            return SimpleNamespace(execute=lambda: SimpleNamespace(data=1))

    monkeypatch.setattr(portal_purchase_service, 'supabase_admin', FakeSupabase())
    monkeypatch.setattr(portal_purchase_service, '_generate_payment_ref', lambda: 'PAY-TEST-1')
    monkeypatch.setattr(
        portal_purchase_service.invoice_service,
        'create_invoice_from_subscription',
        lambda subscription_id, start_date: ({'id': 'invoice-one'}, None),
    )

    result, error = portal_purchase_service.purchase_plan(
        customer_id='customer-one',
        actor_id='customer-user',
        plan_id='plan-one',
        data={
            'quantity': 2,
            'payment_method': 'Bank Transfer',
            'transaction_reference': 'transfer-123',
            'billing_address': '2 Main Street',
            'country': 'US',
            'notes': 'Purchased online',
        },
    )

    assert error is None
    assert result == {
        'subscription_id': 'subscription-one',
        'subscription_number': f'SUB-{date.today().year}-0001',
        'invoice_id': 'invoice-one',
        'payment_id': 'payment-one',
        'payment_reference': 'PAY-TEST-1',
        'total_amount': 40.0,
    }
    assert ('subscriptions', 'update', {'status': 'active'}) in writes
    assert ('invoices', 'update', {
        'amount_paid': 40.0,
        'amount_due': 0,
        'status': 'paid',
    }) in writes
    payment = next(
        payload for table, operation, payload in writes
        if table == 'payments' and operation == 'insert'
    )
    assert payment['payment_method'] == 'Bank Transfer'
    assert payment['transaction_reference'] == 'transfer-123'
    assert payment['amount'] == 40.0
