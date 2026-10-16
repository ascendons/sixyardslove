-- Migration: fix coupon_rules table
-- 1. Drop the check constraint that excluded SKU as a valid rule_type
-- 2. Change entity_id from UUID to TEXT so SKU strings (e.g. BL-REL-AGB-20) can be stored

ALTER TABLE coupon_rules DROP CONSTRAINT IF EXISTS coupon_rules_rule_type_check;

ALTER TABLE coupon_rules
    ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT;
