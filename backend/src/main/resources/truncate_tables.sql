-- Script to truncate all transactional and catalog data while preserving users and admins
-- Execute this script in your PostgreSQL database (e.g., ecom_dev)

TRUNCATE TABLE 
    refunds,
    payments,
    shipments,
    order_items,
    orders,
    cart_items,
    carts,
    inventory_movements,
    inventory,
    product_images,
    featured_products,
    feature_sections,
    product_variants,
    products,
    categories,
    user_addresses,
    audit_logs
CASCADE;

-- Optional: Reset sequences if any tables use SERIAL/IDENTITY
-- ALTER SEQUENCE <sequence_name> RESTART WITH 1;
