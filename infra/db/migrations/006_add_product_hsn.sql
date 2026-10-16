-- Migration 006: Add HSN (Harmonized System of Nomenclature) code to products

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS hsn VARCHAR(20);
