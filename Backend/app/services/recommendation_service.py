from __future__ import annotations
"""Customer plan recommendations and existing-subscription optimization."""

import logging
import math
from datetime import date
from functools import lru_cache
from pathlib import Path

from app.extensions import supabase_admin

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parents[2] / 'subscription_optimizer_model.pkl'
MODEL_FEATURES = (
    'current_monthly_cost',
    'alt_monthly_cost',
    'cost_difference',
    'cost_saving_ratio',
    'current_utilization_pct',
    'has_usage_data',
    'is_zero_usage',
    'alt_capacity_ratio',
    'alt_has_limit',
    'feature_overlap_count',
    'feature_coverage_ratio',
    'extra_features_count',
    'usage_frequency_val',
    'is_annual_billing',
    'commitment_months',
    'cancellation_fee',
    'historical_acceptance_rate',
)
OPTIMIZER_ACTIONS = {
    'upgrade',
    'downgrade',
    'keep_current_plan',
    'no_suitable_alternative',
    'review_unused_subscription',
    'insufficient_data',
}
ELIGIBLE_HISTORY_STATUSES = {'confirmed', 'active', 'paused', 'closed', 'cancelled', 'expired'}
MONTHLY_MULTIPLIERS = {
    'daily': 365 / 12,
    'weekly': 52 / 12,
    'monthly': 1,
    'yearly': 1 / 12,
}
HISTORY_PAGE_SIZE = 1000


@lru_cache(maxsize=1)
def _load_optimizer():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f'Subscription optimizer model not found: {MODEL_PATH}')

    import joblib

    model = joblib.load(MODEL_PATH)
    feature_names = getattr(model, 'feature_names_in_', None)
    if feature_names is None and hasattr(model, 'named_steps'):
        feature_names = getattr(model.named_steps.get('imputer'), 'feature_names_in_', None)
    if feature_names is not None and tuple(map(str, feature_names)) != MODEL_FEATURES:
        raise ValueError('Subscription optimizer model feature names do not match the supported input schema')
    return model


def _as_number(value, default=0.0):
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else default
    except (TypeError, ValueError):
        return default


def _monthly_cost(amount, interval, interval_count=1):
    monthly_multiplier = MONTHLY_MULTIPLIERS.get(interval)
    if not monthly_multiplier:
        return 0.0
    return _as_number(amount) * monthly_multiplier / max(1, int(interval_count or 1))


def _commitment_months(subscription):
    start = subscription.get('start_date')
    end = subscription.get('expiry_date')
    if not start or not end:
        return math.nan
    try:
        start_date = date.fromisoformat(start)
        end_date = date.fromisoformat(end)
        return max(0, (end_date.year - start_date.year) * 12 + end_date.month - start_date.month)
    except (TypeError, ValueError):
        return math.nan


def _model_input(subscription, current_plan, alternative_plan, acceptance_rate):
    current_interval = subscription.get('billing_interval') or current_plan.get('billing_interval')
    alternative_interval = alternative_plan.get('billing_interval')
    current_cost = _monthly_cost(
        subscription.get('total_amount'),
        current_interval,
        subscription.get('interval_count', current_plan.get('interval_count', 1)),
    )
    alternative_cost = _monthly_cost(
        _as_number(alternative_plan.get('base_price')) *
        max(1, int(alternative_plan.get('minimum_quantity') or 1)),
        alternative_interval,
        alternative_plan.get('interval_count', 1),
    )
    difference = alternative_cost - current_cost
    saving_ratio = (current_cost - alternative_cost) / current_cost if current_cost > 0 else math.nan

    values = {
        'current_monthly_cost': current_cost,
        'alt_monthly_cost': alternative_cost,
        'cost_difference': difference,
        'cost_saving_ratio': saving_ratio,
        'current_utilization_pct': math.nan,
        'has_usage_data': math.nan,
        'is_zero_usage': math.nan,
        'alt_capacity_ratio': math.nan,
        'alt_has_limit': math.nan,
        'feature_overlap_count': math.nan,
        'feature_coverage_ratio': math.nan,
        'extra_features_count': math.nan,
        'usage_frequency_val': math.nan,
        'is_annual_billing': 1.0 if current_interval == 'yearly' else 0.0,
        'commitment_months': _commitment_months(subscription),
        'cancellation_fee': math.nan,
        'historical_acceptance_rate': acceptance_rate,
    }
    return [values[name] for name in MODEL_FEATURES]


