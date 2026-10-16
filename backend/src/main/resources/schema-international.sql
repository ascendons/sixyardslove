-- =============================================
-- International Orders Support - Schema Migration
-- =============================================

-- 1. Currencies table
CREATE TABLE IF NOT EXISTS currencies (
    code        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    symbol      TEXT NOT NULL,
    exchange_rate NUMERIC(16,6) NOT NULL,
    is_base     BOOLEAN DEFAULT FALSE,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 2. Country-currency mapping
CREATE TABLE IF NOT EXISTS country_currency_map (
    country_code  TEXT PRIMARY KEY,
    currency_code TEXT NOT NULL REFERENCES currencies(code),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- 3. Tax rates (product_id NULL = country default, product_id set = product-specific)
CREATE TABLE IF NOT EXISTS tax_rates (
    id           UUID PRIMARY KEY,
    product_id   UUID REFERENCES products(id),
    country_code TEXT NOT NULL,
    name         TEXT NOT NULL,
    rate         NUMERIC(5,2) NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_rate_product_country
    ON tax_rates (product_id, country_code) WHERE deleted_at IS NULL AND product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_rate_country_default
    ON tax_rates (country_code) WHERE deleted_at IS NULL AND product_id IS NULL;

-- 4. ALTER orders table — add international columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate  NUMERIC(16,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount     NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate       NUMERIC(5,2);

-- 5. ALTER order_items table — per-item tax
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate   NUMERIC(5,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);

-- =============================================
-- Seed data
-- =============================================

-- Currencies (rates relative to INR as base)
INSERT INTO currencies (code, name, symbol, exchange_rate, is_base, is_active)
VALUES
    ('INR', 'Indian Rupee',       '₹',  1.000000, TRUE,  TRUE),
    ('USD', 'US Dollar',          '$',  0.012000, FALSE, TRUE),
    ('EUR', 'Euro',               '€',  0.011000, FALSE, TRUE),
    ('GBP', 'British Pound',      '£',  0.009500, FALSE, TRUE),
    ('JPY', 'Japanese Yen',       '¥',  1.800000, FALSE, TRUE),
    ('AUD', 'Australian Dollar',  'A$', 0.018000, FALSE, TRUE),
    ('CAD', 'Canadian Dollar',    'C$', 0.016000, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Country-currency mappings
INSERT INTO country_currency_map (country_code, currency_code)
VALUES
    ('IN', 'INR'),
    ('US', 'USD'),
    ('DE', 'EUR'),
    ('FR', 'EUR'),
    ('IT', 'EUR'),
    ('ES', 'EUR'),
    ('NL', 'EUR'),
    ('BE', 'EUR'),
    ('AT', 'EUR'),
    ('PT', 'EUR'),
    ('IE', 'EUR'),
    ('FI', 'EUR'),
    ('GB', 'GBP'),
    ('JP', 'JPY'),
    ('AU', 'AUD'),
    ('CA', 'CAD')
ON CONFLICT (country_code) DO NOTHING;

-- Tax rates (country defaults — product_id is NULL)
INSERT INTO tax_rates (id, product_id, country_code, name, rate, is_active)
VALUES
    (gen_random_uuid(), NULL, 'IN', 'GST',       18.00, TRUE),
    (gen_random_uuid(), NULL, 'US', 'Sales Tax',  0.00, TRUE),
    (gen_random_uuid(), NULL, 'GB', 'VAT',       20.00, TRUE),
    (gen_random_uuid(), NULL, 'DE', 'VAT',       19.00, TRUE),
    (gen_random_uuid(), NULL, 'FR', 'VAT',       20.00, TRUE),
    (gen_random_uuid(), NULL, 'IT', 'VAT',       22.00, TRUE),
    (gen_random_uuid(), NULL, 'ES', 'VAT',       21.00, TRUE),
    (gen_random_uuid(), NULL, 'JP', 'CT',        10.00, TRUE),
    (gen_random_uuid(), NULL, 'AU', 'GST',       10.00, TRUE),
    (gen_random_uuid(), NULL, 'CA', 'GST',        5.00, TRUE);
