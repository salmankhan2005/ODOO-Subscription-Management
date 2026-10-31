-- =============================================================================
-- Brightloop Subscription Management System — Complete Supabase SQL Schema
-- Execute this entire script in the Supabase SQL Editor.
-- Run in order; do not skip sections.
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SEQUENCE HELPER
-- Used to generate human-readable numbering (INV-2026-00001, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sequences (
    key        TEXT PRIMARY KEY,
    current_val BIGINT NOT NULL DEFAULT 0
);

INSERT INTO sequences (key, current_val)
VALUES ('quotation', 42), ('subscription', 8800), ('invoice', 1050), ('payment', 500)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION next_sequence_value(p_key TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_val BIGINT;
BEGIN
    UPDATE sequences
    SET current_val = current_val + 1
    WHERE key = p_key
    RETURNING current_val INTO v_val;
    RETURN v_val;
END;
$$;

-- =============================================================================
-- 1. PROFILES
-- Linked to Supabase Auth users. Stores role and application metadata.
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    full_name    TEXT NOT NULL DEFAULT '',
    role         TEXT NOT NULL DEFAULT 'customer'
                     CHECK (role IN ('admin', 'staff', 'customer')),
    phone        TEXT DEFAULT '',
    customer_id  UUID,  -- FK added after customers table
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- =============================================================================
-- 2. CUSTOMERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT DEFAULT '',
    company_name    TEXT DEFAULT '',
    billing_address TEXT DEFAULT '',
    country         TEXT DEFAULT '',
    tax_id          TEXT DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);

-- Add FK from profiles to customers
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- =============================================================================
-- 3. PRODUCTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'software'
                     CHECK (product_type IN ('software', 'service', 'addon', 'digital')),
    sales_price  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (sales_price >= 0),
    cost_price   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    description  TEXT DEFAULT '',
    notes        TEXT DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_name_idx ON products(name);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);

-- =============================================================================
-- 4. PRODUCT VARIANTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    sku              TEXT DEFAULT '',
    additional_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
    description      TEXT DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);

-- =============================================================================
-- 5. SUBSCRIPTION PLANS
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              TEXT NOT NULL,
    product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
    billing_interval  TEXT NOT NULL
                          CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval_count    INT NOT NULL DEFAULT 1 CHECK (interval_count >= 1),
    base_price        NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    minimum_quantity  INT NOT NULL DEFAULT 1 CHECK (minimum_quantity >= 1),
    start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date          DATE,
    auto_close_on_end BOOLEAN NOT NULL DEFAULT FALSE,
    allow_early_cancel BOOLEAN NOT NULL DEFAULT TRUE,
    allow_pause       BOOLEAN NOT NULL DEFAULT TRUE,
    allow_renewal     BOOLEAN NOT NULL DEFAULT TRUE,
    description       TEXT DEFAULT '',
    status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plans_status_idx ON subscription_plans(status);

-- =============================================================================
-- 6. QUOTATION TEMPLATES
-- =============================================================================

CREATE TABLE IF NOT EXISTS quotation_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    validity_days   INT NOT NULL DEFAULT 30,
    default_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    payment_terms   TEXT DEFAULT 'Due on receipt',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. QUOTATION TEMPLATE LINES
-- =============================================================================

