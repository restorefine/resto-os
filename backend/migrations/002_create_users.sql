-- +goose Up
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'staff',
  client_id            UUID REFERENCES clients(id),
  must_change_password BOOLEAN DEFAULT FALSE,
  portal_activated_at  TIMESTAMPTZ,
  last_login_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients
  ADD CONSTRAINT clients_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_assigned_to_fkey;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
