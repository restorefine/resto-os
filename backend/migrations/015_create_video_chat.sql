-- +goose Up
CREATE TABLE IF NOT EXISTS video_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  message    TEXT NOT NULL CHECK (char_length(message) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vchat_video_created ON video_chat_messages(video_id, created_at);

-- +goose Down
DROP TABLE IF EXISTS video_chat_messages;
