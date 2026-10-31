"""
tests/test_billing.py — Billing engine unit tests.
"""

import pytest
from app.utils.date_utils import calculate_next_billing_date
from app.utils.pricing import calculate_line_totals, calculate_invoice_totals
from datetime import date


def test_monthly_billing_date():
    d = date(2026, 1, 31)
    result = calculate_next_billing_date(d, 'monthly', 1)
    # Jan 31 + 1 month = Feb 28 (2026 is not a leap year)
    assert result == date(2026, 2, 28)


def test_yearly_billing_date_leap():
    d = date(2024, 2, 29)
    result = calculate_next_billing_date(d, 'yearly', 1)
    # Feb 29 2024 + 1 year = Feb 28 2025
    assert result == date(2025, 2, 28)


def test_monthly_billing_normal():
    d = date(2026, 3, 15)
    result = calculate_next_billing_date(d, 'monthly', 1)
    assert result == date(2026, 4, 15)


def test_every_2_months():
    d = date(2026, 1, 1)
    result = calculate_next_billing_date(d, 'monthly', 2)
    assert result == date(2026, 3, 1)


def test_weekly_billing():
    d = date(2026, 1, 1)
    result = calculate_next_billing_date(d, 'weekly', 1)
    assert result == date(2026, 1, 8)


def test_daily_billing():
    d = date(2026, 1, 1)
    result = calculate_next_billing_date(d, 'daily', 1)
    assert result == date(2026, 1, 2)


def test_line_totals_with_tax():
    result = calculate_line_totals(unit_price=100, quantity=2, tax_rate=18, discount_amount=0)
    assert result['subtotal'] == 200.0
    assert result['tax_amount'] == 36.0
    assert result['line_total'] == 236.0


def test_line_totals_with_discount():
    result = calculate_line_totals(unit_price=100, quantity=1, tax_rate=10, discount_amount=10)
    assert result['subtotal'] == 100.0
    assert result['discount_amount'] == 10.0
    # taxable = 90, tax = 9
    assert result['tax_amount'] == 9.0
    assert result['line_total'] == 99.0


def test_invoice_totals_aggregation():
    lines = [
        {'subtotal': 200, 'discount_amount': 0, 'tax_amount': 36, 'line_total': 236},
        {'subtotal': 100, 'discount_amount': 10, 'tax_amount': 9, 'line_total': 99},
    ]
    result = calculate_invoice_totals(lines)
    assert result['subtotal'] == 300.0
    assert result['discount_total'] == 10.0
    assert result['tax_total'] == 45.0
    assert result['total_amount'] == 335.0
