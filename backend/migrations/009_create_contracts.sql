-- +goose Up
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id),
  package         TEXT,
  start_date      DATE,
  duration_months INT,
  special_terms   TEXT,
  status          TEXT DEFAULT 'draft',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS contracts;
