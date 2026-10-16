-- Order Box Assignments for bin-packing at checkout
CREATE TABLE IF NOT EXISTS order_box_assignments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    box_id UUID,
    box_name VARCHAR(100) NOT NULL,
    box_length_cm DOUBLE PRECISION NOT NULL,
    box_breadth_cm DOUBLE PRECISION NOT NULL,
    box_height_cm DOUBLE PRECISION NOT NULL,
    box_weight_kg DOUBLE PRECISION,
    total_items_weight_kg DOUBLE PRECISION,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_box_assignments_order_id ON order_box_assignments(order_id);

-- Packed items within each box
CREATE TABLE IF NOT EXISTS order_box_packed_items (
    order_box_assignment_id UUID NOT NULL REFERENCES order_box_assignments(id),
    variant_id VARCHAR(36),
    sku TEXT,
    product_name TEXT,
    quantity INTEGER,
    item_length_mm DOUBLE PRECISION,
    item_breadth_mm DOUBLE PRECISION,
    item_height_mm DOUBLE PRECISION,
    item_weight_kg DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_order_box_packed_items_assignment_id ON order_box_packed_items(order_box_assignment_id);

-- Add length_mm, breadth_mm, height_mm, units_per_box to product_variants if not exists
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS length_mm DOUBLE PRECISION;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS breadth_mm DOUBLE PRECISION;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS height_mm DOUBLE PRECISION;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS units_per_box INTEGER;