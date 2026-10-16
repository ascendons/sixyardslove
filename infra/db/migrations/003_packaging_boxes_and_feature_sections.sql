-- Migration 003: Create packaging_boxes table and add image_url to feature_sections

-- packaging_boxes: new table for shipment box management
CREATE TABLE IF NOT EXISTS packaging_boxes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    length_cm     DOUBLE PRECISION NOT NULL,
    breadth_cm    DOUBLE PRECISION NOT NULL,
    height_cm     DOUBLE PRECISION NOT NULL,
    max_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- feature_sections: add image_url for section banner images
ALTER TABLE feature_sections ADD COLUMN IF NOT EXISTS image_url TEXT;
