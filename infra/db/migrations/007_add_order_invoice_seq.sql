-- Migration 007: Sequential invoice numbering for orders (e.g. Six Yards Love/I-000001)
-- The order's UUID `id` is untouched; invoice_seq is a separate, purely-sequential
-- number assigned at order creation and formatted at the application layer.

CREATE SEQUENCE IF NOT EXISTS orders_invoice_seq START WITH 1;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_seq BIGINT UNIQUE;
