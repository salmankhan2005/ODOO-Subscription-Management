"""
app/utils/date_utils.py — Billing date and interval calculation helpers.

Handles month-end edge cases, leap years, and all billing intervals.
"""

from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


def calculate_next_billing_date(from_date: date, interval: str, interval_count: int = 1) -> date:
    """
    Calculate the next billing date from `from_date` using the given interval.

    Args:
        from_date: The reference date (usually start_date or current next_billing_date).
        interval: One of 'daily', 'weekly', 'monthly', 'yearly'.
        interval_count: How many intervals to advance (e.g. 2 for every 2 months).

    Returns:
        The next billing date as a `date` object.

    Month-end handling: adding 1 month to Jan 31 → Feb 28/29, handled by relativedelta.
    Leap-year handling: adding 1 year to Feb 29 → Feb 28 on non-leap years.
    """
    interval = interval.lower()
    if interval == 'daily':
        return from_date + timedelta(days=interval_count)
    elif interval == 'weekly':
        return from_date + timedelta(weeks=interval_count)
    elif interval == 'monthly':
        return from_date + relativedelta(months=interval_count)
    elif interval == 'yearly':
        return from_date + relativedelta(years=interval_count)
    else:
        raise ValueError(f'Unknown billing interval: {interval}')


def is_due_for_billing(next_billing_date: date, as_of: date = None) -> bool:
    """Return True if the subscription is due for billing on or before `as_of`."""
    if as_of is None:
        as_of = date.today()
    return next_billing_date <= as_of


def days_until(target_date: date, as_of: date = None) -> int:
    """Return number of days until target_date from as_of (negative if past)."""
    if as_of is None:
        as_of = date.today()
    return (target_date - as_of).days


def date_to_str(d: date) -> str:
    return d.isoformat()


def str_to_date(s: str) -> date:
    return date.fromisoformat(s)
