"""
app/routes/quotation_template_routes.py — Quotation template CRUD.
This blueprint is not registered separately; it is handled through quotation_routes.
Stub included for completeness.
"""

from flask import Blueprint, request
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_or_staff, admin_only
from app.extensions import supabase_admin
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields

# This blueprint is registered in __init__.py as /quotation-templates
qt_bp = Blueprint('quotation_templates', __name__)


@qt_bp.get('')
@require_auth
@admin_or_staff
def list_templates():
    resp = supabase_admin.table('quotation_templates').select('*, quotation_template_lines(*)').order('created_at', desc=True).execute()
    return success_response(resp.data)


@qt_bp.post('')
@require_auth
@admin_or_staff
def create_template():
    data = request.get_json(force=True, silent=True) or {}
    missing = require_fields(data, ['name'])
    if missing:
        return error_response(f'Missing fields: {", ".join(missing)}', 400, 'VALIDATION_ERROR')
    payload = {
        'name': data['name'],
        'description': data.get('description', ''),
        'validity_days': int(data.get('validity_days', 30)),
        'default_plan_id': data.get('default_plan_id'),
        'payment_terms': data.get('payment_terms', 'Due on receipt'),
    }
    resp = supabase_admin.table('quotation_templates').insert(payload).execute()
    template = resp.data[0] if resp.data else None
    if template and data.get('lines'):
        for line in data['lines']:
            supabase_admin.table('quotation_template_lines').insert({
                'template_id': template['id'],
                **{k: v for k, v in line.items() if k in ['product_id', 'variant_id', 'description', 'quantity', 'unit_price', 'tax_rate']},
            }).execute()
    return created_response(template, 'Template created')


@qt_bp.get('/<template_id>')
@require_auth
@admin_or_staff
def get_template(template_id):
    resp = supabase_admin.table('quotation_templates').select('*, quotation_template_lines(*)').eq('id', template_id).single().execute()
    if not resp.data:
        return error_response('Template not found', 404, 'NOT_FOUND')
    return success_response(resp.data)


@qt_bp.put('/<template_id>')
@require_auth
@admin_or_staff
def update_template(template_id):
    data = request.get_json(force=True, silent=True) or {}
    allowed = ['name', 'description', 'validity_days', 'default_plan_id', 'payment_terms']
    payload = {k: v for k, v in data.items() if k in allowed}
    resp = supabase_admin.table('quotation_templates').update(payload).eq('id', template_id).execute()
    return success_response(resp.data[0] if resp.data else None, 'Template updated')


@qt_bp.delete('/<template_id>')
@require_auth
@admin_only
def delete_template(template_id):
    supabase_admin.table('quotation_templates').delete().eq('id', template_id).execute()
    return success_response(None, 'Template deleted')
