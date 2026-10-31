"""
app/services/billing_service.py

Recurring billing engine. 
- Finds subscriptions due for billing (next_billing_date <= today, status=active).
- Generates invoices idempotently.
- Logs every run to billing_runs and billing_run_items.
- Concurrent execution protection: marks run as 'in_progress' before processing.
- Safe to retry: idempotency in invoice_service prevents duplicates.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date
from app.extensions import supabase_admin
from app.services.invoice_service import create_invoice_from_subscription
from app.utils.date_utils import str_to_date, date_to_str

logger = logging.getLogger(__name__)


def get_due_subscriptions():
    """Return subscriptions eligible for billing today."""
    today = date.today().isoformat()
    try:
        resp = supabase_admin.table('subscriptions').select(
            '*, customers(name, email)'
        ).eq('status', 'active').lte('next_billing_date', today).execute()
        return resp.data or [], None
    except Exception as e:
        return [], str(e)


def preview_due_subscriptions():
    subs, err = get_due_subscriptions()
    return subs, err


def run_billing(triggered_by: str = 'system') -> tuple[dict, str | None]:
    """
    Execute the billing cycle.
    Returns a billing_run record.
    """
    today = date.today()
    run_id = str(uuid.uuid4())

    # Create run record — 'in_progress' prevents concurrent runs from overlapping
    try:
        run_resp = supabase_admin.table('billing_runs').insert({
            'id': run_id,
            'triggered_by': triggered_by,
            'status': 'in_progress',
            'started_at': date.today().isoformat(),
        }).execute()
    except Exception as e:
        logger.exception('billing_run insert failed: %s', e)
        return None, 'Failed to start billing run'

    due_subs, err = get_due_subscriptions()
    if err:
        _fail_run(run_id, err)
        return None, err

    successful = 0
    failed = 0
    total_billed = 0.0
    items = []

    for sub in due_subs:
        sub_id = sub['id']
        billing_start = str_to_date(sub['next_billing_date'])
        try:
            invoice, inv_err = create_invoice_from_subscription(sub_id, billing_start)
            if inv_err:
                failed += 1
                items.append({
                    'billing_run_id': run_id,
                    'subscription_id': sub_id,
                    'status': 'failed',
                    'error_message': inv_err,
                })
                logger.warning('Billing failed for sub %s: %s', sub_id, inv_err)
            else:
                successful += 1
                total_billed += float(invoice.get('total_amount', 0))
                items.append({
                    'billing_run_id': run_id,
                    'subscription_id': sub_id,
                    'invoice_id': invoice['id'],
                    'status': 'success',
                    'billed_amount': float(invoice.get('total_amount', 0)),
                })
        except Exception as e:
            failed += 1
            items.append({
                'billing_run_id': run_id,
                'subscription_id': sub_id,
                'status': 'failed',
                'error_message': str(e),
            })
            logger.exception('Billing exception for sub %s: %s', sub_id, e)

    # Bulk insert run items
    if items:
        try:
            supabase_admin.table('billing_run_items').insert(items).execute()
        except Exception as e:
            logger.warning('Failed to insert billing run items: %s', e)

    # Finalise run
    run_status = 'completed' if failed == 0 else ('partially_failed' if successful > 0 else 'failed')
    try:
        supabase_admin.table('billing_runs').update({
            'status': run_status,
            'completed_at': date.today().isoformat(),
            'total_processed': len(due_subs),
            'successful': successful,
            'failed': failed,
            'total_billed_amount': total_billed,
        }).eq('id', run_id).execute()
    except Exception as e:
        logger.exception('Failed to finalize billing run: %s', e)

    return get_billing_run(run_id)[0], None


def _fail_run(run_id: str, reason: str):
    try:
        supabase_admin.table('billing_runs').update({
            'status': 'failed',
            'completed_at': date.today().isoformat(),
            'error_message': reason,
        }).eq('id', run_id).execute()
    except Exception as e:
        logger.exception('_fail_run: %s', e)


def list_billing_runs(page: int = 1, per_page: int = 20):
    from app.utils.pagination import build_pagination_meta
    try:
        offset = (page - 1) * per_page
        resp = supabase_admin.table('billing_runs').select('*', count='exact').order(
            'started_at', desc=True
        ).range(offset, offset + per_page - 1).execute()
        return resp.data, build_pagination_meta(page, per_page, resp.count or 0), None
    except Exception as e:
        return None, None, str(e)


def get_billing_run(run_id: str):
    try:
        resp = supabase_admin.table('billing_runs').select(
            '*, billing_run_items(*)'
        ).eq('id', run_id).single().execute()
        return resp.data, None
    except Exception:
        return None, 'Billing run not found'


def retry_billing_run_item(run_item_id: str) -> tuple[dict, str | None]:
    try:
        item_resp = supabase_admin.table('billing_run_items').select('*').eq('id', run_item_id).single().execute()
        item = item_resp.data
        if not item:
            return None, 'Run item not found'
        if item['status'] == 'success':
            return item, None

        sub_id = item['subscription_id']
        sub_resp = supabase_admin.table('subscriptions').select('*').eq('id', sub_id).single().execute()
        sub = sub_resp.data
        if not sub:
            return None, 'Subscription not found'

        billing_start = str_to_date(sub['next_billing_date'])
        invoice, err = create_invoice_from_subscription(sub_id, billing_start)
        if err:
            supabase_admin.table('billing_run_items').update({
                'status': 'failed',
                'error_message': err,
                'retry_count': (item.get('retry_count', 0) or 0) + 1,
            }).eq('id', run_item_id).execute()
            return None, err

        supabase_admin.table('billing_run_items').update({
            'status': 'success',
            'invoice_id': invoice['id'],
            'billed_amount': float(invoice.get('total_amount', 0)),
            'error_message': None,
            'retry_count': (item.get('retry_count', 0) or 0) + 1,
        }).eq('id', run_item_id).execute()
        return supabase_admin.table('billing_run_items').select('*').eq('id', run_item_id).single().execute().data, None
    except Exception as e:
        return None, str(e)
