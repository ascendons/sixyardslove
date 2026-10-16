-- =============================================
-- Payments Enhancement - Schema Migration
-- =============================================

-- Add new columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_signature TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Index for fast lookups by provider payment ID (used in webhook verification)
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);

-- Index for order-payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Update trigger
DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
