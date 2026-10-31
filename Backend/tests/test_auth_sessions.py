from types import SimpleNamespace

from app.services import auth_service


def test_logins_use_separate_supabase_auth_clients(monkeypatch):
    clients = []

    class FakeAuth:
        def __init__(self, user_id):
            self.user_id = user_id

        def sign_in_with_password(self, credentials):
            session = SimpleNamespace(
                access_token=f'access-{self.user_id}',
                refresh_token=f'refresh-{self.user_id}',
                expires_at=123,
            )
            user = SimpleNamespace(id=self.user_id, email=credentials['email'])
            return SimpleNamespace(session=session, user=user)

    def create_client():
        client = SimpleNamespace(auth=FakeAuth(f'user-{len(clients) + 1}'))
        clients.append(client)
        return client

    class ProfileQuery:
        def select(self, fields):
            return self

        def eq(self, field, value):
            self.user_id = value
            return self

        def single(self):
            return self

        def execute(self):
            return SimpleNamespace(data={
                'id': self.user_id,
                'email': f'{self.user_id}@example.com',
                'full_name': self.user_id,
                'role': 'admin',
                'status': 'active',
            })

    monkeypatch.setattr(auth_service, 'create_supabase_anon_client', create_client)
    monkeypatch.setattr(auth_service.supabase_admin, 'table', lambda name: ProfileQuery())

    first, first_error = auth_service.login_user('first@example.com', 'password')
    second, second_error = auth_service.login_user('second@example.com', 'password')

    assert first_error is None
    assert second_error is None
    assert first['access_token'] == 'access-user-1'
    assert second['access_token'] == 'access-user-2'
    assert clients[0] is not clients[1]


def test_logout_revokes_only_local_supabase_session(monkeypatch):
    clients = []

    class FakeAuth:
        def __init__(self):
            self.session = None
            self.sign_out_options = None

        def set_session(self, access_token, refresh_token):
            self.session = (access_token, refresh_token)

        def sign_out(self, options):
            self.sign_out_options = options

    def create_client():
        client = SimpleNamespace(auth=FakeAuth())
        clients.append(client)
        return client

    monkeypatch.setattr(auth_service, 'create_supabase_anon_client', create_client)

    assert auth_service.logout_user('access-one', 'refresh-one') == (True, None)
    assert auth_service.logout_user('access-two', 'refresh-two') == (True, None)

    assert clients[0].auth.session == ('access-one', 'refresh-one')
    assert clients[1].auth.session == ('access-two', 'refresh-two')
    assert clients[0].auth.sign_out_options == {'scope': 'local'}
    assert clients[1].auth.sign_out_options == {'scope': 'local'}
    assert clients[0] is not clients[1]
