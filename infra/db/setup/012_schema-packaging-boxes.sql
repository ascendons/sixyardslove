-- =============================================
-- 012 - Packaging Boxes for Shiprocket
-- =============================================

CREATE TABLE IF NOT EXISTS packaging_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    length_cm DOUBLE PRECISION NOT NULL,
    breadth_cm DOUBLE PRECISION NOT NULL,
    height_cm DOUBLE PRECISION NOT NULL,
    max_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add weight_kg to product_variants for per-variant weight
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION;

-- Add weight_kg to order_items to store the weight used at time of order
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION;