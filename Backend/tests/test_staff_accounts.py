from types import SimpleNamespace

import pytest

from app.services import auth_service


@pytest.mark.parametrize(
    ('payload', 'expected_error'),
    [
        (
            {
                'full_name': 'New Staff',
                'email': 'not-an-email',
                'password': 'Str0ng@Password',
                'role': 'staff',
            },
            'Invalid email address',
        ),
        (
            {
                'full_name': 'New Staff',
                'email': 'staff@example.com',
                'password': 'Str0ng@Password',
                'role': 'customer',
            },
            'Role must be staff or admin',
        ),
    ],
)
def test_create_staff_account_rejects_invalid_input(monkeypatch, payload, expected_error):
    def fail_if_called(*args, **kwargs):
        pytest.fail('Supabase must not be called for invalid account data')

    monkeypatch.setattr(auth_service.supabase_admin.auth.admin, 'create_user', fail_if_called)

    result, error = auth_service.create_staff_account(payload, 'admin-id')

    assert result is None
    assert error == expected_error


def test_create_staff_account_removes_auth_user_if_profile_insert_fails(monkeypatch):
    auth_user = SimpleNamespace(id='new-user-id')
    delete_user = []

    class FailedProfileInsert:
        def execute(self):
            raise RuntimeError('profile insert failed')

    class ProfilesTable:
        def insert(self, payload):
            assert payload['id'] == auth_user.id
            assert payload['role'] == 'staff'
            return FailedProfileInsert()

    monkeypatch.setattr(
        auth_service.supabase_admin.auth.admin,
        'create_user',
        lambda payload: SimpleNamespace(user=auth_user),
    )
    monkeypatch.setattr(
        auth_service.supabase_admin.auth.admin,
        'delete_user',
        lambda user_id: delete_user.append(user_id),
    )
    monkeypatch.setattr(auth_service.supabase_admin, 'table', lambda name: ProfilesTable())

    result, error = auth_service.create_staff_account(
        {
            'full_name': 'New Staff',
            'email': 'staff@example.com',
            'password': 'Str0ng@Password',
            'role': 'staff',
        },
        'admin-id',
    )

    assert result is None
    assert error == 'Failed to create staff account'
    assert delete_user == [auth_user.id]
