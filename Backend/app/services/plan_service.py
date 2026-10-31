"""
app/services/plan_service.py
"""
from __future__ import annotations

import logging
from datetime import date
from app.extensions import supabase_admin
from app.utils.pagination import build_pagination_meta

logger = logging.getLogger(__name__)

VALID_INTERVALS = {'daily', 'weekly', 'monthly', 'yearly'}


def list_plans(status: str = 'all', page: int = 1, per_page: int = 20):
    try:
        query = supabase_admin.table('subscription_plans').select('*', count='exact')
        if status and status != 'all':
            query = query.eq('status', status)
        query = query.order('created_at', desc=True)
        offset = (page - 1) * per_page
        resp = query.range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        logger.exception('list_plans: %s', e)
        return None, None, str(e)


def get_plan(plan_id: str):
    try:
        resp = supabase_admin.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
        return resp.data, None
    except Exception as e:
        return None, 'Plan not found'


def create_plan(data: dict):
    try:
        interval = data.get('billing_interval', 'monthly')
        if interval not in VALID_INTERVALS:
            return None, f'Invalid billing interval. Must be one of: {", ".join(VALID_INTERVALS)}'

        payload = {
            'name': data['name'],
            'product_id': data.get('product_id'),
            'billing_interval': interval,
            'interval_count': int(data.get('interval_count', 1)),
            'base_price': float(data.get('base_price', 0)),
            'minimum_quantity': int(data.get('minimum_quantity', 1)),
            'start_date': data.get('start_date', date.today().isoformat()),
            'end_date': data.get('end_date'),
            'auto_close_on_end': bool(data.get('auto_close_on_end', False)),
            'allow_early_cancel': bool(data.get('allow_early_cancel', True)),
            'allow_pause': bool(data.get('allow_pause', True)),
            'allow_renewal': bool(data.get('allow_renewal', True)),
            'description': data.get('description', ''),
            'status': 'active',
        }
        resp = supabase_admin.table('subscription_plans').insert(payload).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        logger.exception('create_plan: %s', e)
        return None, str(e)


def update_plan(plan_id: str, data: dict):
    try:
        allowed = [
            'name', 'billing_interval', 'interval_count', 'base_price', 'minimum_quantity',
            'start_date', 'end_date', 'auto_close_on_end', 'allow_early_cancel',
            'allow_pause', 'allow_renewal', 'description'
        ]
        payload = {k: v for k, v in data.items() if k in allowed}
        resp = supabase_admin.table('subscription_plans').update(payload).eq('id', plan_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)


def set_plan_status(plan_id: str, status: str):
    valid = {'active', 'archived'}
    if status not in valid:
        return None, f'Status must be one of: {", ".join(valid)}'
    try:
        resp = supabase_admin.table('subscription_plans').update({'status': status}).eq('id', plan_id).execute()
        return resp.data[0] if resp.data else None, None
    except Exception as e:
        return None, str(e)
