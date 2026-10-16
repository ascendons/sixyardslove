-- COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- FIXED, PERCENT, BOGO
    discount_value NUMERIC(10,2),
    buy_qty INTEGER,
    get_qty INTEGER,
    min_cart_value NUMERIC(10,2),
    max_discount NUMERIC(10,2),
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    usage_limit INTEGER,
    user_limit INTEGER DEFAULT 1,
    user_id UUID REFERENCES users(id),
    buy_sku TEXT,
    get_sku TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coupon_rules (
    id UUID PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL, -- PRODUCT, CATEGORY, SKU, ALL
    entity_id TEXT,          -- Product ID, Category ID, or SKU string
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORDER UPDATES (to be handled via migration or JPA)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0;
