"""
app/services/product_service.py
"""

import logging
from app.extensions import supabase_admin
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)


# ── Products ──────────────────────────────────────────────────────────────────

def list_products(search: str = '', status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('products').select('*, product_variants(*)', count='exact')
        if status and status != 'all':
            query = query.eq('status', status)
        if search:
            query = query.or_(f'name.ilike.%{search}%,description.ilike.%{search}%')
        query = query.order('created_at', desc=True)
        offset = (page - 1) * per_page
        resp = query.range(offset, offset + per_page - 1).execute()
        total = resp.count or 0
        return resp.data, build_pagination_meta(page, per_page, total), None
    except Exception as e:
        logger.exception('list_products: %s', e)
        return None, None, str(e)


def get_product(product_id: str):
    try:
        resp = supabase_admin.table('products').select('*, product_variants(*)').eq('id', product_id).single().execute()
        return resp.data, None
    except Exception as e:
        return None, 'Product not found'


def create_product(data: dict):
    try:
        payload = {
            'name': data['name'],
            'product_type': data.get('product_type', 'software'),
            'sales_price': float(data.get('sales_price', 0)),
            'cost_price': float(data.get('cost_price', 0)),
            'description': data.get('description', ''),
            'notes': data.get('notes', ''),
            'status': 'active',
        }
        resp = supabase_admin.table('products').insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        logger.exception('create_product: %s', e)
        return None, str(e)


def update_product(product_id: str, data: dict):
    try:
        allowed = ['name', 'product_type', 'sales_price', 'cost_price', 'description', 'notes', 'status']
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = supabase_admin.table('products').update(payload).eq('id', product_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def deactivate_product(product_id: str):
    try:
        resp = supabase_admin.table('products').update({'status': 'archived'}).eq('id', product_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


# ── Variants ──────────────────────────────────────────────────────────────────

def list_variants(product_id: str):
    try:
        resp = supabase_admin.table('product_variants').select('*').eq('product_id', product_id).execute()
        return resp.data, None
    except Exception as e:
        return None, str(e)


def create_variant(product_id: str, data: dict):
    try:
        payload = {
            'product_id': product_id,
            'name': data['name'],
            'sku': data.get('sku', ''),
            'additional_price': float(data.get('additional_price', 0)),
            'description': data.get('description', ''),
            'status': 'active',
        }
        resp = supabase_admin.table('product_variants').insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def update_variant(variant_id: str, data: dict):
    try:
        allowed = ['name', 'sku', 'additional_price', 'description', 'status']
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = supabase_admin.table('product_variants').update(payload).eq('id', variant_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def delete_variant(variant_id: str):
    try:
        supabase_admin.table('product_variants').update({'status': 'archived'}).eq('id', variant_id).execute()
        return True, None
    except Exception as e:
        return False, str(e)
