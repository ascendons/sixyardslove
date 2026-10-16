-- Migration: add customer return-request fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested  BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ;
