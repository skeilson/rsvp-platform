CREATE TABLE theme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color TEXT NOT NULL DEFAULT '#111111',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  accent_color TEXT NOT NULL DEFAULT '#6366f1',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  hero_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default theme row
INSERT INTO theme (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Enable RLS
ALTER TABLE theme ENABLE ROW LEVEL SECURITY;

-- Allow public read so guest-facing pages can load the theme
CREATE POLICY "anon can read theme"
ON theme FOR SELECT
TO anon
USING (true);
