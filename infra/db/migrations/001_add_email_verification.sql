-- Migration: Add email verification support
-- Run this on your production database before deploying the email verification feature.

-- 1. Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark existing users as verified so they are not locked out
--    (only needed if you already have users in production)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- 3. Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          UUID        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
