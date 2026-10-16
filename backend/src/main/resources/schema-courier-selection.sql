-- Add preferred_courier_id to orders so the user's courier choice from checkout is honoured
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_courier_id BIGINT;
