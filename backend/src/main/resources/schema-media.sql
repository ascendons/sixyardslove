-- MEDIA ASSETS (banners, carousels, hero images managed by admin)
-- type:      BANNER | CAROUSEL
-- placement: identifies where on the site this asset appears
--            e.g. HOME_HERO, HOME_PROMO, CATEGORY_HEADER, HOME_CAROUSEL

CREATE TABLE IF NOT EXISTS media_assets (
  id            UUID PRIMARY KEY,
  type          TEXT NOT NULL,                  -- 'BANNER' | 'CAROUSEL'
  placement     TEXT NOT NULL,                  -- e.g. 'HOME_HERO'
  image_url     TEXT NOT NULL,                  -- S3 public URL
  title         TEXT,
  subtitle      TEXT,
  link_url      TEXT,                           -- optional CTA link
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_assets_placement ON media_assets (placement) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_media_assets_updated ON media_assets;
CREATE TRIGGER trg_media_assets_updated
BEFORE UPDATE ON media_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
