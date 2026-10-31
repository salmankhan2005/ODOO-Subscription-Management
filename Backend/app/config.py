"""
app/config.py — Centralised configuration loaded from environment variables.
"""
from __future__ import annotations

import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    def load_dotenv(*_args, **_kwargs):
        pass
    load_dotenv()


class Config:
    # Flask
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV: str = os.environ.get('FLASK_ENV', 'development')
    DEBUG: bool = os.environ.get('FLASK_DEBUG', '1') == '1'

    # Supabase
    SUPABASE_URL: str = os.environ.get('SUPABASE_URL', '')
    SUPABASE_ANON_KEY: str = os.environ.get('SUPABASE_ANON_KEY', '')
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

    # CORS
    CORS_ORIGINS: list = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:5173,http://localhost:3000'
    ).split(',')

    # Billing
    BILLING_SECRET: str = os.environ.get('BILLING_SECRET', 'billing-secret-change-me')

    # App
    APP_NAME: str = os.environ.get('APP_NAME', 'Brightloop SMS')
    FRONTEND_URL: str = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # LiveKit Voice Support Agent
    LIVEKIT_URL: str = os.environ.get('LIVEKIT_URL', 'wss://oddoo-hackathon-ulmfmcmg.livekit.cloud')
    LIVEKIT_API_KEY: str = os.environ.get('LIVEKIT_API_KEY', 'APInfGW9ufHjmk9')
    LIVEKIT_API_SECRET: str = os.environ.get('LIVEKIT_API_SECRET', 'FLHvKbawzyAW5pLRvkwDngbzzzc3Q2cvPRLvfKdpx3f')

    # Rate limiting
    RATELIMIT_DEFAULT: str = '200 per minute'
    RATELIMIT_AUTH: str = '10 per minute'


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': DevelopmentConfig,
}


def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config_map.get(env, DevelopmentConfig)
