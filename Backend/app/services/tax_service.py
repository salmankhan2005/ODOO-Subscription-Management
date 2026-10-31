"""
app/services/tax_service.py
"""

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
        return resp.data, None
    except Exception as e:
        return None, str(e)


def get_tax(tax_id: str):
    try:
        resp = supabase_admin.table('tax_rules').select('*').eq('id', tax_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Tax rule not found'


def create_tax(data: dict):
    try:
        payload = {
            'name': data['name'],
            'percentage': float(data['percentage']),
            'tax_type': data.get('tax_type', 'sales'),
            'applicable_product_ids': data.get('applicable_product_ids', []),
            'start_date': data.get('start_date', date.today().isoformat()),
            'end_date': data.get('end_date'),
            'status': 'active',
        }
        resp = supabase_admin.table('tax_rules').insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def update_tax(tax_id: str, data: dict):
    try:
        allowed = ['name', 'percentage', 'tax_type', 'applicable_product_ids', 'start_date', 'end_date', 'status']
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = supabase_admin.table('tax_rules').update(payload).eq('id', tax_id).execute()
        return resp.data[0] if resp.data else None, None
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
