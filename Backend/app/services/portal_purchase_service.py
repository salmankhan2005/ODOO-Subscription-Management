"""Customer plan purchases, including subscription, invoice, and manual payment creation."""

import logging
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from flask import current_app

from app.extensions import supabase_admin
from app.services import invoice_service
from app.services.payment_service import VALID_METHODS, _generate_payment_ref
from app.utils.date_utils import calculate_next_billing_date, date_to_str
from app.utils.pricing import calculate_line_totals

logger = logging.getLogger(__name__)

MANUAL_PAYMENT_METHODS = {'Cash', 'Bank Transfer', 'Cheque', 'Other'}


def create_stripe_checkout(customer_id: str, actor_id: str, plan_id: str, data: dict):
    """Create a hosted Stripe Checkout session for a customer plan purchase."""
    secret_key = current_app.config.get('STRIPE_SECRET_KEY')
    if not secret_key:
        return None, 'Stripe payments are not configured'
    import stripe

    try:
        quantity = int(data.get('quantity', 0))
    except (TypeError, ValueError):
        return None, 'Quantity must be a whole number'
    if quantity < 1 or quantity > 10000:
        return None, 'Quantity must be between 1 and 10000'

    address = (data.get('billing_address') or '').strip()
    country = (data.get('country') or '').strip()
    phone = (data.get('phone') or '').strip()
    notes = (data.get('notes') or '').strip()
    if not address or not country:
        return None, 'Billing address and country are required'
    if any(len(value) > limit for value, limit in ((address, 500), (country, 100), (phone, 40), (notes, 500))):
        return None, 'Billing details exceed the allowed length'

    try:
        today_str = date.today().isoformat()
        plan_response = (
            supabase_admin.table('subscription_plans').select('*').eq('id', plan_id)
            .eq('status', 'active').single().execute()
        )
        plan = plan_response.data
        if not plan or (plan.get('start_date') and plan['start_date'] > today_str) or (
            plan.get('end_date') and plan['end_date'] < today_str
        ):
            return None, 'This plan is not available for purchase'
        minimum_quantity = int(plan.get('minimum_quantity') or 1)
        if quantity < minimum_quantity:
            return None, f'Quantity must be at least {minimum_quantity}'

        customer_response = (
            supabase_admin.table('customers').select('*').eq('id', customer_id).single().execute()
        )
        customer = customer_response.data
        if not customer or customer.get('status') != 'active':
            return None, 'An active customer profile is required to purchase a plan'

        product_id = plan.get('product_id')
        tax_response = (
            supabase_admin.table('tax_rules')
            .select('percentage, applicable_product_ids, start_date, end_date')
            .eq('status', 'active').lte('start_date', today_str).execute()
        )
        tax_rate = sum(
            float(rule.get('percentage') or 0)
            for rule in (tax_response.data or [])
            if (not rule.get('end_date') or rule['end_date'] >= today_str)
            and (not rule.get('applicable_product_ids') or not product_id
                 or product_id in rule['applicable_product_ids'])
        )
        totals = calculate_line_totals(float(plan['base_price']), quantity, tax_rate)
        amount_cents = int(
            (Decimal(str(totals['line_total'])) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        )
        currency = current_app.config.get('STRIPE_CURRENCY', 'usd').lower()
        frontend_url = current_app.config['FRONTEND_URL'].rstrip('/')
        success_url = f'{frontend_url}/?stripe_session_id={{CHECKOUT_SESSION_ID}}'
        cancel_url = f'{frontend_url}/?stripe_cancelled=1'

        stripe.api_key = secret_key
        session = stripe.checkout.Session.create(
            mode='payment',
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'unit_amount': amount_cents,
                    'product_data': {'name': f"{plan.get('name', 'Subscription plan')} (quantity {quantity})"},
                },
                'quantity': 1,
            }],
            client_reference_id=customer_id,
            customer_email=customer.get('email') or None,
            metadata={
                'customer_id': customer_id,
                'plan_id': plan_id,
                'quantity': str(quantity),
                'actor_id': actor_id,
                'billing_address': address,
                'country': country,
                'phone': phone,
                'notes': notes,
                'expected_total_cents': str(amount_cents),
                'unit_price': str(plan['base_price']),
                'tax_rate': str(tax_rate),
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return {'checkout_url': session.url}, None
    except stripe.StripeError as error:
        logger.exception('Could not create Stripe Checkout session: %s', error)
        return None, 'Could not start secure checkout. Please try again.'
    except Exception as error:
        logger.exception('Could not create Stripe Checkout session: %s', error)
        return None, 'Could not start secure checkout. Please try again.'


def complete_stripe_checkout(session_id: str, actor_id: str | None = None):
    """Verify a Stripe session and create the paid subscription records once."""
    secret_key = current_app.config.get('STRIPE_SECRET_KEY')
    if not secret_key:
        return None, 'Stripe payments are not configured'
    import stripe
    if not session_id or len(session_id) > 255:
        return None, 'A valid Stripe checkout session is required'
    try:
        stripe.api_key = secret_key
        session = stripe.checkout.Session.retrieve(session_id)
        session_data = session if isinstance(session, dict) else session.to_dict_recursive()
        metadata = session_data.get('metadata') or {}
        customer_id = metadata.get('customer_id')
        if session_data.get('payment_status') != 'paid' or not customer_id:
            return None, 'Stripe has not confirmed this payment'
        if session_data.get('client_reference_id') != customer_id:
            return None, 'Payment customer could not be verified'
        if actor_id and actor_id != metadata.get('actor_id'):
            # actor_id metadata is set when the session is created; older sessions
            # without it are still tied to the authenticated customer below.
            if metadata.get('actor_id'):
                return None, 'Payment session does not belong to this user'

        existing = (
            supabase_admin.table('payments').select('id').eq(
                'transaction_reference', session_id
            ).execute()
        )
        if existing.data:
            return {'already_processed': True}, None

        expected_cents = int(metadata.get('expected_total_cents') or 0)
        if int(session_data.get('amount_total') or 0) != expected_cents:
            return None, 'Stripe payment amount does not match the checkout amount'
        purchase_data = {
            'quantity': int(metadata.get('quantity') or 0),
            'payment_method': 'Card',
            'transaction_reference': session_id,
            'billing_address': metadata.get('billing_address', ''),
            'country': metadata.get('country', ''),
            'phone': metadata.get('phone', ''),
            'notes': metadata.get('notes', ''),
        }
        result, error = purchase_plan(
            customer_id=customer_id,
            actor_id=actor_id or metadata.get('actor_id') or customer_id,
            plan_id=metadata.get('plan_id'),
            data=purchase_data,
            stripe_payment={
                'unit_price': metadata.get('unit_price'),
                'tax_rate': metadata.get('tax_rate'),
                'total_amount': expected_cents / 100,
            },
        )
        if error:
            return None, error
        return result, None
    except stripe.StripeError as error:
        logger.exception('Could not verify Stripe Checkout session: %s', error)
        return None, 'Could not verify payment with Stripe'
    except Exception as error:
        logger.exception('Could not complete Stripe Checkout session: %s', error)
        return None, 'Could not complete payment. Please contact support.'


def _next_number(sequence: str, prefix: str, width: int) -> str:
    response = supabase_admin.rpc('next_sequence_value', {'p_key': sequence}).execute()
    value = response.data or 1
    return f'{prefix}-{date.today().year}-{str(value).zfill(width)}'


def _rollback_purchase(subscription_id=None, invoice_id=None, payment_id=None):
    try:
        if payment_id:
            supabase_admin.table('payment_allocations').delete().eq('payment_id', payment_id).execute()
            supabase_admin.table('payments').delete().eq('id', payment_id).execute()
        if invoice_id:
            supabase_admin.table('payment_allocations').delete().eq('invoice_id', invoice_id).execute()
            supabase_admin.table('invoice_lines').delete().eq('invoice_id', invoice_id).execute()
            supabase_admin.table('invoices').delete().eq('id', invoice_id).execute()
        if subscription_id:
            supabase_admin.table('subscription_events').delete().eq(
                'subscription_id', subscription_id
            ).execute()
            supabase_admin.table('subscription_lines').delete().eq(
                'subscription_id', subscription_id
            ).execute()
            supabase_admin.table('subscriptions').delete().eq('id', subscription_id).execute()
    except Exception:
        logger.exception('Could not fully roll back failed customer plan purchase')


def purchase_plan(
    customer_id: str, actor_id: str, plan_id: str, data: dict,
    stripe_payment: dict = None,
):
    """Create an active subscription and paid invoice after a settled payment."""
    payment_method = 'Card' if stripe_payment else data.get('payment_method')
    verified_stripe_payment = stripe_payment is not None
    if not verified_stripe_payment and (
        payment_method not in MANUAL_PAYMENT_METHODS or payment_method not in VALID_METHODS
    ):
        return None, 'Choose a supported manual payment method'

    try:
        quantity = int(data.get('quantity', 0))
    except (TypeError, ValueError):
        return None, 'Quantity must be a whole number'

    today = date.today()
    today_str = today.isoformat()
    plan_response = (
        supabase_admin.table('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .eq('status', 'active')
        .single()
        .execute()
    )
    plan = plan_response.data
    if not plan:
        return None, 'This plan is not available for purchase'
    if plan.get('start_date') and plan['start_date'] > today_str:
        return None, 'This plan is not available yet'
    if plan.get('end_date') and plan['end_date'] < today_str:
        return None, 'This plan is no longer available'

    minimum_quantity = int(plan.get('minimum_quantity') or 1)
    if quantity < minimum_quantity or quantity > 10000:
        return None, f'Quantity must be between {minimum_quantity} and 10000'

    customer_response = (
        supabase_admin.table('customers')
        .select('*')
        .eq('id', customer_id)
        .single()
        .execute()
    )
    customer = customer_response.data
    if not customer or customer.get('status') != 'active':
        return None, 'An active customer profile is required to purchase a plan'

    address = (data.get('billing_address') or customer.get('billing_address') or '').strip()
    country = (data.get('country') or customer.get('country') or '').strip()
    if not address or not country:
        return None, 'Billing address and country are required'

    payment_reference = (data.get('transaction_reference') or '').strip()
    notes = (data.get('notes') or '').strip()
    if len(payment_reference) > 120 or len(notes) > 500:
        return None, 'Payment reference or notes exceed the allowed length'

    subscription_id = invoice_id = payment_id = None
    customer_changes = {'billing_address': address, 'country': country}
    if data.get('phone') is not None:
        customer_changes['phone'] = str(data['phone']).strip()
    previous_customer_values = {
        key: customer.get(key) for key in customer_changes
    }
    try:
        supabase_admin.table('customers').update(customer_changes).eq('id', customer_id).execute()

        product_name = plan.get('name', 'Subscription plan')
        product_id = plan.get('product_id')
        if product_id:
            product_response = (
                supabase_admin.table('products')
                .select('name')
                .eq('id', product_id)
                .single()
                .execute()
            )
            product_name = (product_response.data or {}).get('name') or product_name

        tax_query = (
            supabase_admin.table('tax_rules')
            .select('percentage, applicable_product_ids, start_date, end_date')
            .eq('status', 'active')
            .lte('start_date', today_str)
        )
        tax_response = tax_query.execute()
        tax_rate = sum(
            float(rule.get('percentage') or 0)
            for rule in (tax_response.data or [])
            if (not rule.get('end_date') or rule['end_date'] >= today_str)
            and (
                not rule.get('applicable_product_ids')
                or not product_id
                or product_id in rule['applicable_product_ids']
            )
        )

        unit_price = float(stripe_payment['unit_price'] if stripe_payment else plan['base_price'])
        if stripe_payment:
            tax_rate = float(stripe_payment.get('tax_rate') or 0)
            line_totals = calculate_line_totals(unit_price, quantity, tax_rate)
            expected_total = float(stripe_payment.get('total_amount') or 0)
            if abs(line_totals['line_total'] - expected_total) > 0.01:
                raise RuntimeError('Stripe checkout total does not match the payment amount')
        line_totals = calculate_line_totals(unit_price, quantity, tax_rate)
        interval = plan['billing_interval']
        interval_count = int(plan.get('interval_count') or 1)
        start_date = today
        next_billing_date = calculate_next_billing_date(start_date, interval, interval_count)
        subscription_number = _next_number('subscription', 'SUB', 4)

        subscription_payload = {
            'subscription_number': subscription_number,
            'customer_id': customer_id,
            'plan_id': plan_id,
            'billing_interval': interval,
            'interval_count': interval_count,
            'start_date': date_to_str(start_date),
            'next_billing_date': date_to_str(next_billing_date),
            'payment_terms': 'Paid at purchase',
            'currency': 'USD',
            'subtotal': line_totals['subtotal'],
            'discount_amount': line_totals['discount_amount'],
            'tax_amount': line_totals['tax_amount'],
            'total_amount': line_totals['line_total'],
            'auto_renew': bool(plan.get('allow_renewal', True)),
            'notes': notes,
            'status': 'draft',
        }
        subscription_response = (
            supabase_admin.table('subscriptions').insert(subscription_payload).execute()
        )
        subscription = subscription_response.data[0] if subscription_response.data else None
        if not subscription:
            raise RuntimeError('Could not create subscription')
        subscription_id = subscription['id']

        supabase_admin.table('subscription_lines').insert({
            'subscription_id': subscription_id,
            'product_id': product_id,
            'description': f'{product_name} — {plan["name"]}',
            'quantity': quantity,
            'unit_price': unit_price,
            'tax_rate': tax_rate,
            'tax_amount': line_totals['tax_amount'],
            'discount_amount': line_totals['discount_amount'],
            'subtotal': line_totals['subtotal'],
            'line_total': line_totals['line_total'],
        }).execute()
        supabase_admin.table('subscription_events').insert({
            'subscription_id': subscription_id,
            'event_type': 'purchased',
            'description': 'Customer purchased plan; subscription activated',
            'actor_id': actor_id,
        }).execute()
        supabase_admin.table('subscriptions').update({'status': 'active'}).eq(
            'id', subscription_id
        ).execute()

        invoice, invoice_error = invoice_service.create_invoice_from_subscription(
            subscription_id, start_date
        )
        if invoice_error or not invoice:
            raise RuntimeError(invoice_error or 'Could not create purchase invoice')
        invoice_id = invoice['id']

        payment_data = {
            'payment_reference': _generate_payment_ref(),
            'customer_id': customer_id,
            'payment_method': payment_method,
            'amount': line_totals['line_total'],
            'payment_date': today_str,
            'transaction_reference': payment_reference,
            'notes': notes or f'Manually recorded at checkout for {plan["name"]}',
            'status': 'completed',
        }
        payment_response = supabase_admin.table('payments').insert(payment_data).execute()
        payment = payment_response.data[0] if payment_response.data else None
        if not payment:
            raise RuntimeError('Could not record payment')
        payment_id = payment['id']

        supabase_admin.table('payment_allocations').insert({
            'payment_id': payment_id,
            'invoice_id': invoice_id,
            'allocated_amount': line_totals['line_total'],
        }).execute()
        supabase_admin.table('invoices').update({
            'amount_paid': line_totals['line_total'],
            'amount_due': 0,
            'status': 'paid',
        }).eq('id', invoice_id).execute()

        return {
            'subscription_id': subscription_id,
            'subscription_number': subscription_number,
            'invoice_id': invoice_id,
            'payment_id': payment_id,
            'payment_reference': payment_data['payment_reference'],
            'total_amount': line_totals['line_total'],
        }, None
    except Exception as error:
        logger.exception('Customer plan purchase failed: %s', error)
        if subscription_id and not invoice_id:
            try:
                invoice_response = (
                    supabase_admin.table('invoices')
                    .select('id')
                    .eq('subscription_id', subscription_id)
                    .eq('billing_period_start', today_str)
                    .execute()
                )
                if invoice_response.data:
                    invoice_id = invoice_response.data[0]['id']
            except Exception:
                logger.exception('Could not locate a partial invoice after purchase failure')
        _rollback_purchase(subscription_id, invoice_id, payment_id)
        try:
            supabase_admin.table('customers').update(previous_customer_values).eq(
                'id', customer_id
            ).execute()
        except Exception:
            logger.exception('Could not restore customer billing details after purchase failure')
        return None, 'Plan purchase could not be completed. Please try again.'
