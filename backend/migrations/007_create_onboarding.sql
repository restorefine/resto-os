-- +goose Up
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  step         TEXT NOT NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, step)
);

-- +goose Down
DROP TABLE IF EXISTS onboarding_steps;
