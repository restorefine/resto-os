-- +goose Up
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  value         NUMERIC(10,2),
  stage         TEXT DEFAULT 'outreach',
  next_action   TEXT,
  notes         TEXT,
  assigned_to   UUID REFERENCES users(id),
  position      INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS leads;
