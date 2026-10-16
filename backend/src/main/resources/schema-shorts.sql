CREATE TABLE IF NOT EXISTS shorts (
  id            UUID PRIMARY KEY,
  file_url      TEXT NOT NULL,
  caption       TEXT,
  social_url    TEXT,
  metadata      JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shorts_active ON shorts (display_order) WHERE deleted_at IS NULL AND is_active = TRUE;

DROP TRIGGER IF EXISTS trg_shorts_updated ON shorts;
CREATE TRIGGER trg_shorts_updated
BEFORE UPDATE ON shorts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
