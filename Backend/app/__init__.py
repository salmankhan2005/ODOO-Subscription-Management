"""
app/__init__.py — Application factory.
"""
from __future__ import annotations

from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import get_config
from app.middleware.error_handler import register_error_handlers


def create_app():
    app = Flask(__name__)
    cfg = get_config()
    app.config.from_object(cfg)

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS(
        app,
        origins=cfg.CORS_ORIGINS,
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization', 'X-Billing-Secret'],
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    )

    # ── Rate Limiter ──────────────────────────────────────────────────────────
    Limiter(
        get_remote_address,
        app=app,
        default_limits=[cfg.RATELIMIT_DEFAULT],
        storage_uri='memory://',
    )

    # ── Error Handlers ────────────────────────────────────────────────────────
    register_error_handlers(app)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from app.routes.auth_routes import auth_bp
    from app.routes.quotation_template_routes import qt_bp
    from app.routes.product_routes import variant_bp
    from app.routes.staff_routes import staff_bp
    from app.routes.customer_routes import customer_bp
    from app.routes.product_routes import product_bp
    from app.routes.plan_routes import plan_bp
    from app.routes.quotation_routes import quotation_bp
    from app.routes.subscription_routes import subscription_bp
    from app.routes.tax_routes import tax_bp
    from app.routes.discount_routes import discount_bp
    from app.routes.invoice_routes import invoice_bp
    from app.routes.billing_routes import billing_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.report_routes import report_bp
    from app.routes.portal_routes import portal_bp
    from app.routes.livekit_routes import livekit_bp

    api_prefix = '/api/v1'

    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/auth')
    app.register_blueprint(staff_bp, url_prefix=f'{api_prefix}/staff')
    app.register_blueprint(customer_bp, url_prefix=f'{api_prefix}/customers')
    app.register_blueprint(product_bp, url_prefix=f'{api_prefix}/products')
    app.register_blueprint(plan_bp, url_prefix=f'{api_prefix}/plans')
    app.register_blueprint(quotation_bp, url_prefix=f'{api_prefix}/quotations')
    app.register_blueprint(subscription_bp, url_prefix=f'{api_prefix}/subscriptions')
    app.register_blueprint(tax_bp, url_prefix=f'{api_prefix}/taxes')
    app.register_blueprint(discount_bp, url_prefix=f'{api_prefix}/discounts')
    app.register_blueprint(invoice_bp, url_prefix=f'{api_prefix}/invoices')
    app.register_blueprint(billing_bp, url_prefix=f'{api_prefix}/billing')
    app.register_blueprint(payment_bp, url_prefix=f'{api_prefix}/payments')
    app.register_blueprint(dashboard_bp, url_prefix=f'{api_prefix}/dashboard')
    app.register_blueprint(report_bp, url_prefix=f'{api_prefix}/reports')
    app.register_blueprint(portal_bp, url_prefix=f'{api_prefix}/portal')
    app.register_blueprint(qt_bp, url_prefix=f'{api_prefix}/quotation-templates')
    app.register_blueprint(variant_bp, url_prefix=f'{api_prefix}/variants')
    app.register_blueprint(livekit_bp, url_prefix=f'{api_prefix}/livekit')

    # Health check
    @app.get('/api/v1/health')
    def health():
        return {'success': True, 'message': f'{cfg.APP_NAME} API is running'}

    return app
