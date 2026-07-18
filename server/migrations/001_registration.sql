CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) NOT NULL,
  normalized_username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(320) NOT NULL,
  normalized_email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  preferred_language VARCHAR(2) NOT NULL CHECK (preferred_language IN ('uk', 'en')),
  status VARCHAR(40) NOT NULL CHECK (status IN ('pending_email_verification', 'verified_waiting_launch')),
  terms_version VARCHAR(32) NOT NULL,
  registration_ip INET,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verification_code_hash CHAR(64),
  verification_session_hash CHAR(64),
  code_expires_at TIMESTAMPTZ,
  code_sent_at TIMESTAMPTZ,
  verification_attempts SMALLINT NOT NULL DEFAULT 0,
  resend_count SMALLINT NOT NULL DEFAULT 0,
  resend_window_started_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS accounts_pending_session_idx ON accounts (verification_session_hash) WHERE status = 'pending_email_verification';
