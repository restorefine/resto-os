-- +goose Up
CREATE TABLE IF NOT EXISTS invoices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID REFERENCES clients(id) ON DELETE CASCADE,
  reference  TEXT UNIQUE NOT NULL,
  amount     NUMERIC(10,2) NOT NULL,
  due_date   DATE NOT NULL,
  paid_at    TIMESTAMPTZ,
  status     TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS invoices;
