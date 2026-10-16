-- Migration: Add shipping_fee to orders table
-- Run once against your PostgreSQL database

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;
