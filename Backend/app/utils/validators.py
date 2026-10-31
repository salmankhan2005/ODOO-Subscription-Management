"""
app/utils/validators.py — Input validation helpers.
"""
from __future__ import annotations

import re
from typing import Any


PASSWORD_RE = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+={}\[\]:;"\'<>,.?/\\|`~\-]).{9,}$'
)
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def validate_password(password: str) -> list[str]:
    """
    Returns a list of validation errors.
    Empty list means the password is valid.
    """
    errors = []
    if len(password) < 9:
        errors.append('Password must be at least 9 characters long')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter')
    if not re.search(r'[!@#$%^&*()_+={}\[\]:;"\'<>,.?/\\|`~\-]', password):
        errors.append('Password must contain at least one special character')
    return errors


def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email.strip()))


def require_fields(data: dict, fields: list[str]) -> list[str]:
    """Return list of missing required field names."""
    return [f for f in fields if data.get(f) is None or data.get(f) == '']


def validate_positive_number(value: Any, field_name: str = 'value') -> str | None:
    """Return an error string or None if valid."""
    try:
        v = float(value)
        if v < 0:
            return f'{field_name} must be non-negative'
        return None
    except (TypeError, ValueError):
        return f'{field_name} must be a valid number'


VALID_BILLING_INTERVALS = {'daily', 'weekly', 'monthly', 'yearly'}
VALID_SUBSCRIPTION_STATUSES = {
    'draft', 'quotation', 'confirmed', 'active', 'paused', 'closed', 'cancelled', 'expired'
}
VALID_INVOICE_STATUSES = {
    'draft', 'confirmed', 'paid', 'partially_paid', 'overdue', 'cancelled'
}

# Valid state transitions for subscriptions
SUBSCRIPTION_TRANSITIONS = {
    'draft': {'quotation', 'confirmed', 'cancelled'},
    'quotation': {'confirmed', 'cancelled'},
    'confirmed': {'active', 'cancelled'},
    'active': {'paused', 'cancelled', 'closed', 'expired'},
    'paused': {'active', 'cancelled', 'closed'},
    'expired': {'cancelled'},
    'closed': set(),
    'cancelled': set(),
}


def validate_subscription_transition(current: str, target: str) -> bool:
    return target in SUBSCRIPTION_TRANSITIONS.get(current, set())
