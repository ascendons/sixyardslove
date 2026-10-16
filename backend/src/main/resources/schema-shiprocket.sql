-- Migration: Shiprocket integration
-- Run once against your PostgreSQL database

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS shiprocket_order_id   BIGINT,
    ADD COLUMN IF NOT EXISTS shiprocket_shipment_id BIGINT;

-- Per-product pickup location (overrides the global default in application.yml)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS shiprocket_pickup_location VARCHAR(100);
