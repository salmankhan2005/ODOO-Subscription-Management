"""
app/services/tax_service.py
"""
from __future__ import annotations

import logging
from datetime import date
from app.extensions import supabase_admin

logger = logging.getLogger(__name__)


def list_taxes(status: str = 'all'):
    try:
        query = supabase_admin.table('tax_rules').select('*')
        if status and status != 'all':
            query = query.eq('status', status)
        resp = query.order('created_at', desc=True).execute()
        taxes = resp.data or []
        for t in taxes:
            t['type'] = t.get('tax_type', 'sales')
            t['startDate'] = t.get('start_date', '')
            t['endDate'] = t.get('end_date')
            t['applicableProductIds'] = t.get('applicable_product_ids', [])
        return taxes, None
    except Exception as e:
        return None, str(e)


def get_tax(tax_id: str):
    try:
        resp = supabase_admin.table('tax_rules').select('*').eq('id', tax_id).single().execute()
        t = resp.data
        if t:
            t['type'] = t.get('tax_type', 'sales')
            t['startDate'] = t.get('start_date', '')
            t['endDate'] = t.get('end_date')
            t['applicableProductIds'] = t.get('applicable_product_ids', [])
        return t, None
    except Exception:
        return None, 'Tax rule not found'


def create_tax(data: dict):
    try:
        tax_type = data.get('tax_type') or data.get('type') or 'sales'
        start_date = data.get('start_date') or data.get('startDate') or date.today().isoformat()
        end_date = data.get('end_date') or data.get('endDate')
        products = data.get('applicable_product_ids') or data.get('applicableProductIds') or []
        payload = {
            'name': data['name'],
            'percentage': float(data['percentage']),
            'tax_type': tax_type,
            'applicable_product_ids': products,
            'start_date': start_date,
            'end_date': end_date,
            'status': 'active',
        }
        resp = supabase_admin.table('tax_rules').insert(payload).execute()
        created = resp.data[0] if resp.data else None
        if created:
            created['type'] = created.get('tax_type', 'sales')
        return created, None
    except Exception as e:
        return None, str(e)


def update_tax(tax_id: str, data: dict):
    try:
        allowed_map = {
            'name': 'name',
            'percentage': 'percentage',
            'tax_type': 'tax_type',
            'type': 'tax_type',
            'applicable_product_ids': 'applicable_product_ids',
            'applicableProductIds': 'applicable_product_ids',
            'start_date': 'start_date',
            'startDate': 'start_date',
            'end_date': 'end_date',
            'endDate': 'end_date',
            'status': 'status',
        }
        payload = {}
        for k, v in data.items():
            if k in allowed_map:
                target_key = allowed_map[k]
                if target_key == 'percentage':
                    payload[target_key] = float(v)
                else:
                    payload[target_key] = v

        resp = supabase_admin.table('tax_rules').update(payload).eq('id', tax_id).execute()
        updated = resp.data[0] if resp.data else None
        if updated:
            updated['type'] = updated.get('tax_type', 'sales')
        return updated, None
    except Exception as e:
        return None, str(e)


def delete_tax(tax_id: str):
    try:
        supabase_admin.table('tax_rules').update({'status': 'inactive'}).eq('id', tax_id).execute()
        return True, None
    except Exception as e:
        return False, str(e)


def calculate_tax_for_product(product_id: str, amount: float) -> dict:
    """
    Find the active tax rule for a product and calculate the tax amount.
    Returns {'tax_rate': %, 'tax_amount': $, 'tax_name': '...'}.
    """
    today = date.today().isoformat()
    try:
        # Look for product-specific rule first
        resp = supabase_admin.table('tax_rules').select('*').eq('status', 'active').lte('start_date', today).execute()
        rules = resp.data or []

        applicable = None
        for r in rules:
            prod_ids = r.get('applicable_product_ids') or []
            if product_id in prod_ids:
                applicable = r
                break
        if not applicable:
            # Fall back to global rule (empty product list)
            for r in rules:
                if not r.get('applicable_product_ids'):
                    applicable = r
                    break

        if not applicable:
            return {'tax_rate': 0, 'tax_amount': 0, 'tax_name': 'No Tax'}

        # Validate end_date
        if applicable.get('end_date') and applicable['end_date'] < today:
            return {'tax_rate': 0, 'tax_amount': 0, 'tax_name': 'No Tax'}

        rate = float(applicable['percentage'])
        tax_amount = round(amount * rate / 100, 2)
        return {'tax_rate': rate, 'tax_amount': tax_amount, 'tax_name': applicable['name']}
    except Exception as e:
        logger.exception('calculate_tax_for_product: %s', e)
        return {'tax_rate': 0, 'tax_amount': 0, 'tax_name': 'No Tax'}