CREATE TABLE IF NOT EXISTS quotation_template_lines (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    description TEXT DEFAULT '',
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price  NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. QUOTATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS quotations (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number          TEXT NOT NULL,
    customer_id               UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    template_id               UUID REFERENCES quotation_templates(id) ON DELETE SET NULL,
    plan_id                   UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    quotation_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until               DATE,
    subtotal                  NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount           NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount                NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount              NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency                  TEXT NOT NULL DEFAULT 'USD',
    payment_terms             TEXT DEFAULT 'Due on receipt',
    notes                     TEXT DEFAULT '',
    status                    TEXT NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','quotation','confirmed','converted','expired','cancelled')),
    converted_subscription_id UUID,  -- FK added after subscriptions table
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS quotations_number_idx ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS quotations_customer_id_idx ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS quotations_status_idx ON quotations(status);

-- =============================================================================
-- 9. QUOTATION LINES
-- =============================================================================

CREATE TABLE IF NOT EXISTS quotation_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    description     TEXT DEFAULT '',
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotation_lines_quotation_id_idx ON quotation_lines(quotation_id);

-- =============================================================================
-- 10. SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_number TEXT NOT NULL,
    customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id             UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    quotation_id        UUID REFERENCES quotations(id) ON DELETE SET NULL,
    billing_interval    TEXT NOT NULL
                            CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval_count      INT NOT NULL DEFAULT 1,
    start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date         DATE,
    next_billing_date   DATE,
    payment_terms       TEXT DEFAULT 'Due on receipt',
    currency            TEXT NOT NULL DEFAULT 'USD',
    subtotal            NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
    auto_renew          BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT DEFAULT '',
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','quotation','confirmed','active','paused','closed','cancelled','expired')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_number_idx ON subscriptions(subscription_number);
CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_next_billing_date_idx ON subscriptions(next_billing_date);

-- Add FK from quotations to subscriptions
ALTER TABLE quotations
    ADD CONSTRAINT fk_quotations_subscription
    FOREIGN KEY (converted_subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- =============================================================================
-- 11. SUBSCRIPTION LINES
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    description     TEXT DEFAULT '',
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_lines_subscription_id_idx ON subscription_lines(subscription_id);

-- =============================================================================
-- 12. TAX RULES
-- =============================================================================

CREATE TABLE IF NOT EXISTS tax_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    percentage              NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    tax_type                TEXT NOT NULL DEFAULT 'sales'
                                CHECK (tax_type IN ('sales', 'vat', 'gst')),
    applicable_product_ids  UUID[] DEFAULT '{}',
    start_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date                DATE,
    status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 13. DISCOUNT RULES
-- =============================================================================

CREATE TABLE IF NOT EXISTS discount_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    code                    TEXT UNIQUE,
    discount_type           TEXT NOT NULL DEFAULT 'percentage'
                                CHECK (discount_type IN ('percentage', 'fixed')),
    value                   NUMERIC(15,2) NOT NULL CHECK (value > 0),
    minimum_purchase        NUMERIC(15,2) NOT NULL DEFAULT 0,
    minimum_quantity        INT NOT NULL DEFAULT 1,
    applicable_product_ids  UUID[] DEFAULT '{}',
    applicable_subscriptions BOOLEAN NOT NULL DEFAULT TRUE,
    start_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date                DATE,
    max_usage               INT NOT NULL DEFAULT 0,  -- 0 = unlimited
    current_usage_count     INT NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'expired', 'disabled')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discount_rules_code_idx ON discount_rules(code);
CREATE INDEX IF NOT EXISTS discount_rules_status_idx ON discount_rules(status);

-- Atomic usage increment — prevents race conditions on usage limits
CREATE OR REPLACE FUNCTION increment_discount_usage(p_discount_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE discount_rules
    SET current_usage_count = current_usage_count + 1
    WHERE id = p_discount_id
      AND (max_usage = 0 OR current_usage_count < max_usage);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Discount usage limit reached or discount not found';
    END IF;
END;
$$;

-- =============================================================================
-- 14. DISCOUNT USAGES (history)
-- =============================================================================

CREATE TABLE IF NOT EXISTS discount_usages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id     UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_id      UUID,  -- FK added after invoices
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discount_usages_discount_id_idx ON discount_usages(discount_id);

-- =============================================================================
-- 15. INVOICES
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number       TEXT NOT NULL,
    customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    subscription_id      UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date             DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end   DATE,
    subtotal             NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount           NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_paid          NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_due           NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency             TEXT NOT NULL DEFAULT 'USD',
    notes                TEXT DEFAULT '',
    sent_at              DATE,
    status               TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','confirmed','paid','partially_paid','overdue','cancelled')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL: Prevent duplicate invoices for same subscription + billing period
CREATE UNIQUE INDEX IF NOT EXISTS invoices_sub_period_idx
    ON invoices(subscription_id, billing_period_start)
    WHERE subscription_id IS NOT NULL AND billing_period_start IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices(due_date);
CREATE INDEX IF NOT EXISTS invoices_invoice_date_idx ON invoices(invoice_date);

-- =============================================================================
-- 16. INVOICE LINES
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoice_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    description     TEXT DEFAULT '',
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_lines_invoice_id_idx ON invoice_lines(invoice_id);

-- Add FK from discount_usages to invoices
ALTER TABLE discount_usages
    ADD CONSTRAINT fk_discount_usages_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- =============================================================================
-- 17. PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference     TEXT NOT NULL,
    customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_method        TEXT NOT NULL DEFAULT 'Cash'
                              CHECK (payment_method IN ('Cash','Bank Transfer','UPI','Card','Cheque','Other')),
    amount                NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_reference TEXT DEFAULT '',
    notes                 TEXT DEFAULT '',
    status                TEXT NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('pending','completed','failed','refunded')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_idx ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS payments_customer_id_idx ON payments(customer_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);

-- =============================================================================
-- 18. PAYMENT ALLOCATIONS
-- Allows one payment to be split across multiple invoices (and partial payments).
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_allocations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id       UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id       UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(15,2) NOT NULL CHECK (allocated_amount > 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_alloc_payment_id_idx ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS payment_alloc_invoice_id_idx ON payment_allocations(invoice_id);

-- =============================================================================
-- 19. BILLING RUNS
-- =============================================================================

CREATE TABLE IF NOT EXISTS billing_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    triggered_by        TEXT DEFAULT 'system',
    status              TEXT NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress','completed','failed','partially_failed')),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    total_processed     INT NOT NULL DEFAULT 0,
    successful          INT NOT NULL DEFAULT 0,
    failed              INT NOT NULL DEFAULT 0,
    total_billed_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 20. BILLING RUN ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS billing_run_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_run_id  UUID NOT NULL REFERENCES billing_runs(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','success','failed')),
    billed_amount   NUMERIC(15,2) DEFAULT 0,
    error_message   TEXT,
    retry_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_run_items_run_id_idx ON billing_run_items(billing_run_id);
CREATE INDEX IF NOT EXISTS billing_run_items_sub_id_idx ON billing_run_items(subscription_id);

-- =============================================================================
-- 21. SUBSCRIPTION EVENTS (history log)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    description     TEXT DEFAULT '',
    actor_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sub_events_subscription_id_idx ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS sub_events_created_at_idx ON subscription_events(created_at);

-- =============================================================================
-- 22. AUDIT LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    table_name  TEXT,
    record_id   UUID,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- =============================================================================
-- TRIGGERS — updated_at auto-update
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'profiles','customers','products','product_variants','subscription_plans',
        'quotations','subscriptions','discount_rules','tax_rules',
        'invoices','payments'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Flask uses supabase_admin (service_role) which bypasses RLS.
-- RLS provides a second layer of defense if anon client is used directly.
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile only via anon client
CREATE POLICY "profiles_self_read" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Customers: authenticated users with customer role see only their own record
CREATE POLICY "customers_self_read" ON customers
    FOR SELECT USING (
        id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
    );

-- Subscriptions: customers see only their subscriptions
CREATE POLICY "subscriptions_self_read" ON subscriptions
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
    );

-- Invoices: customers see only their invoices
CREATE POLICY "invoices_self_read" ON invoices
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
    );

-- Payments: customers see only their payments
CREATE POLICY "payments_self_read" ON payments
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
    );

-- =============================================================================
-- SEED DATA — Initial admin account placeholder
-- Create the actual admin via Supabase Dashboard > Authentication > Users
-- then run:
--   INSERT INTO profiles (id, email, full_name, role)
--   VALUES ('<supabase_user_id>', 'admin@brightloop.com', 'System Admin', 'admin');
-- =============================================================================

-- Seed tax rule
INSERT INTO tax_rules (name, percentage, tax_type, status)
VALUES ('Standard GST 18%', 18.00, 'gst', 'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- DONE
-- =============================================================================
