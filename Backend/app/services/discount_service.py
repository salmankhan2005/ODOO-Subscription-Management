"""
app/services/discount_service.py
"""
from __future__ import annotations

import logging
from datetime import date
from app.extensions import supabase_admin

logger = logging.getLogger(__name__)


def _normalize_discount(d: dict) -> dict:
    if not d:
        return d
    d['type'] = d.get('discount_type', 'percentage')
    d['minimumPurchase'] = float(d.get('minimum_purchase', 0))
    d['minimumQuantity'] = int(d.get('minimum_quantity', 1))
    d['applicableProductIds'] = d.get('applicable_product_ids', [])
    d['applicableSubscriptions'] = bool(d.get('applicable_subscriptions', True))
    d['startDate'] = d.get('start_date', '')
    d['endDate'] = d.get('end_date') or ''
    d['maxUsage'] = int(d.get('max_usage', 0))
    d['usageCount'] = int(d.get('current_usage_count', 0))
    return d


def list_discounts(status: str = 'all'):
    try:
        query = supabase_admin.table('discount_rules').select('*')
        if status and status != 'all':
            query = query.eq('status', status)
        resp = query.order('created_at', desc=True).execute()
        discounts = resp.data or []
        for d in discounts:
            _normalize_discount(d)
        return discounts, None
    except Exception as e:
        return None, str(e)


def get_discount(discount_id: str):
    try:
        resp = supabase_admin.table('discount_rules').select('*').eq('id', discount_id).single().execute()
        d = resp.data
        if d:
            _normalize_discount(d)
        return d, None
    except Exception:
        return None, 'Discount not found'


def create_discount(data: dict):
    try:
        discount_type = data.get('discount_type') or data.get('type') or 'percentage'
        min_purchase = data.get('minimum_purchase') if data.get('minimum_purchase') is not None else data.get('minimumPurchase', 0)
        min_qty = data.get('minimum_quantity') if data.get('minimum_quantity') is not None else data.get('minimumQuantity', 1)
        prods = data.get('applicable_product_ids') or data.get('applicableProductIds') or []
        app_subs = data.get('applicable_subscriptions') if data.get('applicable_subscriptions') is not None else data.get('applicableSubscriptions', True)
        start_date = data.get('start_date') or data.get('startDate') or date.today().isoformat()
        end_date = data.get('end_date') or data.get('endDate')
        max_usage = data.get('max_usage') if data.get('max_usage') is not None else data.get('maxUsage', 0)

        payload = {
            'name': data['name'],
            'code': (data.get('code', '') or '').upper() or None,
            'discount_type': discount_type,
            'value': float(data['value']),
            'minimum_purchase': float(min_purchase),
            'minimum_quantity': int(min_qty),
            'applicable_product_ids': prods,
            'applicable_subscriptions': bool(app_subs),
            'start_date': start_date,
            'end_date': end_date,
            'max_usage': int(max_usage),
            'current_usage_count': 0,
            'status': 'active',
        }
        resp = supabase_admin.table('discount_rules').insert(payload).execute()
        created = resp.data[0] if resp.data else None
        if created:
            _normalize_discount(created)
        return created, None
    except Exception as e:
        return None, str(e)


def update_discount(discount_id: str, data: dict):
    try:
        key_map = {
            'name': 'name',
            'code': 'code',
            'discount_type': 'discount_type',
            'type': 'discount_type',
            'value': 'value',
            'minimum_purchase': 'minimum_purchase',
            'minimumPurchase': 'minimum_purchase',
            'minimum_quantity': 'minimum_quantity',
            'minimumQuantity': 'minimum_quantity',
            'applicable_product_ids': 'applicable_product_ids',
            'applicableProductIds': 'applicable_product_ids',
            'applicable_subscriptions': 'applicable_subscriptions',
            'applicableSubscriptions': 'applicable_subscriptions',
            'start_date': 'start_date',
            'startDate': 'start_date',
            'end_date': 'end_date',
            'endDate': 'end_date',
            'max_usage': 'max_usage',
            'maxUsage': 'max_usage',
            'status': 'status',
        }
        payload = {}
        for k, v in data.items():
            if k in key_map:
                target_key = key_map[k]
                if target_key in ('value', 'minimum_purchase'):
                    payload[target_key] = float(v)
                elif target_key in ('minimum_quantity', 'max_usage'):
                    payload[target_key] = int(v)
                elif target_key == 'code':
                    payload[target_key] = (v or '').upper()
                else:
                    payload[target_key] = v

        resp = supabase_admin.table('discount_rules').update(payload).eq('id', discount_id).execute()
        updated = resp.data[0] if resp.data else None
        if updated:
            _normalize_discount(updated)
        return updated, None
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
        supabase_admin.rpc('increment_discount_usage', {'p_discount_id': discount_id}).execute()
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
