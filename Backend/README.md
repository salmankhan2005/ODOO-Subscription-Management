# Backend — Brightloop Subscription Management System

## Tech Stack
- **Python 3.11+** · Flask 3 · Supabase Python SDK · JWT (via Supabase Auth)
- **Database** : Supabase PostgreSQL (no SQLAlchemy / no local SQLite)
- **PDF** : ReportLab
- **Tests** : pytest

---

## Quick Start

### 1 — Database Setup (do this first)

1. Open your [Supabase project SQL Editor](https://app.supabase.com).
2. Copy the entire contents of `database/schema.sql`.
3. Paste and **Run** it.

That creates all 22 tables, indexes, RLS policies, triggers and seed data.

**Create the admin user:**

```sql
-- After running schema.sql, go to Authentication > Users > Invite / Add User
-- then insert the profile manually:
INSERT INTO profiles (id, email, full_name, role)
VALUES ('<paste-supabase-auth-user-id>', 'admin@brightloop.com', 'System Admin', 'admin');
```

### 2 — Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role secret key |
| `SECRET_KEY` | Any long random string |
| `BILLING_SECRET` | Any long random string (shared with your cron scheduler) |

> ⚠️ **Never** commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

### 3 — Python Environment

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4 — Run the Development Server

```bash
python run.py
```

API is available at: `http://localhost:5000/api/v1`

Health check: `GET http://localhost:5000/api/v1/health`

### 5 — Run Tests

```bash
pytest tests/ -v
```

---

## Project Structure

```
Backend/
├── app/
│   ├── __init__.py            ← Application factory
│   ├── config.py              ← Environment config
│   ├── extensions.py          ← Supabase client (anon + admin)
│   ├── middleware/
│   │   ├── authentication.py  ← JWT verification (@require_auth)
│   │   ├── authorization.py   ← RBAC decorators (@admin_only etc.)
│   │   └── error_handler.py   ← Centralised error responses
│   ├── routes/                ← Thin Flask Blueprints
│   ├── services/              ← All business logic
│   └── utils/                 ← Helpers (pricing, dates, PDF, pagination)
├── database/
│   └── schema.sql             ← Complete Supabase SQL (run in SQL Editor)
├── tests/
├── run.py
├── requirements.txt
└── .env.example
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

All protected routes require:
```
Authorization: Bearer <supabase_access_token>
```

### Response Format

```json
{ "success": true, "message": "...", "data": {}, "pagination": null }
```

Error:
```json
{ "success": false, "message": "...", "error": { "code": "ERROR_CODE" } }
```

### Key Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register customer |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Any | Current user |
| GET | `/customers` | Admin/Staff | List customers |
| POST | `/subscriptions/{id}/activate` | Admin/Staff | Activate subscription |
| POST | `/billing/run` | Admin / Billing Secret | Run billing cycle |
| GET | `/invoices/{id}/pdf` | Admin/Staff | Download PDF |
| GET | `/portal/subscriptions` | Customer | Own subscriptions |
| GET | `/dashboard/admin` | Admin | Admin dashboard |

---

## Automated Billing

The billing engine runs at `POST /api/v1/billing/run`.

For production, trigger it with a cron job or external scheduler:

```bash
# Example: curl cron every day at 00:05
curl -X POST https://your-api.com/api/v1/billing/run \
     -H "X-Billing-Secret: your-billing-secret"
```

The engine is **idempotent** — re-running it will not generate duplicate invoices.

---

## Security Notes

- All financial totals are **calculated server-side** — frontend totals are ignored.
- Customer data isolation is enforced via ownership checks on every portal endpoint.
- Portal endpoints require a customer account; administrative endpoints enforce admin/staff roles on the server.
- Auth operations use isolated Supabase Auth clients, and logout revokes only the caller's local session.
- Discount usage limits are enforced with a PostgreSQL atomic function (`increment_discount_usage`).
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — it is used only inside Flask after role verification.

## Create the Initial Admin

After configuring `Backend/.env` with the Supabase URL and service-role key, run:

```powershell
cd Backend
python seed_admin.py
```

The script defaults to `salman@gmail.com` and prompts for the password without
displaying it. It creates the user in Supabase Auth and adds the linked `admin`
profile. It is safe to rerun: an existing admin is left unchanged, and an
existing account with a different role is not promoted.
