-- +goose Up
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  package             TEXT NOT NULL,
  monthly_value       NUMERIC(10,2),
  monthly_progress    INT DEFAULT 0,
  status              TEXT DEFAULT 'active',
  invoice_day         INT,
  assigned_to         UUID,
  portal_activated_at TIMESTAMPTZ,
  started_at          DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS clients;
