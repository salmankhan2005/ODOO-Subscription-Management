# Brightloop Subscription Management System

Brightloop is a subscription-management application with separate Admin, Staff, and Customer experiences. It supports customer and staff administration, product and plan management, quotations, subscriptions, recurring billing, invoices, payments, reporting, Stripe Checkout, and customer plan recommendations.

## Contents

- [Features and roles](#features-and-roles)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Setup and local development](#setup-and-local-development)
- [Database and initial admin](#database-and-initial-admin)
- [How the application works](#how-the-application-works)
- [API reference](#api-reference)
- [Plan recommendations and model evaluation](#plan-recommendations-and-model-evaluation)
- [Stripe checkout](#stripe-checkout)
- [Testing and production notes](#testing-and-production-notes)
- [Security](#security)

## Features and roles

| Role | Main capabilities |
|---|---|
| Admin | Manage staff, customers, products, plans, tax and discount rules; manage subscriptions, quotations, invoices, payments, billing, dashboards, and reports. |
| Staff | Work with customers, products, plans, subscriptions, quotations, invoices, payments, dashboards, and reports. Some configuration and staff-management actions are Admin-only. |
| Customer | Register and sign in, manage their own profile, browse plans, view recommendations, purchase a plan, review subscriptions and payments, and view or download invoices. |

The landing page lets a user launch a role-specific workspace. The selected role is checked against the signed-in account; selecting a portal does not grant that role. The API independently enforces authentication, role authorization, and customer ownership.

## Screenshots

Brightloop's landing page introduces the subscription billing and revenue recovery workflows.

<p align="center">
  <img src="docs/screenshots/01-landing-page.png" alt="Brightloop landing page and billing architecture overview" width="100%">
</p>

<details>
<summary>Sign-in screens</summary>

<p><img src="docs/screenshots/07-customer-sign-in.png" alt="Customer sign-in screen" width="100%"></p>
<p><img src="docs/screenshots/08-staff-sign-in.png" alt="Staff sign-in screen" width="100%"></p>

</details>

<details>
<summary>Customer portal</summary>

<p><img src="docs/screenshots/02-customer-available-plans.png" alt="Customer portal with available subscription plans" width="100%"></p>
<p><img src="docs/screenshots/03-customer-livekit-assistant.png" alt="Customer portal with the LiveKit voice support assistant" width="100%"></p>
<p><img src="docs/screenshots/04-customer-purchase-plan.png" alt="Plan purchase and manual payment details dialog" width="100%"></p>
<p><img src="docs/screenshots/05-customer-subscriptions.png" alt="Customer subscriptions and renewal information" width="100%"></p>
<p><img src="docs/screenshots/06-customer-profile-billing.png" alt="Customer organization profile and billing information" width="100%"></p>

</details>

<details>
<summary>Staff workspace</summary>

<p><img src="docs/screenshots/09-staff-dashboard.png" alt="Staff business dashboard" width="100%"></p>
<p><img src="docs/screenshots/10-staff-customers.png" alt="Staff customer management screen" width="100%"></p>
<p><img src="docs/screenshots/11-staff-plans-cadences.png" alt="Staff subscription plans and cadences" width="100%"></p>
<p><img src="docs/screenshots/12-staff-quotation-wizard.png" alt="Staff quotation creation wizard" width="100%"></p>
<p><img src="docs/screenshots/13-staff-subscriptions.png" alt="Staff subscription lifecycle screen" width="100%"></p>
<p><img src="docs/screenshots/14-staff-invoices.png" alt="Staff invoice management screen" width="100%"></p>
<p><img src="docs/screenshots/15-staff-payments.png" alt="Staff payment transactions screen" width="100%"></p>
<p><img src="docs/screenshots/16-staff-revenue-report.png" alt="Staff revenue report" width="100%"></p>
<p><img src="docs/screenshots/17-staff-report-print-preview.png" alt="Print preview for a staff revenue report" width="100%"></p>

</details>

<details>
<summary>Admin workspace</summary>

<p><img src="docs/screenshots/18-admin-dashboard.png" alt="Admin business dashboard" width="100%"></p>
<p><img src="docs/screenshots/19-admin-dashboard-detail.png" alt="Admin dashboard with subscription and invoice summaries" width="100%"></p>
<p><img src="docs/screenshots/20-admin-customers.png" alt="Admin customer management screen" width="100%"></p>
<p><img src="docs/screenshots/21-admin-products-variants.png" alt="Admin product catalog and variants" width="100%"></p>
<p><img src="docs/screenshots/22-admin-plans-cadences.png" alt="Admin subscription plans and cadences" width="100%"></p>
<p><img src="docs/screenshots/23-admin-quotations.png" alt="Admin quotation management screen" width="100%"></p>
<p><img src="docs/screenshots/24-admin-subscriptions.png" alt="Admin subscription lifecycle screen" width="100%"></p>
<p><img src="docs/screenshots/25-admin-invoices.png" alt="Admin invoice management screen" width="100%"></p>
<p><img src="docs/screenshots/26-admin-payments.png" alt="Admin payment transactions screen" width="100%"></p>
<p><img src="docs/screenshots/27-admin-ai-billing-dunning.png" alt="Admin AI billing and dunning workspace" width="100%"></p>
<p><img src="docs/screenshots/28-admin-taxes-discounts.png" alt="Admin tax and discount pricing simulator" width="100%"></p>
<p><img src="docs/screenshots/29-admin-tax-rules.png" alt="Admin tax rules screen" width="100%"></p>
<p><img src="docs/screenshots/30-admin-revenue-reports.png" alt="Admin revenue reporting screen" width="100%"></p>
<p><img src="docs/screenshots/31-admin-add-staff.png" alt="Admin form for creating a staff account" width="100%"></p>

</details>

## Architecture

```text
Frontend/                         React 19, TypeScript, Vite, Tailwind CSS
  src/
    api/                          API clients and response mappers
    components/                   Landing, auth, Admin/Staff/Customer UI
    context/                      Authentication and toast contexts
    types/                        Shared frontend types

Backend/                          Python 3.11+, Flask, Supabase SDK
  app/
    routes/                       Versioned Flask API blueprints
    services/                     Business logic and data access
    middleware/                   Authentication, role checks, error handling
    utils/                        Pricing, dates, PDFs, pagination, validation
  database/schema.sql             Supabase PostgreSQL schema
  subscription_optimizer_model.pkl
```

The frontend calls the Flask API at `http://localhost:5000/api/v1` by default. Override this in the frontend with `VITE_API_BASE_URL`. Supabase Auth handles user credentials and tokens; Supabase PostgreSQL stores application records. The Flask server uses the service-role key for server-side data access after authorization checks.

## Requirements

- Python 3.11 or later
- Node.js and npm compatible with the versions in `Frontend/package.json`
- A Supabase project (Auth and PostgreSQL)
- A Stripe account and Stripe test-mode keys to exercise hosted checkout

## Setup and local development

### 1. Configure Supabase

Create a Supabase project, then run the complete [`Backend/database/schema.sql`](Backend/database/schema.sql) in the Supabase SQL Editor. This creates the application tables and supporting database objects. Do this before creating the first admin or starting application workflows.

### 2. Configure and run the backend

In PowerShell:

```powershell
cd Backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `Backend/.env` and provide the values for your own environment:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public/anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key |
| `SECRET_KEY` | Flask signing secret; use a long, random value outside local development |
| `BILLING_SECRET` | Additional secret checked by the recurring billing endpoint |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `FRONTEND_URL` | Frontend origin used for authentication and checkout return links |
| `FLASK_ENV`, `FLASK_DEBUG` | Flask environment and development-debug settings |
| `STRIPE_SECRET_KEY` | Stripe secret API key; use a test key while developing |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the Stripe webhook endpoint |
| `STRIPE_CURRENCY` | Three-letter lowercase Stripe currency code (defaults to `usd`) |
| `APP_NAME` | API health-check display name |

Keep the real `.env` file private. The checked-in `.env.example` is only a template; replace its values with your own settings.

Start the Flask development server:

```powershell
python run.py
```

The API listens on `http://localhost:5000`. Check `http://localhost:5000/api/v1/health` to confirm that it is responding.

### 3. Configure and run the frontend

In another PowerShell terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open `http://localhost:3000`. To use a different backend, create `Frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

The value must include the `/api/v1` prefix.

### 4. Create an initial Admin

After setting `Backend/.env` and applying the schema, run:

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
python seed_admin.py
```

The script prompts for an email and a hidden password. It creates a Supabase Auth user and the linked Admin profile; it will not silently promote an existing non-admin account. Admins can create Staff accounts through the application.

Customer accounts can register from the customer sign-in flow. The backend registration endpoint creates customer accounts; Admin/Staff access is managed separately.

## Database and initial admin

The schema is maintained in [`Backend/database/schema.sql`](Backend/database/schema.sql). Its primary business entities include:

- Profiles and customers
- Products, product variants, and subscription plans
- Quotations, quotation templates, and their line items
- Subscriptions, subscription lines, and subscription events
- Tax rules, discount rules, and discount usage
- Invoices, invoice lines, payments, and payment allocations
- Billing runs and billing-run items
- Sequences and audit logs

Human-readable quotation, subscription, invoice, and payment numbers use database sequence helpers. Treat the SQL schema as the source of truth when initializing or updating a development database.

## How the application works

1. A user selects Admin, Staff, or Customer on the landing page and signs in or registers where applicable.
2. The frontend stores tab-scoped session information and verifies restored sessions with `GET /auth/me`.
3. The backend validates Supabase access tokens and applies role guards to protected routes. Customer portal operations are scoped to the customer linked to the authenticated profile.
4. Admins and Staff manage business records through the operational workspaces. Plans are managed separately from products and are visible to customers when active and within their configured dates.
5. A customer browses eligible plans, purchases through the portal flow, and can view the resulting active subscription, payment, and invoice records. Invoice PDFs are generated by the backend.
6. Recurring billing finds active subscriptions due for billing, creates invoices, and records the outcome in billing-run records.

### Pagination

Paginated list endpoints accept `page` and `per_page`. The backend defaults to page `1` and `20` records per page, and limits `per_page` to `100`. Paginated responses include metadata such as `page`, `per_page`, `total`, `total_pages`, `has_next`, and `has_prev`. For example:

```text
GET /api/v1/customers?page=2&per_page=50&search=acme&status=active
```

The Admin/Staff customer screen uses this API pagination rather than loading the entire customer table at once.

## API reference

Base URL: `http://localhost:5000/api/v1`

Protected endpoints require an access token:

```http
Authorization: Bearer <access_token>
```

The API uses JSON for ordinary requests and returns a success/error envelope. Pagination metadata is returned for paginated list operations. Invoice PDF endpoints return a PDF download instead of a JSON document.

`<id>` in the paths below is the corresponding resource identifier. Unless noted otherwise, the methods and routes listed are registered by the current Flask application.

### Health and authentication

| Method | Path | Access |
|---|---|---|
| GET | `/health` | Public |
| POST | `/auth/register` | Public; customer registration |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Authenticated |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public; password reset is completed through the Supabase reset-link flow |
| POST | `/auth/refresh` | Public; requires a valid refresh token |
| GET | `/auth/me` | Authenticated |

### Staff and customers

| Method | Path | Access |
|---|---|---|
| GET, POST | `/staff` | Admin |
| GET, PUT | `/staff/<staff_id>` | Admin |
| PATCH | `/staff/<staff_id>/status` | Admin |
| GET, POST | `/customers` | Admin or Staff |
| GET, PUT, DELETE | `/customers/<customer_id>` | Admin or Staff |
| GET | `/customers/<customer_id>/subscriptions` | Admin or Staff |
| GET | `/customers/<customer_id>/invoices` | Admin or Staff |
| GET | `/customers/<customer_id>/payments` | Admin or Staff |
| GET | `/customers/<customer_id>/balance` | Admin or Staff |

Deleting a customer deactivates the customer record rather than hard-deleting its financial history. The customer list accepts `page`, `per_page`, `search`, and `status`.

### Products, variants, and plans

| Method | Path | Access |
|---|---|---|
| GET | `/products` | Admin or Staff |
| POST | `/products` | Admin |
| GET | `/products/<product_id>` | Admin or Staff |
| PUT, DELETE | `/products/<product_id>` | Admin |
| GET | `/products/<product_id>/variants` | Admin or Staff |
| POST | `/products/<product_id>/variants` | Admin |
| PUT, DELETE | `/variants/<variant_id>` | Admin |
| GET, POST | `/plans` | Admin or Staff |
| GET, PUT, DELETE | `/plans/<plan_id>` | Admin or Staff |
| PATCH | `/plans/<plan_id>/status` | Admin or Staff |

Plan listing accepts `page`, `per_page`, and `status`. A plan DELETE archives the plan; it does not erase historical subscription records.

### Quotations and templates

| Method | Path | Access |
|---|---|---|
| GET, POST | `/quotations` | Admin or Staff |
| GET, PUT | `/quotations/<quotation_id>` | Admin or Staff |
| POST | `/quotations/<quotation_id>/confirm` | Admin or Staff |
| POST | `/quotations/<quotation_id>/convert-to-subscription` | Admin or Staff |
| POST | `/quotations/<quotation_id>/cancel` | Admin or Staff |
| GET, POST | `/quotation-templates` | Admin or Staff |
| GET, PUT | `/quotation-templates/<template_id>` | Admin or Staff |
| DELETE | `/quotation-templates/<template_id>` | Admin |

### Subscriptions

| Method | Path | Access |
|---|---|---|
| GET, POST | `/subscriptions` | Admin or Staff |
| GET, PUT, DELETE | `/subscriptions/<subscription_id>` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/confirm` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/activate` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/pause` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/resume` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/cancel` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/close` | Admin or Staff |
| POST | `/subscriptions/<subscription_id>/renew` | Admin or Staff |
| GET | `/subscriptions/<subscription_id>/history` | Admin or Staff |

Subscription lists accept `page`, `per_page`, `status`, and `customer_id`.

### Taxes and discounts

| Method | Path | Access |
|---|---|---|
| GET | `/taxes` | Admin or Staff |
| POST | `/taxes` | Admin |
| GET | `/taxes/<tax_id>` | Admin or Staff |
| PUT, DELETE | `/taxes/<tax_id>` | Admin |
| POST | `/taxes/calculate` | Admin or Staff |
| GET, POST | `/discounts` | Admin |
| GET, PUT, DELETE | `/discounts/<discount_id>` | Admin |
| GET | `/discounts/<discount_id>/usage` | Admin |
| POST | `/discounts/validate` | Admin or Staff |

### Invoices and payments

| Method | Path | Access |
|---|---|---|
| GET, POST | `/invoices` | Admin or Staff |
| GET | `/invoices/overdue` | Admin or Staff |
| GET | `/invoices/outstanding` | Admin or Staff |
| POST | `/invoices/generate` | Admin or Staff |
| GET, PUT | `/invoices/<invoice_id>` | Admin or Staff |
| POST | `/invoices/<invoice_id>/confirm` | Admin or Staff |
| POST | `/invoices/<invoice_id>/send` | Admin or Staff |
| POST | `/invoices/<invoice_id>/cancel` | Admin or Staff |
| GET | `/invoices/<invoice_id>/pdf` | Admin or Staff |
| GET | `/invoices/<invoice_id>/payments` | Admin or Staff |
| GET, POST | `/payments` | Admin or Staff |
| GET, PUT | `/payments/<payment_id>` | Admin or Staff |
| GET | `/payments/<payment_id>/allocations` | Admin or Staff |
| POST | `/payments/<payment_id>/refund` | Admin or Staff |

### Billing

| Method | Path | Access |
|---|---|---|
| POST | `/billing/run` | Authenticated; Admin or valid `X-Billing-Secret` |
| GET | `/billing/runs` | Admin |
| GET | `/billing/runs/<run_id>` | Admin |
| GET | `/billing/due-subscriptions` | Admin |
| GET | `/billing/preview` | Admin |
| POST | `/billing/retry/<run_item_id>` | Admin |

The billing-run endpoint is also wrapped by the authentication middleware; a scheduler must satisfy the route's authentication and billing-secret checks. Do not expose the billing secret in browser code.

### Dashboards and reports

| Method | Path | Access |
|---|---|---|
| GET | `/dashboard/admin` | Admin |
| GET | `/dashboard/staff` | Admin or Staff |
| GET | `/dashboard/customer` | Customer |
| GET | `/dashboard/revenue-summary` | Admin |
| GET | `/dashboard/subscription-summary` | Admin or Staff |
| GET | `/dashboard/payment-summary` | Admin or Staff |
| GET | `/dashboard/overdue-summary` | Admin or Staff |
| GET | `/reports/revenue` | Admin or Staff |
| GET | `/reports/subscriptions` | Admin or Staff |
| GET | `/reports/payments` | Admin or Staff |
| GET | `/reports/invoices` | Admin or Staff |
| GET | `/reports/overdue` | Admin or Staff |
| GET | `/reports/customers` | Admin or Staff |
| GET | `/reports/products` | Admin or Staff |
| GET | `/reports/discounts` | Admin or Staff |

Report endpoints accept pagination parameters. Depending on the report, optional filters include `date_from`, `date_to`, `status`, `method`, and `customer_id`.

### Customer self-service portal

All `/portal` routes below require a Customer account and enforce access to that customer's own data. Stripe's webhook is the exception: it is public at the HTTP-auth layer and verifies Stripe's request signature.

| Method | Path | Access |
|---|---|---|
| GET, PUT | `/portal/profile` | Customer; own profile |
| GET | `/portal/products` | Customer; active products |
| GET | `/portal/plans` | Customer; available plans |
| GET | `/portal/recommendations` | Customer; plan rankings and optimizer suggestions |
| POST | `/portal/plans/<plan_id>/purchase` | Customer; direct portal purchase flow |
| POST | `/portal/plans/<plan_id>/checkout` | Customer; creates a Stripe Checkout session |
| POST | `/portal/payments/stripe/confirm` | Customer; confirms a Stripe session |
| POST | `/portal/payments/stripe/webhook` | Public endpoint; Stripe signature required |
| GET | `/portal/subscriptions` | Customer; own subscriptions |
| GET | `/portal/subscriptions/<subscription_id>` | Customer; own subscription |
| POST | `/portal/subscriptions/<subscription_id>/cancel-request` | Customer; own subscription |
| POST | `/portal/subscriptions/<subscription_id>/pause-request` | Customer; own subscription |
| POST | `/portal/subscriptions/<subscription_id>/renew-request` | Customer; own subscription |
| GET | `/portal/invoices` | Customer; own invoices |
| GET | `/portal/invoices/<invoice_id>` | Customer; own invoice |
| GET | `/portal/invoices/<invoice_id>/pdf` | Customer; own invoice PDF |
| GET | `/portal/payments` | Customer; own payments |

## Plan recommendations and model evaluation

The model artifact is [`Backend/subscription_optimizer_model.pkl`](Backend/subscription_optimizer_model.pkl). The application loads it lazily for recommendations to customers who already have active or paused subscriptions.

### Recommendation behavior

- The portal first ranks active plans by historical subscription adoption and number of distinct customers choosing each plan. Its popularity score weights subscription count at 70% and distinct-customer count at 30%.
- A customer's prior billing interval is used as an additional preference when available. New customers without subscription history receive the popularity ranking without a personal billing-cadence preference.
- For existing subscribers, the optimizer compares eligible alternative plans and predicts an action. Suggestions can include an upgrade, downgrade, or review of a potentially unused subscription. Predictions such as `keep_current_plan`, `no_suitable_alternative`, and `insufficient_data` are not shown as alternative-plan suggestions.
- The response from `/portal/recommendations` contains `plans` and `optimizer_recommendations`.

### Model details

| Property | Verified artifact detail |
|---|---|
| Pipeline | `SimpleImputer` → `StandardScaler` → `RandomForestClassifier` |
| Random forest trees | 120 |
| Input features | 17 |
| Fitted samples | 280 |
| Output classes | `downgrade`, `insufficient_data`, `keep_current_plan`, `no_suitable_alternative`, `review_unused_subscription`, `upgrade` |
| Runtime version | scikit-learn `1.8.0` (pinned in `Backend/requirements.txt`) |

The 17 inputs cover current and alternative monthly cost, cost difference and savings, utilization and usage indicators, capacity and plan-feature comparisons, billing cadence, commitment duration, cancellation fee, and historical acceptance rate. The present database does not provide several usage, capacity, feature-overlap, or cancellation-fee values; the recommendation service represents unavailable inputs as missing values for the pipeline's fitted imputer rather than inventing customer data.

Inference currently passes values positionally in the feature order above. Since the pipeline was fitted with named features, scikit-learn can emit a feature-name warning for these array inputs; keep the service's feature order aligned with the model's trained order.

### Evaluation and limitations

The checked-in serialized model exposes its fitted pipeline, class labels, feature names, and fitted sample count. **No accuracy, precision, recall, F1, ROC-AUC, confusion matrix, or validation/test-set report was found in the model artifact or backend source.** Therefore this README does not claim that the model has a particular predictive accuracy. The fitted sample count is not an evaluation score.

Before using these recommendations for consequential decisions, evaluate the model on a held-out dataset and report class-wise precision/recall/F1, a confusion matrix, and the dataset split and class distribution. Recommendations are decision support: customers should be able to review plan prices and details themselves. Model predictions can be limited by missing usage and feature data.

The model file is a Python pickle/joblib artifact. Only load a trusted artifact. Keep it compatible with the pinned scikit-learn runtime; replace or retrain it only with a reviewed, versioned model.

## Stripe checkout

Plan checkout uses Stripe-hosted Checkout. Configure `STRIPE_SECRET_KEY`, `STRIPE_CURRENCY`, and `FRONTEND_URL` in the backend environment. Set `STRIPE_WEBHOOK_SECRET` when enabling webhook processing. Never put Stripe secret keys in frontend configuration.

Configure the Stripe webhook endpoint:

```text
POST https://<your-api-host>/api/v1/portal/payments/stripe/webhook
```

Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The webhook verifies the `Stripe-Signature`, confirms the payment status and expected amount, and avoids processing an already-recorded Checkout session twice. The customer return flow also calls the authenticated confirmation endpoint. Use Stripe test mode for development; no real payment should be attempted with test credentials.

## Testing and production notes

Backend tests:

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
```

Frontend type-check and production build:

```powershell
cd Frontend
npm run lint
npm run build
```

`npm run dev` and `python run.py` are development servers. For production, set `FLASK_ENV=production`, disable debug mode, use a production WSGI server (the backend entry point documents Gunicorn), serve the built frontend through an appropriate static host, and configure HTTPS, allowed CORS origins, database access, secrets, and Stripe webhooks for that environment.

## Security

- Never commit `.env` files, access tokens, Supabase service-role keys, Stripe secrets, or billing secrets.
- The Supabase service-role key bypasses Row Level Security. Keep it exclusively on the backend, and retain server-side authentication, role checks, and customer ownership validation.
- Use unique, strong production values for `SECRET_KEY` and `BILLING_SECRET`; do not rely on development defaults.
- Keep CORS limited to trusted frontend origins and use HTTPS outside local development.
- Do not log passwords, tokens, payment details, or secret configuration.
- Verify Stripe webhook signatures and use Stripe-hosted Checkout rather than handling card data in this application.
