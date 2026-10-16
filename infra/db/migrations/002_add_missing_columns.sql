-- Migration 002: Add missing columns for wishlist soft-delete, order expiry/convenience, and optimistic locking

-- wishlist_items: soft-delete support
ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- orders: new fields added in recent backend versions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_restored BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- product_variants: optimistic locking
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
