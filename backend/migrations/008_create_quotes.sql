-- +goose Up
CREATE TABLE IF NOT EXISTS quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id),
  reference   TEXT UNIQUE NOT NULL,
  items       JSONB NOT NULL,
  subtotal    NUMERIC(10,2),
  vat         NUMERIC(10,2),
  total       NUMERIC(10,2),
  valid_until DATE,
  status      TEXT DEFAULT 'draft',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS quotes;
