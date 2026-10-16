-- =============================================
-- 011 - Shipping Fee Column
-- =============================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;