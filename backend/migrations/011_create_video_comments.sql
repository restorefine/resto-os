-- +goose Up
CREATE TABLE IF NOT EXISTS video_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID REFERENCES videos(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id),
  author_name TEXT NOT NULL,
  role        TEXT NOT NULL,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  timecode    TEXT,
  resolved    BOOLEAN DEFAULT FALSE,
  parent_id   UUID REFERENCES video_comments(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS video_comments;
