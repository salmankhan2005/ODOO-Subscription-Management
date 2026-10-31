"""
app/routes/staff_routes.py
"""

from flask import Blueprint, request, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import admin_only
from app.services import auth_service
from app.extensions import supabase_admin
from app.utils.response import success_response, created_response, error_response
from app.utils.validators import require_fields
from app.utils.pagination import get_pagination_params, build_pagination_meta

staff_bp = Blueprint('staff', __name__)


@staff_bp.post('')
@require_auth
@admin_only
def create_staff():
    data = request.get_json(force=True, silent=True) or {}
    result, err = auth_service.create_staff_account(data, g.user['id'])
    if err:
        status = 409 if 'already registered' in err else 400
        return error_response(err, status, 'STAFF_CREATION_ERROR')
    return created_response(result, 'Staff account created')


@staff_bp.get('')
@require_auth
@admin_only
def list_staff():
    page, per_page, offset = get_pagination_params()
    resp = supabase_admin.table('profiles').select('*', count='exact').in_(
        'role', ['staff', 'admin']
    ).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
    return success_response(
        resp.data,
        pagination=build_pagination_meta(page, per_page, resp.count or 0)
    )


@staff_bp.get('/<staff_id>')
@require_auth
@admin_only
def get_staff(staff_id):
    resp = supabase_admin.table('profiles').select('*').eq('id', staff_id).single().execute()
    if not resp.data:
        return error_response('Staff member not found', 404, 'NOT_FOUND')
    return success_response(resp.data)


@staff_bp.put('/<staff_id>')
@require_auth
@admin_only
def update_staff(staff_id):
    data = request.get_json(force=True, silent=True) or {}
    allowed = ['full_name', 'phone', 'role']
    payload = {k: v for k, v in data.items() if k in allowed}
    if 'role' in payload and payload['role'] not in ('staff', 'admin'):
        return error_response('Role must be staff or admin', 400, 'VALIDATION_ERROR')
    resp = supabase_admin.table('profiles').update(payload).eq('id', staff_id).execute()
    return success_response(resp.data[0] if resp.data else None, 'Staff updated')


@staff_bp.patch('/<staff_id>/status')
@require_auth
@admin_only
def update_staff_status(staff_id):
    data = request.get_json(force=True, silent=True) or {}
    status = data.get('status', 'active')
    if status not in ('active', 'inactive'):
        return error_response('Status must be active or inactive', 400, 'VALIDATION_ERROR')
    supabase_admin.table('profiles').update({'status': status}).eq('id', staff_id).execute()
    return success_response(None, f'Staff status set to {status}')
