-- Migration 004: Create order_box_assignments and order_box_packed_items tables

CREATE TABLE IF NOT EXISTS order_box_assignments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID NOT NULL REFERENCES orders(id),
    box_id                UUID,
    box_name              TEXT NOT NULL,
    box_length_cm         DOUBLE PRECISION NOT NULL,
    box_breadth_cm        DOUBLE PRECISION NOT NULL,
    box_height_cm         DOUBLE PRECISION NOT NULL,
    box_weight_kg         DOUBLE PRECISION,
    total_items_weight_kg DOUBLE PRECISION,
    sequence              INTEGER,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_box_packed_items (
    order_box_assignment_id UUID NOT NULL REFERENCES order_box_assignments(id),
    variant_id              TEXT,
    sku                     TEXT,
    product_name            TEXT,
    quantity                INTEGER,
    item_length_mm          DOUBLE PRECISION,
    item_breadth_mm         DOUBLE PRECISION,
    item_height_mm          DOUBLE PRECISION,
    item_weight_kg          DOUBLE PRECISION
);
