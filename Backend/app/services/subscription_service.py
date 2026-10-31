"""
app/services/subscription_service.py
"""

import logging
from datetime import date
from app.extensions import supabase_admin
from app.utils.date_utils import calculate_next_billing_date, str_to_date, date_to_str
from app.utils.validators import validate_subscription_transition
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)


def _generate_subscription_number() -> str:
    year = date.today().year
    resp = supabase_admin.rpc('next_sequence_value', {'p_key': 'subscription'}).execute()
    seq = resp.data if resp.data else 1
    return f'SUB-{year}-{str(seq).zfill(4)}'


def list_subscriptions(customer_id: str = None, status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('subscriptions').select(
            '*, subscription_lines(*), customers(name, email, company_name)', count='exact'
        )
        if status and status != 'all':
            query = query.eq('status', status)
        if customer_id:
            query = query.eq('customer_id', customer_id)
        query = query.order('created_at', desc=True)
        offset = (page - 1) * per_page
        resp = query.range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        logger.exception('list_subscriptions: %s', e)
        return None, None, str(e)


def get_subscription(subscription_id: str):
    try:
        resp = supabase_admin.table('subscriptions').select(
            '*, subscription_lines(*), customers(name, email, company_name), subscription_plans(*)'
        ).eq('id', subscription_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Subscription not found'


def create_subscription(data: dict):
    try:
        plan_id = data.get('plan_id')
        plan = None
        if plan_id:
            plan_resp = supabase_admin.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
            plan = plan_resp.data

        interval = plan['billing_interval'] if plan else data.get('billing_interval', 'monthly')
        interval_count = plan['interval_count'] if plan else int(data.get('interval_count', 1))

        today = date.today()
        start_date = str_to_date(data.get('start_date', today.isoformat()))
        next_billing = calculate_next_billing_date(start_date, interval, interval_count)

        sub_num = _generate_subscription_number()

        payload = {
            'subscription_number': sub_num,
            'customer_id': data['customer_id'],
            'plan_id': plan_id,
            'quotation_id': data.get('quotation_id'),
            'billing_interval': interval,
            'interval_count': interval_count,
            'start_date': date_to_str(start_date),
            'expiry_date': data.get('expiry_date'),
            'next_billing_date': date_to_str(next_billing),
            'payment_terms': data.get('payment_terms', 'Due on receipt'),
            'currency': data.get('currency', 'USD'),
            'subtotal': float(data.get('subtotal', 0)),
            'discount_amount': float(data.get('discount_amount', 0)),
            'tax_amount': float(data.get('tax_amount', 0)),
            'total_amount': float(data.get('total_amount', 0)),
            'auto_renew': bool(data.get('auto_renew', True)),
            'notes': data.get('notes', ''),
            'status': 'draft',
        }
        resp = supabase_admin.table('subscriptions').insert(payload).execute()
        subscription = resp.data[0] if resp.data else None
        if not subscription:
            return None, 'Failed to create subscription'

        # Insert lines
        lines = data.get('lines', [])
        for line in lines:
            supabase_admin.table('subscription_lines').insert({
                'subscription_id': subscription['id'],
                'product_id': line.get('product_id'),
                'variant_id': line.get('variant_id'),
                'description': line.get('description', ''),
                'quantity': int(line.get('quantity', 1)),
                'unit_price': float(line.get('unit_price', 0)),
                'tax_rate': float(line.get('tax_rate', 0)),
                'tax_amount': float(line.get('tax_amount', 0)),
                'discount_amount': float(line.get('discount_amount', 0)),
                'subtotal': float(line.get('subtotal', 0)),
                'line_total': float(line.get('line_total', 0)),
            }).execute()

        _log_event(subscription['id'], 'created', 'Subscription created')
        return get_subscription(subscription['id'])[0], None
    except Exception as e:
        logger.exception('create_subscription: %s', e)
        return None, str(e)


def transition_subscription(subscription_id: str, target_status: str, notes: str = '', actor_id: str = None):
    """
    Perform a validated status transition.
    Enforces state machine rules and plan-level permissions.
    """
    sub, err = get_subscription(subscription_id)
    if err:
        return None, err

    current = sub['status']
    if not validate_subscription_transition(current, target_status):
        return None, f'Invalid transition: {current} → {target_status}'

    plan = sub.get('subscription_plans') or {}

    # Plan-level permission checks
    if target_status == 'paused' and not plan.get('allow_pause', True):
        return None, 'This plan does not allow pausing'
    if target_status == 'cancelled' and not plan.get('allow_early_cancel', True):
        return None, 'This plan does not allow early cancellation'

    try:
        update_payload = {'status': target_status}

        # If activating, ensure billing dates are set
        if target_status == 'active':
            interval = sub['billing_interval']
            count = sub.get('interval_count', 1)
            today = date.today()
            if not sub.get('next_billing_date') or str_to_date(sub['next_billing_date']) < today:
                update_payload['next_billing_date'] = date_to_str(
                    calculate_next_billing_date(today, interval, count)
                )

        supabase_admin.table('subscriptions').update(update_payload).eq('id', subscription_id).execute()
        _log_event(subscription_id, target_status, notes or f'Status changed to {target_status}', actor_id)
        return get_subscription(subscription_id)[0], None
    except Exception as e:
        logger.exception('transition_subscription: %s', e)
        return None, str(e)


def renew_subscription(subscription_id: str):
    sub, err = get_subscription(subscription_id)
    if err:
        return None, err

    plan = sub.get('subscription_plans') or {}
    if not plan.get('allow_renewal', True):
        return None, 'This plan does not allow renewal'

    if sub['status'] not in ('active', 'expired'):
        return None, 'Only active or expired subscriptions can be renewed'

    try:
        interval = sub['billing_interval']
        count = sub.get('interval_count', 1)
        current_next = str_to_date(sub['next_billing_date']) if sub.get('next_billing_date') else date.today()
        new_next = calculate_next_billing_date(current_next, interval, count)

        supabase_admin.table('subscriptions').update({
            'status': 'active',
            'next_billing_date': date_to_str(new_next),
        }).eq('id', subscription_id).execute()

        _log_event(subscription_id, 'renewed', f'Renewed. Next billing: {new_next}')
        return get_subscription(subscription_id)[0], None
    except Exception as e:
        return None, str(e)


def get_subscription_history(subscription_id: str):
    try:
        resp = supabase_admin.table('subscription_events').select('*').eq(
            'subscription_id', subscription_id
        ).order('created_at', desc=True).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)


def _log_event(subscription_id: str, event_type: str, description: str = '', actor_id: str = None):
    try:
        supabase_admin.table('subscription_events').insert({
            'subscription_id': subscription_id,
            'event_type': event_type,
            'description': description,
            'actor_id': actor_id,
        }).execute()
    except Exception as e:
        logger.warning('Failed to log subscription event: %s', e)
