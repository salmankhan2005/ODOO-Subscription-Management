"""
app/utils/response.py — Standardised JSON response helpers.
"""
from __future__ import annotations

from flask import jsonify
from typing import Any


def success_response(data: Any = None, message: str = 'Success', status: int = 200,
                     pagination: dict = None):
    body = {'success': True, 'message': message}
    if data is not None:
        body['data'] = data
    if pagination:
        body['pagination'] = pagination
    return jsonify(body), status


def created_response(data: Any = None, message: str = 'Created successfully'):
    return success_response(data, message, 201)


def error_response(message: str, status: int = 400, code: str = 'ERROR',
                   details: dict = None):
    body = {
        'success': False,
        'message': message,
        'error': {'code': code}
    }
    if details:
        body['error']['details'] = details
    return jsonify(body), status