def _predict_optimizer(subscription_pairs, history):
    candidates = []
    for subscription, current_plan in subscription_pairs:
        current_monthly_cost = _monthly_cost(
            subscription.get('total_amount'),
            subscription.get('billing_interval') or current_plan.get('billing_interval'),
            subscription.get('interval_count', current_plan.get('interval_count', 1)),
        )
        for alternative in history['available_plans']:
            if alternative.get('id') == current_plan.get('id'):
                continue
            acceptance_rate = (
                history['plan_counts'].get(alternative.get('id'), 0) / history['eligible_subscription_count']
                if history['eligible_subscription_count']
                else 0.0
            )
            features = _model_input(subscription, current_plan, alternative, acceptance_rate)
            candidates.append((subscription, current_plan, alternative, current_monthly_cost, features))

    if not candidates:
        return []

    model = _load_optimizer()
    predictions = model.predict([candidate[4] for candidate in candidates])
    probabilities = model.predict_proba([candidate[4] for candidate in candidates]) \
        if hasattr(model, 'predict_proba') else None
    classes = list(getattr(model, 'classes_', []))

    recommendations = []
    for index, (subscription, current_plan, alternative, current_cost, _) in enumerate(candidates):
        action = str(predictions[index])
        if action not in OPTIMIZER_ACTIONS or action in {
            'keep_current_plan', 'no_suitable_alternative', 'insufficient_data',
        }:
            continue
        confidence = None
        if probabilities is not None and action in classes:
            confidence = round(float(probabilities[index][classes.index(action)]), 4)
        recommendations.append({
            'subscription_id': subscription.get('id'),
            'subscription_number': subscription.get('subscription_number'),
            'current_plan_id': current_plan.get('id'),
            'current_plan_name': current_plan.get('name'),
            'alternative_plan_id': alternative.get('id'),
            'alternative_plan_name': alternative.get('name'),
            'action': action,
            'confidence': confidence,
            'current_monthly_cost': round(current_cost, 2),
            'alternative_monthly_cost': round(_monthly_cost(
                _as_number(alternative.get('base_price')) *
                max(1, int(alternative.get('minimum_quantity') or 1)),
                alternative.get('billing_interval'),
                alternative.get('interval_count', 1),
            ), 2),
        })
    return recommendations


def get_customer_recommendations(customer_id: str):
    """Rank live plans by adoption and predict optimizer actions for existing subscribers."""
    today = date.today().isoformat()
    try:
        plans_response = (
            supabase_admin.table('subscription_plans')
            .select('*, products(name, product_type)')
            .eq('status', 'active')
            .lte('start_date', today)
            .execute()
        )
        available_plans = [
            plan for plan in (plans_response.data or [])
            if not plan.get('end_date') or plan['end_date'] >= today
        ]
        historical_subscriptions = []
        offset = 0
        while True:
            history_response = (
                supabase_admin.table('subscriptions')
                .select('id, customer_id, plan_id, status, total_amount, billing_interval, interval_count, start_date, expiry_date, subscription_number')
                .in_('status', list(ELIGIBLE_HISTORY_STATUSES))
                .range(offset, offset + HISTORY_PAGE_SIZE - 1)
                .execute()
            )
            page = history_response.data or []
            historical_subscriptions.extend(page)
            if len(page) < HISTORY_PAGE_SIZE:
                break
            offset += HISTORY_PAGE_SIZE
        historical_subscriptions = [
            row for row in historical_subscriptions
            if row.get('plan_id')
        ]
        plan_response = (
            supabase_admin.table('subscription_plans')
            .select('id, name, billing_interval, interval_count, base_price')
            .execute()
        )
    except Exception as error:
        logger.exception('Could not build subscription recommendations')
        return None, str(error)

    plan_details = {plan['id']: plan for plan in (plan_response.data or [])}
    plan_counts = {}
    customer_counts = {}
    own_subscriptions = []
    preference_counts = {}
    for row in historical_subscriptions:
        plan_id = row['plan_id']
        plan_counts[plan_id] = plan_counts.get(plan_id, 0) + 1
        customer_counts.setdefault(plan_id, set()).add(row.get('customer_id'))
        if row.get('customer_id') == customer_id:
            preference_counts[row.get('billing_interval')] = (
                preference_counts.get(row.get('billing_interval'), 0) + 1
            )
            if row.get('status') in {'active', 'paused'}:
                own_subscriptions.append(row)

    max_count = max(plan_counts.values(), default=0)
    max_customers = max((len(customers) for customers in customer_counts.values()), default=0)
    recommendations = []
    for plan in available_plans:
        count = plan_counts.get(plan.get('id'), 0)
        unique_customers = len(customer_counts.get(plan.get('id'), set()))
        popularity_score = (
            70 * count / max_count + 30 * unique_customers / max_customers
            if max_count and max_customers else 0
        )
        reasons = []
        if count:
            reasons.append(f'Chosen in {count} subscription{"s" if count != 1 else ""}')
        if preference_counts.get(plan.get('billing_interval')):
            reasons.append(f'Matches your {plan.get("billing_interval")} billing preference')
        if not reasons:
            reasons.append('New plan with no subscription history yet')
        product = plan.get('products') or {}
        recommendations.append({
            **plan,
            'popularity_count': count,
            'customer_count': unique_customers,
            'recommendation_score': round(popularity_score, 1),
            'recommendation_reasons': reasons,
            'product_name': product.get('name'),
        })
    recommendations.sort(
        key=lambda plan: (
            bool(preference_counts.get(plan.get('billing_interval'))),
            plan['recommendation_score'],
            plan.get('name', '').lower(),
        ),
        reverse=True,
    )

    current_plan_pairs = [
        (subscription, plan_details[subscription['plan_id']])
        for subscription in own_subscriptions
        if subscription.get('plan_id') in plan_details
    ]
    try:
        optimizer_recommendations = _predict_optimizer(current_plan_pairs, {
            'available_plans': available_plans,
            'plan_counts': plan_counts,
            'eligible_subscription_count': len(historical_subscriptions),
        })
    except Exception as error:
        logger.exception('Subscription optimizer model prediction failed')
        return None, f'Subscription optimization is unavailable: {error}'

    return {
        'plans': recommendations,
        'optimizer_recommendations': optimizer_recommendations,
    }, None
