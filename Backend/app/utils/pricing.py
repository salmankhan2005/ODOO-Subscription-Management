"""
app/utils/pricing.py — Decimal-safe pricing calculations.

All monetary arithmetic uses Python's `Decimal` to prevent floating-point
rounding errors on financial totals.
"""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


CENTS = Decimal('0.01')


def to_decimal(value) -> Decimal:
    """Convert a value to Decimal safely."""
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def round_money(value: Decimal) -> Decimal:
    """Round to 2 decimal places using banker's rounding standard."""
    return value.quantize(CENTS, rounding=ROUND_HALF_UP)


def calculate_line_totals(unit_price, quantity, tax_rate=0, discount_amount=0) -> dict:
    """
    Calculate all monetary fields for a single line item.

    Returns a dict with:
        subtotal        — unit_price × quantity (before tax/discount)
        discount_amount — the provided discount amount
        taxable_amount  — subtotal - discount_amount
        tax_amount      — taxable_amount × tax_rate / 100
        line_total      — taxable_amount + tax_amount
    """
    up = to_decimal(unit_price)
    qty = to_decimal(quantity)
    tax_r = to_decimal(tax_rate)
    disc = to_decimal(discount_amount)

    subtotal = round_money(up * qty)
    disc = round_money(disc)
    taxable = round_money(subtotal - disc)
    tax_amount = round_money(taxable * tax_r / Decimal('100'))
    line_total = round_money(taxable + tax_amount)

    return {
        'subtotal': float(subtotal),
        'discount_amount': float(disc),
        'tax_amount': float(tax_amount),
        'line_total': float(line_total),
    }


def calculate_invoice_totals(lines: list) -> dict:
    """
    Aggregate line totals into invoice totals.
    Each line must have subtotal, discount_amount, tax_amount, line_total.
    """
    subtotal = sum(to_decimal(l.get('subtotal', 0)) for l in lines)
    discount_total = sum(to_decimal(l.get('discount_amount', 0)) for l in lines)
    tax_total = sum(to_decimal(l.get('tax_amount', 0)) for l in lines)
    total = sum(to_decimal(l.get('line_total', 0)) for l in lines)

    return {
        'subtotal': float(round_money(subtotal)),
        'discount_total': float(round_money(discount_total)),
        'tax_total': float(round_money(tax_total)),
        'total_amount': float(round_money(total)),
    }


def apply_percentage_discount(amount, pct) -> Decimal:
    return round_money(to_decimal(amount) * to_decimal(pct) / Decimal('100'))


def apply_fixed_discount(amount, fixed) -> Decimal:
    a = to_decimal(amount)
    f = to_decimal(fixed)
    return round_money(min(a, f))
