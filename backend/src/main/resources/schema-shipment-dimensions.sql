-- Migration: Add shipment dimensions and weight tracking
-- Run once against your PostgreSQL database

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS length_cm DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS breadth_cm DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS height_cm DOUBLE PRECISION;
