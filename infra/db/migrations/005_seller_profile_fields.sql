-- Migration 005: Add producer/seller profile fields for dynamic producer pages

ALTER TABLE sellers
    ADD COLUMN IF NOT EXISTS tagline             VARCHAR(255),
    ADD COLUMN IF NOT EXISTS organization_type    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS incorporation_date   DATE,
    ADD COLUMN IF NOT EXISTS board_members_count  INTEGER,
    ADD COLUMN IF NOT EXISTS vision               TEXT,
    ADD COLUMN IF NOT EXISTS commitment           TEXT,
    ADD COLUMN IF NOT EXISTS closing_statement    VARCHAR(500);

CREATE TABLE IF NOT EXISTS seller_activities (
    seller_id     UUID NOT NULL REFERENCES sellers(id),
    activity_item TEXT NOT NULL,
    sort_order    INTEGER
);

CREATE TABLE IF NOT EXISTS seller_mission_points (
    seller_id     UUID NOT NULL REFERENCES sellers(id),
    mission_point TEXT NOT NULL,
    sort_order    INTEGER
);
