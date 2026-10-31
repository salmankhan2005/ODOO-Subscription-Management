"""
app/routes/invoice_routes.py
"""

from flask import Blueprint, request, send_file
import io
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff
from app.services import invoice_service
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params

invoice_bp = Blueprint('invoices', __name__)


@invoice_bp.get('')
@require_auth
@admin_or_staff
def list_invoices():
    page, per_page, _ = get_pagination_params()
    status = request.args.get('status', 'all')
    customer_id = request.args.get('customer_id')
    data, pagination, err = invoice_service.list_invoices(customer_id, status, page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@invoice_bp.post('')
@require_auth
@admin_or_staff
def create_invoice():
    data = request.get_json(force=True, silent=True) or {}
    sub_id = data.get('subscription_id')
    if not sub_id:
        return error_response('subscription_id is required', 400, 'VALIDATION_ERROR')
    result, err = invoice_service.create_invoice_from_subscription(sub_id)
    if err:
        return error_response(err, 422, 'INVOICE_ERROR')
    return created_response(result, 'Invoice generated')


@invoice_bp.get('/overdue')
@require_auth
@admin_or_staff
def overdue_invoices():
    page, per_page, _ = get_pagination_params()
    data, pagination, err = invoice_service.get_overdue_invoices(page, per_page)
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@invoice_bp.get('/outstanding')
@require_auth
@admin_or_staff
def outstanding_invoices():
    page, per_page, _ = get_pagination_params()
    data, pagination, err = invoice_service.list_invoices(
        status='confirmed', page=page, per_page=per_page
    )
    if err:
        return error_response(err, 500)
    return success_response(data, pagination=pagination)


@invoice_bp.post('/generate')
@require_auth
@admin_or_staff
def generate_invoice():
    data = request.get_json(force=True, silent=True) or {}
    sub_id = data.get('subscription_id')
    if not sub_id:
        return error_response('subscription_id is required', 400, 'VALIDATION_ERROR')
    result, err = invoice_service.create_invoice_from_subscription(sub_id)
    if err:
        return error_response(err, 422, 'INVOICE_ERROR')
    return created_response(result, 'Invoice generated')


@invoice_bp.get('/<invoice_id>')
@require_auth
@admin_or_staff
def get_invoice(invoice_id):
    result, err = invoice_service.get_invoice(invoice_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    return success_response(result)


@invoice_bp.put('/<invoice_id>')
@require_auth
@admin_or_staff
def update_invoice(invoice_id):
    data = request.get_json(force=True, silent=True) or {}
    from app.extensions import supabase_admin
    allowed = ['notes', 'due_date']
    payload = {k: v for k, v in data.items() if k in allowed}
    resp = supabase_admin.table('invoices').update(payload).eq('id', invoice_id).execute()
    return success_response(resp.data[0] if resp.data else None, 'Invoice updated')


@invoice_bp.post('/<invoice_id>/confirm')
@require_auth
@admin_or_staff
def confirm_invoice(invoice_id):
    result, err = invoice_service.confirm_invoice(invoice_id)
    if err:
        return error_response(err, 422, 'INVOICE_ERROR')
    return success_response(result, 'Invoice confirmed')


@invoice_bp.post('/<invoice_id>/send')
@require_auth
@admin_or_staff
def send_invoice(invoice_id):
    result, err = invoice_service.send_invoice(invoice_id)
    if err:
        return error_response(err, 422, 'INVOICE_ERROR')
    return success_response(result, 'Invoice sent')


@invoice_bp.post('/<invoice_id>/cancel')
@require_auth
@admin_or_staff
def cancel_invoice(invoice_id):
    result, err = invoice_service.cancel_invoice(invoice_id)
    if err:
        return error_response(err, 422, 'INVOICE_ERROR')
    return success_response(result, 'Invoice cancelled')


@invoice_bp.get('/<invoice_id>/pdf')
@require_auth
@admin_or_staff
def download_pdf(invoice_id):
    from app.utils.invoice_pdf import generate_invoice_pdf
    from app.extensions import supabase_admin
    invoice, err = invoice_service.get_invoice(invoice_id)
    if err:
        return error_response(err, 404, 'NOT_FOUND')
    customer = invoice.get('customers', {})
    pdf_bytes = generate_invoice_pdf(invoice, customer)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{invoice.get('invoice_number', invoice_id)}.pdf"
    )


@invoice_bp.get('/<invoice_id>/payments')
@require_auth
@admin_or_staff
def invoice_payments(invoice_id):
    data, err = invoice_service.get_invoice_payments(invoice_id)
    if err:
        return error_response(err, 500)
    return success_response(data)
