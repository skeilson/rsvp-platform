-- Groups (families, couples, or individuals treated as a unit)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests (individual invitees, linked to a group)
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  has_responded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (used to control eligibility for secondary events and email blasts)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest tags (many-to-many between guests and tags)
CREATE TABLE guest_tags (
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (guest_id, tag_id)
);

-- Events (primary and secondary events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses (one per guest, for the primary event)
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  attending BOOLEAN NOT NULL,
  dietary TEXT,
  song_request TEXT,
  note TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event responses (one per guest per secondary event)
CREATE TABLE event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  attending BOOLEAN NOT NULL,
  shuttle BOOLEAN DEFAULT FALSE,
  meal TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
