-- =============================================
-- 003 - Coupon Rules Fix (migration)
-- Drops check constraint and changes entity_id to TEXT
-- =============================================

ALTER TABLE coupon_rules DROP CONSTRAINT IF EXISTS coupon_rules_rule_type_check;

ALTER TABLE coupon_rules
    ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT;