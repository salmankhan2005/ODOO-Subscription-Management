"""
app/routes/portal_routes.py

Customer self-service portal API.
All endpoints enforce that customers can only access their own data (IDOR protection).
"""

from datetime import date
from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import customer_only
from app.services.portal_purchase_service import (
    complete_stripe_checkout,
    create_stripe_checkout,
    purchase_plan,
)
from app.utils.response import success_response, error_response
from app.utils.permissions import customer_can_access
from app.extensions import supabase_admin

portal_bp = Blueprint('portal', __name__)


def _customer_id():
    """Get the customer_id for the authenticated customer user."""
    return g.user.get('customer_id')


@portal_bp.get('/profile')
@require_auth
@customer_only
def get_profile():
    cid = _customer_id()
    if not cid:
        return error_response('No customer profile linked to this account', 404, 'NOT_FOUND')
    resp = supabase_admin.table('customers').select('*').eq('id', cid).single().execute()
    return success_response(resp.data)


@portal_bp.put('/profile')
@require_auth
@customer_only
def update_profile():
    cid = _customer_id()
    if not cid:
        return error_response('No customer profile linked', 404, 'NOT_FOUND')
    data = request.get_json(force=True, silent=True) or {}
    allowed = ['name', 'phone', 'billing_address', 'country']
    payload = {k: v for k, v in data.items() if k in allowed}
    resp = supabase_admin.table('customers').update(payload).eq('id', cid).execute()
    return success_response(resp.data[0] if resp.data else None, 'Profile updated')


@portal_bp.get('/products')
@require_auth
@customer_only
def portal_products():
    resp = supabase_admin.table('products').select('*, product_variants(*)').eq('status', 'active').execute()
    return success_response(resp.data)


@portal_bp.get('/plans')
@require_auth
@customer_only
def portal_plans():
    today = date.today().isoformat()
    resp = (
        supabase_admin.table('subscription_plans')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', today)
        .execute()
    )
    plans = [
        plan for plan in (resp.data or [])
        if not plan.get('end_date') or plan['end_date'] >= today
    ]
    return success_response(plans)


@portal_bp.post('/plans/<plan_id>/purchase')
@require_auth
@customer_only
def purchase_customer_plan(plan_id):
    customer_id = _customer_id()
    if not customer_id:
        return error_response('No customer profile linked to this account', 404, 'NOT_FOUND')
    data = request.get_json(force=True, silent=True) or {}
    result, err = purchase_plan(customer_id, g.user['id'], plan_id, data)
    if err:
        return error_response(err, 422, 'PURCHASE_ERROR')
    return success_response(result, 'Plan purchased and subscription activated', 201)


@portal_bp.post('/plans/<plan_id>/checkout')
@require_auth
@customer_only
def create_customer_checkout(plan_id):
    customer_id = _customer_id()
    if not customer_id:
        return error_response('No customer profile linked to this account', 404, 'NOT_FOUND')
    data = request.get_json(force=True, silent=True) or {}
    result, err = create_stripe_checkout(customer_id, g.user['id'], plan_id, data)
    if err:
        return error_response(err, 422, 'CHECKOUT_ERROR')
    return success_response(result, 'Stripe checkout session created')


@portal_bp.post('/payments/stripe/confirm')
@require_auth
@customer_only
def confirm_customer_stripe_payment():
    session_id = (request.get_json(force=True, silent=True) or {}).get('session_id')
    result, err = complete_stripe_checkout(session_id, g.user['id'])
    if err:
        return error_response(err, 422, 'PAYMENT_CONFIRMATION_ERROR')
    return success_response(result, 'Payment confirmed and subscription activated')


@portal_bp.post('/payments/stripe/webhook')
def stripe_webhook():
    import stripe
    from flask import current_app

    webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not webhook_secret:
        return error_response('Stripe webhook is not configured', 503, 'WEBHOOK_NOT_CONFIGURED')
    signature = request.headers.get('Stripe-Signature', '')
    try:
        event = stripe.Webhook.construct_event(request.get_data(), signature, webhook_secret)
    except (ValueError, stripe.SignatureVerificationError):
        return error_response('Invalid Stripe webhook signature', 400, 'INVALID_SIGNATURE')

    if event['type'] in ('checkout.session.completed', 'checkout.session.async_payment_succeeded'):
        session = event['data']['object']
        if session.get('payment_status') == 'paid':
            _, err = complete_stripe_checkout(session.get('id'))
            if err:
                return error_response(err, 500, 'PAYMENT_PROCESSING_ERROR')
    return success_response(None, 'Webhook received')


@portal_bp.get('/subscriptions')
@require_auth
@customer_only
def portal_subscriptions():
    cid = _customer_id()
    if not cid:
        return error_response('No customer profile', 404, 'NOT_FOUND')
    resp = supabase_admin.table('subscriptions').select(
        '*, subscription_lines(*), subscription_plans(name, billing_interval)'
    ).eq('customer_id', cid).order('created_at', desc=True).execute()
    return success_response(resp.data)


