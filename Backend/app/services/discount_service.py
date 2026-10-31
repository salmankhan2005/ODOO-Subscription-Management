"""
app/services/discount_service.py
"""

import logging
from datetime import date
from app.extensions import supabase_admin

logger = logging.getLogger(__name__)


def list_discounts(status: str = 'all'):
    try:
        query = supabase_admin.table('discount_rules').select('*')
        if status and status != 'all':
            query = query.eq('status', status)
        resp = query.order('created_at', desc=True).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)


def get_discount(discount_id: str):
    try:
        resp = supabase_admin.table('discount_rules').select('*').eq('id', discount_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Discount not found'


def create_discount(data: dict):
    try:
        payload = {
            'name': data['name'],
            'code': data.get('code', '').upper() or None,
            'discount_type': data.get('discount_type', 'percentage'),
            'value': float(data['value']),
            'minimum_purchase': float(data.get('minimum_purchase', 0)),
            'minimum_quantity': int(data.get('minimum_quantity', 1)),
            'applicable_product_ids': data.get('applicable_product_ids', []),
            'applicable_subscriptions': bool(data.get('applicable_subscriptions', True)),
            'start_date': data.get('start_date', date.today().isoformat()),
            'end_date': data.get('end_date'),
            'max_usage': int(data.get('max_usage', 0)),
            'current_usage_count': 0,
            'status': 'active',
        }
        resp = supabase_admin.table('discount_rules').insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def update_discount(discount_id: str, data: dict):
    try:
        allowed = [
            'name', 'code', 'discount_type', 'value', 'minimum_purchase',
            'minimum_quantity', 'applicable_product_ids', 'applicable_subscriptions',
            'start_date', 'end_date', 'max_usage', 'status'
        ]
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = supabase_admin.table('discount_rules').update(payload).eq('id', discount_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def delete_discount(discount_id: str):
    try:
        supabase_admin.table('discount_rules').update({'status': 'disabled'}).eq('id', discount_id).execute()
        return True, None
    except Exception as e:
        return False, str(e)


def validate_discount(code: str, product_ids: list, amount: float, quantity: int) -> tuple[dict, str | None]:
    """
    Validate a discount code and return the applicable discount amount.
    Returns (result_dict, error_string).
    result_dict keys: discount_id, discount_name, discount_type, discount_value, discount_amount
    """
    today = date.today().isoformat()
    try:
        resp = supabase_admin.table('discount_rules').select('*').eq('code', code.upper()).eq('status', 'active').execute()
        rules = resp.data or []
        if not rules:
            return None, 'Discount code not found or inactive'

        rule = rules[0]

        # Date validation
        if rule.get('start_date') and rule['start_date'] > today:
            return None, 'Discount is not yet active'
        if rule.get('end_date') and rule['end_date'] < today:
            return None, 'Discount code has expired'

        # Usage limit
        max_usage = rule.get('max_usage', 0)
        if max_usage > 0 and rule.get('current_usage_count', 0) >= max_usage:
            return None, 'Discount usage limit has been reached'

        # Minimum purchase
        if amount < float(rule.get('minimum_purchase', 0)):
            return None, f"Minimum purchase of ${rule['minimum_purchase']} required"

        # Minimum quantity
        if quantity < int(rule.get('minimum_quantity', 1)):
            return None, f"Minimum quantity of {rule['minimum_quantity']} required"

        # Product applicability
        applicable_products = rule.get('applicable_product_ids') or []
        if applicable_products and not any(p in applicable_products for p in product_ids):
            return None, 'Discount is not applicable to selected products'

        # Calculate discount amount
        if rule['discount_type'] == 'percentage':
            discount_amount = round(amount * float(rule['value']) / 100, 2)
        else:
            discount_amount = min(float(rule['value']), amount)

        return {
            'discount_id': rule['id'],
            'discount_name': rule['name'],
            'discount_type': rule['discount_type'],
            'discount_value': rule['value'],
            'discount_amount': discount_amount,
        }, None

    except Exception as e:
        logger.exception('validate_discount: %s', e)
        return None, 'Discount validation failed'


def record_discount_usage(discount_id: str, subscription_id: str = None, invoice_id: str = None, amount: float = 0):
    """Atomically increment usage count and record usage history."""
    try:
        # Atomic increment via RPC (defined in DB schema)
        supabase_admin.rpc('increment_discount_usage', {'p_discount_id': discount_id}).execute()
        # Record history
        supabase_admin.table('discount_usages').insert({
            'discount_id': discount_id,
            'subscription_id': subscription_id,
            'invoice_id': invoice_id,
            'discount_amount': amount,
        }).execute()
        return True, None
    except Exception as e:
        logger.exception('record_discount_usage: %s', e)
        return False, str(e)


def get_discount_usage(discount_id: str):
    try:
        resp = supabase_admin.table('discount_usages').select('*').eq('discount_id', discount_id).order('created_at', desc=True).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)
