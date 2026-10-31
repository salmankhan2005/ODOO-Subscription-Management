"""tests/conftest.py — Shared pytest fixtures."""
import pytest
from app import create_app


@pytest.fixture(scope='session')
def app():
    application = create_app()
    application.config.update({
        'TESTING': True,
        'DEBUG': False,
    })
    return application


@pytest.fixture(scope='session')
def client(app):
    return app.test_client()
