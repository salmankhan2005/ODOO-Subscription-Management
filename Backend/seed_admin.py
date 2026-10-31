"""Create the initial admin account in Supabase Auth and the profiles table."""

import getpass
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


DEFAULT_ADMIN_EMAIL = 'salman@gmail.com'


def main() -> int:
    load_dotenv(Path(__file__).resolve().parent / '.env')

    required_settings = (
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
    )
    missing = [key for key in required_settings if not os.environ.get(key)]
    if missing:
        print(
            f"Missing required settings in Backend/.env: {', '.join(missing)}",
            file=sys.stderr,
        )
        return 1

    email = input(f'Admin email [{DEFAULT_ADMIN_EMAIL}]: ').strip() or DEFAULT_ADMIN_EMAIL
    password = getpass.getpass('Admin password (input hidden): ')
    if not password:
        print('Password cannot be empty.', file=sys.stderr)
        return 1

    supabase = create_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )

    existing_profiles = (
        supabase.table('profiles')
        .select('id, role')
        .eq('email', email)
        .execute()
        .data
        or []
    )
    if existing_profiles:
        profile = existing_profiles[0]
        if profile.get('role') == 'admin':
            print(f'Admin account already exists for {email}; no changes made.')
            return 0
        print(
            f'An account already exists for {email} with role '
            f"{profile.get('role')!r}; refusing to change its role.",
            file=sys.stderr,
        )
        return 1

    auth_user = None
    try:
        response = supabase.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {'full_name': email.split('@', 1)[0].title(), 'role': 'admin'},
        })
        auth_user = response.user
        if auth_user is None:
            raise RuntimeError('Supabase did not return the created auth user.')

        supabase.table('profiles').insert({
            'id': auth_user.id,
            'email': email,
            'full_name': email.split('@', 1)[0].title(),
            'role': 'admin',
        }).execute()
    except Exception as exc:
        if auth_user is not None:
            try:
                supabase.auth.admin.delete_user(auth_user.id)
            except Exception as cleanup_exc:
                print(
                    'Could not remove the newly created Auth account after profile '
                    f'creation failed: {cleanup_exc}',
                    file=sys.stderr,
                )
        print(f'Could not create the admin account: {exc}', file=sys.stderr)
        return 1

    print(f'Created the admin account for {email}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
