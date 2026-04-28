-- +goose Up
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_assigned_to_fkey,
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

-- +goose Down
ALTER TABLE clients
  ALTER COLUMN assigned_to TYPE UUID USING assigned_to::UUID,
  ADD CONSTRAINT clients_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);
