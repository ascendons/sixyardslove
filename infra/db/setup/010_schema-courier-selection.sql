-- =============================================
-- 010 - Preferred Courier on Orders
-- =============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_courier_id BIGINT;