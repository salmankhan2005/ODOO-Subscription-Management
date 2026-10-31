"""
app/services/subscription_service.py
"""
from __future__ import annotations

import logging
from datetime import date
from app.extensions import supabase_admin
from app.utils.date_utils import calculate_next_billing_date, str_to_date, date_to_str
from app.utils.validators import validate_subscription_transition
from app.utils.pagination import build_pagination_meta
from app.utils.pricing import calculate_line_totals

logger = logging.getLogger(__name__)


def _generate_subscription_number() -> str:
    year = date.today().year
    resp = supabase_admin.rpc('next_sequence_value', {'p_key': 'subscription'}).execute()
    seq = resp.data if resp.data else 1
    return f'SUB-{year}-{str(seq).zfill(4)}'


def list_subscriptions(customer_id: str = None, status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('subscriptions').select(
            '*, subscription_lines(*), customers(name, email, company_name), '
            'subscription_plans(name, billing_interval)',
            count='exact',
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
        customer_resp = supabase_admin.table('customers').select(
            'id, status'
        ).eq('id', data['customer_id']).single().execute()
        if not customer_resp.data or customer_resp.data.get('status') != 'active':
            return None, 'An active customer profile is required'

        plan_id = data.get('plan_id')
        plan = None
        if plan_id:
            plan_resp = supabase_admin.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
            plan = plan_resp.data
            if not plan:
                return None, 'Plan not found'
            if plan.get('status') != 'active':
                return None, 'Only active plans can be used for new subscriptions'

        interval = plan['billing_interval'] if plan else data.get('billing_interval', 'monthly')
        interval_count = int(
            (plan.get('interval_count') if plan else data.get('interval_count', 1)) or 1
        )
        if interval_count < 1:
            return None, 'Billing interval count must be at least one'

        today = date.today()
        start_date = str_to_date(data.get('start_date', today.isoformat()))
        if data.get('expiry_date'):
            expiry_date = str_to_date(data['expiry_date'])
            if expiry_date < start_date:
                return None, 'Expiry date cannot be before the subscription start date'
        else:
            expiry_date = None

        if plan:
            start_date_str = date_to_str(start_date)
            if plan.get('start_date') and plan['start_date'] > start_date_str:
                return None, 'The selected plan is not available on the subscription start date'
            if plan.get('end_date') and plan['end_date'] < start_date_str:
                return None, 'The selected plan is no longer available on the subscription start date'

        next_billing = calculate_next_billing_date(start_date, interval, interval_count)
        lines = data.get('lines', [])
        if plan and not lines:
            try:
                quantity = int(data.get('quantity', plan.get('minimum_quantity') or 1))
            except (TypeError, ValueError):
                return None, 'Quantity must be a whole number'
            minimum_quantity = int(plan.get('minimum_quantity') or 1)
            if quantity < minimum_quantity or quantity > 10000:
                return None, f'Quantity must be between {minimum_quantity} and 10000'

            product_id = plan.get('product_id')
            product_name = plan.get('name', 'Subscription plan')
            if product_id:
                product_resp = supabase_admin.table('products').select(
                    'name'
                ).eq('id', product_id).single().execute()
                product_name = (product_resp.data or {}).get('name') or product_name

            unit_price = float(plan.get('base_price') or 0)
            tax_response = supabase_admin.table('tax_rules').select(
                'percentage, applicable_product_ids, start_date, end_date'
            ).eq('status', 'active').lte('start_date', start_date.isoformat()).execute()
            tax_rate = sum(
                float(rule.get('percentage') or 0)
                for rule in (tax_response.data or [])
                if (not rule.get('end_date') or rule['end_date'] >= start_date.isoformat())
                and (
                    not rule.get('applicable_product_ids')
                    or not product_id
                    or product_id in rule['applicable_product_ids']
                )
            )
            totals = calculate_line_totals(unit_price, quantity, tax_rate)
            lines = [{
                'product_id': product_id,
                'description': f'{product_name} — {plan["name"]}',
                'quantity': quantity,
                'unit_price': unit_price,
                'tax_rate': tax_rate,
                **totals,
            }]

        sub_num = _generate_subscription_number()
        line_subtotal = sum(float(line.get('subtotal', 0)) for line in lines)
        line_discount = sum(float(line.get('discount_amount', 0)) for line in lines)
        line_tax = sum(float(line.get('tax_amount', 0)) for line in lines)
        line_total = sum(float(line.get('line_total', 0)) for line in lines)

        payload = {
            'subscription_number': sub_num,
            'customer_id': data['customer_id'],
            'plan_id': plan_id,
            'quotation_id': data.get('quotation_id'),
            'billing_interval': interval,
            'interval_count': interval_count,
            'start_date': date_to_str(start_date),
            'expiry_date': date_to_str(expiry_date) if expiry_date else None,
            'next_billing_date': date_to_str(next_billing),
            'payment_terms': data.get('payment_terms', 'Due on receipt'),
            'currency': data.get('currency', 'USD'),
            'subtotal': line_subtotal if lines else float(data.get('subtotal', 0)),
            'discount_amount': line_discount if lines else float(data.get('discount_amount', 0)),
            'tax_amount': line_tax if lines else float(data.get('tax_amount', 0)),
            'total_amount': line_total if lines else float(data.get('total_amount', 0)),
            'auto_renew': bool(data.get('auto_renew', True)),
            'notes': data.get('notes', ''),
            'status': 'draft',
        }
        resp = supabase_admin.table('subscriptions').insert(payload).execute()
        subscription = resp.data[0] if resp.data else None
        if not subscription:
            return None, 'Failed to create subscription'

        # Insert lines
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


def update_subscription(subscription_id: str, data: dict):
    """Update non-financial subscription details without rewriting billing history."""
    sub, err = get_subscription(subscription_id)
    if err:
        return None, err

    allowed = {'payment_terms', 'auto_renew', 'notes', 'currency', 'expiry_date'}
    payload = {key: value for key, value in data.items() if key in allowed}
    if not payload:
        return None, 'No editable subscription fields were provided'
    if 'payment_terms' in payload and not isinstance(payload['payment_terms'], str):
        return None, 'Payment terms must be text'
    if 'notes' in payload and not isinstance(payload['notes'], str):
        return None, 'Notes must be text'
    if 'auto_renew' in payload and not isinstance(payload['auto_renew'], bool):
        return None, 'Auto-renew must be true or false'
    if 'expiry_date' in payload and payload['expiry_date']:
        try:
            expiry_date = str_to_date(payload['expiry_date'])
            if expiry_date < str_to_date(sub['start_date']):
                return None, 'Expiry date cannot be before the subscription start date'
        except (TypeError, ValueError):
            return None, 'Expiry date must be a valid date'

    try:
        response = supabase_admin.table('subscriptions').update(payload).eq(
            'id', subscription_id
        ).execute()
        if not response.data:
            return None, 'Subscription update did not return a record'
        _log_event(subscription_id, 'updated', 'Subscription details updated')
        return get_subscription(subscription_id)[0], None
    except Exception as error:
        logger.exception('update_subscription: %s', error)
        return None, str(error)


def delete_subscription(subscription_id: str, actor_id: str = None):
    """Delete an unbilled draft, otherwise preserve billing history via cancellation/closure."""
    sub, err = get_subscription(subscription_id)
    if err:
        return None, err

    try:
        invoices = supabase_admin.table('invoices').select('id').eq(
            'subscription_id', subscription_id
        ).execute()
        has_invoices = bool(invoices.data)
        status = sub['status']

        if status == 'draft' and not has_invoices:
            supabase_admin.table('subscriptions').delete().eq(
                'id', subscription_id
            ).execute()
            return {'id': subscription_id, 'deleted': True}, None

        target = 'closed' if status in ('active', 'paused') else 'cancelled'
        if target not in ('closed', 'cancelled') or not validate_subscription_transition(status, target):
            return None, (
                f'Subscription in status "{status}" cannot be deleted; '
                'its billing history has been retained'
            )
        return transition_subscription(
            subscription_id,
            target,
            'Deleted by an administrator or staff member; billing history retained',
            actor_id,
            enforce_plan_policy=False,
        )
    except Exception as error:
        logger.exception('delete_subscription: %s', error)
        return None, str(error)


def transition_subscription(
    subscription_id: str,
    target_status: str,
    notes: str = '',
    actor_id: str = None,
    enforce_plan_policy: bool = True,
):
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
    if enforce_plan_policy and target_status == 'paused' and not plan.get('allow_pause', True):
        return None, 'This plan does not allow pausing'
    if enforce_plan_policy and target_status == 'cancelled' and not plan.get('allow_early_cancel', True):
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
