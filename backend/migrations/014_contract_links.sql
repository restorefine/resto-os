-- +goose Up
CREATE TABLE contract_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT UNIQUE NOT NULL,
  contract_data    TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_company   TEXT NOT NULL,
  client_signature TEXT,
  signed_at        TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_links_token ON contract_links(token);

-- +goose Down
DROP INDEX IF EXISTS idx_contract_links_token;
DROP TABLE IF EXISTS contract_links;
