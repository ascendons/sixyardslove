-- Phase 1: GST & Address Localization

-- Create States Table
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY,
    country_code TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update user_addresses Table
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS alternate_phone TEXT;

-- Update tax_rates Table
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS state_code TEXT;

-- Update orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10, 2);

-- Update order_items Table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10, 2);

-- Seed Initial Indian States
INSERT INTO states (id, country_code, name, code) VALUES
(gen_random_uuid(), 'IN', 'Maharashtra', 'MH'),
(gen_random_uuid(), 'IN', 'Karnataka', 'KA'),
(gen_random_uuid(), 'IN', 'Tamil Nadu', 'TN'),
(gen_random_uuid(), 'IN', 'Delhi', 'DL'),
(gen_random_uuid(), 'IN', 'Uttar Pradesh', 'UP'),
(gen_random_uuid(), 'IN', 'Gujarat', 'GJ'),
(gen_random_uuid(), 'IN', 'West Bengal', 'WB'),
(gen_random_uuid(), 'IN', 'Telangana', 'TG'),
(gen_random_uuid(), 'IN', 'Rajasthan', 'RJ'),
(gen_random_uuid(), 'IN', 'Madhya Pradesh', 'MP')
ON CONFLICT DO NOTHING;
