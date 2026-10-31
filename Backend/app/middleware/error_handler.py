"""
app/middleware/error_handler.py — Centralised exception handlers.
"""
from __future__ import annotations

import logging
from flask import jsonify

logger = logging.getLogger(__name__)


def register_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': 'Bad request', 'error': {'code': 'BAD_REQUEST'}}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'success': False, 'message': 'Unauthorized', 'error': {'code': 'UNAUTHORIZED'}}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'success': False, 'message': 'Forbidden', 'error': {'code': 'FORBIDDEN'}}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource not found', 'error': {'code': 'NOT_FOUND'}}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'success': False, 'message': 'Method not allowed', 'error': {'code': 'METHOD_NOT_ALLOWED'}}), 405

    @app.errorhandler(409)
    def conflict(e):
        return jsonify({'success': False, 'message': 'Conflict', 'error': {'code': 'CONFLICT'}}), 409

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({'success': False, 'message': 'Unprocessable entity', 'error': {'code': 'VALIDATION_ERROR'}}), 422

    @app.errorhandler(429)
    def rate_limit(e):
        return jsonify({'success': False, 'message': 'Too many requests', 'error': {'code': 'RATE_LIMIT'}}), 429

    @app.errorhandler(500)
    def server_error(e):
        logger.exception('Internal server error: %s', e)
        return jsonify({'success': False, 'message': 'Internal server error', 'error': {'code': 'SERVER_ERROR'}}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        logger.exception('Unhandled exception: %s', e)
        return jsonify({'success': False, 'message': str(e), 'error': {'code': 'SERVER_ERROR'}}), 500
