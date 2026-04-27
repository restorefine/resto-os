-- +goose Up
CREATE TABLE IF NOT EXISTS content_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT,
  due_date    TIMESTAMPTZ NOT NULL,
  status      TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS content_items;
