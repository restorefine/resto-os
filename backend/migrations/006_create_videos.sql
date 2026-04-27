-- +goose Up
CREATE TABLE IF NOT EXISTS videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  platform         TEXT,
  video_url        TEXT NOT NULL,
  thumbnail_url    TEXT,
  status           TEXT DEFAULT 'pending',
  production_stage TEXT DEFAULT 'scripting',
  feedback         TEXT,
  version          INT DEFAULT 1,
  uploaded_by      UUID REFERENCES users(id),
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  due_date         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS videos;
