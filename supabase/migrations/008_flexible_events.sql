-- Drop the existing event_responses table and recreate it
-- with a simpler structure that stores config event IDs directly
DROP TABLE IF EXISTS event_responses;

CREATE TABLE event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  answers JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id)
);

ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;