@portal_bp.get('/subscriptions/<subscription_id>')
@require_auth
@customer_only
def portal_subscription(subscription_id):
    cid = _customer_id()
    resp = supabase_admin.table('subscriptions').select(
        '*, subscription_lines(*), subscription_plans(*)'
    ).eq('id', subscription_id).single().execute()
    sub = resp.data
    if not sub:
        return error_response('Subscription not found', 404, 'NOT_FOUND')
    err = customer_can_access(sub['customer_id'])
    if err:
        return err
    return success_response(sub)


@portal_bp.get('/invoices')
@require_auth
@customer_only
def portal_invoices():
    cid = _customer_id()
    if not cid:
        return error_response('No customer profile', 404, 'NOT_FOUND')
    resp = supabase_admin.table('invoices').select(
        '*, invoice_lines(*)'
    ).eq('customer_id', cid).order('created_at', desc=True).execute()
    return success_response(resp.data)


@portal_bp.get('/invoices/<invoice_id>')
@require_auth
@customer_only
def portal_invoice(invoice_id):
    cid = _customer_id()
    resp = supabase_admin.table('invoices').select(
        '*, invoice_lines(*)'
    ).eq('id', invoice_id).single().execute()
    inv = resp.data
    if not inv:
        return error_response('Invoice not found', 404, 'NOT_FOUND')
    err = customer_can_access(inv['customer_id'])
    if err:
        return err
    return success_response(inv)


@portal_bp.get('/invoices/<invoice_id>/pdf')
@require_auth
@customer_only
def portal_invoice_pdf(invoice_id):
    from app.utils.invoice_pdf import generate_invoice_pdf
    from flask import send_file
    import io
    resp = supabase_admin.table('invoices').select(
        '*, invoice_lines(*), customers(*)'
    ).eq('id', invoice_id).single().execute()
    inv = resp.data
    if not inv:
        return error_response('Invoice not found', 404, 'NOT_FOUND')
    err = customer_can_access(inv['customer_id'])
    if err:
        return err
    customer = inv.get('customers', {})
    pdf_bytes = generate_invoice_pdf(inv, customer)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{inv.get('invoice_number', invoice_id)}.pdf"
    )


@portal_bp.get('/payments')
@require_auth
@customer_only
def portal_payments():
    cid = _customer_id()
    if not cid:
        return error_response('No customer profile', 404, 'NOT_FOUND')
    resp = supabase_admin.table('payments').select('*').eq('customer_id', cid).order('created_at', desc=True).execute()
    return success_response(resp.data)


@portal_bp.post('/subscriptions/<subscription_id>/cancel-request')
@require_auth
@customer_only
def cancel_request(subscription_id):
    cid = _customer_id()
    resp = supabase_admin.table('subscriptions').select('customer_id, status, subscription_plans(allow_early_cancel)').eq('id', subscription_id).single().execute()
    sub = resp.data
    if not sub:
        return error_response('Subscription not found', 404, 'NOT_FOUND')
    err = customer_can_access(sub['customer_id'])
    if err:
        return err
    plan = sub.get('subscription_plans') or {}
    if not plan.get('allow_early_cancel', True):
        return error_response('This plan does not allow early cancellation', 422, 'PLAN_RESTRICTION')
    # Log cancellation request — staff/admin will process
    supabase_admin.table('subscription_events').insert({
        'subscription_id': subscription_id,
        'event_type': 'cancel_request',
        'description': f'Customer requested cancellation',
        'actor_id': g.user['id'],
    }).execute()
    return success_response(None, 'Cancellation request submitted. Our team will process it shortly.')


@portal_bp.post('/subscriptions/<subscription_id>/pause-request')
@require_auth
@customer_only
def pause_request(subscription_id):
    resp = supabase_admin.table('subscriptions').select('customer_id, subscription_plans(allow_pause)').eq('id', subscription_id).single().execute()
    sub = resp.data
    if not sub:
        return error_response('Subscription not found', 404, 'NOT_FOUND')
    err = customer_can_access(sub['customer_id'])
    if err:
        return err
    plan = sub.get('subscription_plans') or {}
    if not plan.get('allow_pause', True):
        return error_response('This plan does not allow pausing', 422, 'PLAN_RESTRICTION')
    supabase_admin.table('subscription_events').insert({
        'subscription_id': subscription_id,
        'event_type': 'pause_request',
        'description': 'Customer requested pause',
        'actor_id': g.user['id'],
    }).execute()
    return success_response(None, 'Pause request submitted.')


@portal_bp.post('/subscriptions/<subscription_id>/renew-request')
@require_auth
@customer_only
def renew_request(subscription_id):
    resp = supabase_admin.table('subscriptions').select('customer_id, status').eq('id', subscription_id).single().execute()
    sub = resp.data
    if not sub:
        return error_response('Subscription not found', 404, 'NOT_FOUND')
    err = customer_can_access(sub['customer_id'])
    if err:
        return err
    supabase_admin.table('subscription_events').insert({
        'subscription_id': subscription_id,
        'event_type': 'renew_request',
        'description': 'Customer requested renewal',
        'actor_id': g.user['id'],
    }).execute()
    return success_response(None, 'Renewal request submitted.')
