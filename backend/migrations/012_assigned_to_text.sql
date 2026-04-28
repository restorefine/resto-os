-- +goose Up
-- Store team member names directly as TEXT instead of UUID FK.
-- The frontend uses names ("Rohit", "Rohin", etc.) — UUID lookup is not needed
-- for a small fixed team.

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey,
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

ALTER TABLE content_items
  DROP CONSTRAINT IF EXISTS content_items_assigned_to_fkey,
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_assigned_to_fkey,
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

-- +goose Down
ALTER TABLE leads
  ALTER COLUMN assigned_to TYPE UUID USING assigned_to::UUID,
  ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);

ALTER TABLE content_items
  ALTER COLUMN assigned_to TYPE UUID USING assigned_to::UUID,
  ADD CONSTRAINT content_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);

ALTER TABLE clients
  ALTER COLUMN assigned_to TYPE UUID USING assigned_to::UUID,
  ADD CONSTRAINT clients_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id);
