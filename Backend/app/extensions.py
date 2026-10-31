"""
app/extensions.py — Initialises and exposes the Supabase client instances.

Two clients are maintained:
  - `supabase_admin` : uses the service_role key — bypasses RLS for server-side
                       operations that have already been authorised by Flask.
  - `create_supabase_anon_client` : returns a fresh auth client per operation,
                                    keeping concurrent sessions isolated.

IMPORTANT: `supabase_admin` must NEVER be exposed to the frontend.  All calls
through `supabase_admin` must be preceded by Flask-level role & ownership checks.
"""
from __future__ import annotations

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_url: str = os.environ.get('SUPABASE_URL', '')
_anon_key: str = os.environ.get('SUPABASE_ANON_KEY', '')
_service_key: str = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Admin client — bypasses RLS; use only after Flask authorisation
supabase_admin: Client = create_client(_url, _service_key)


def create_supabase_anon_client() -> Client:
    """Create an isolated anonymous client for one auth operation."""
    return create_client(_url, _anon_key)
