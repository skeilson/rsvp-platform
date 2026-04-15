-- Seed data for rsvp-platform
-- Replace with your own guest list before deploying

-- Groups
INSERT INTO groups (id, label) VALUES
  ('11111111-1111-1111-1111-111111111111', 'The Smith Family'),
  ('22222222-2222-2222-2222-222222222222', 'Johnson & Williams'),
  ('33333333-3333-3333-3333-333333333333', 'Taylor, Alex');

-- Guests
INSERT INTO guests (id, first_name, last_name, email, group_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John',  'Smith',    'john.smith@example.com',  '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane',  'Smith',    'jane.smith@example.com',  '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Chris', 'Johnson',  'chris.j@example.com',     '22222222-2222-2222-2222-222222222222'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sam',   'Williams', 'sam.w@example.com',       '22222222-2222-2222-2222-222222222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Alex',  'Taylor',   'alex.taylor@example.com', '33333333-3333-3333-3333-333333333333');

-- Tags
INSERT INTO tags (id, name) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-111111111111', 'rehearsal-dinner'),
  ('aaaaaaaa-bbbb-cccc-dddd-222222222222', 'out-of-town'),
  ('aaaaaaaa-bbbb-cccc-dddd-333333333333', 'shuttle-eligible');
  ('aaaaaaaa-bbbb-cccc-dddd-444444444444', 'hotel-1-shuttle'),
  ('aaaaaaaa-bbbb-cccc-dddd-555555555555', 'hotel-2-shuttle')

-- Guest tags
INSERT INTO guest_tags (guest_id, tag_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-cccc-dddd-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-bbbb-cccc-dddd-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-cccc-dddd-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-bbbb-cccc-dddd-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-bbbb-cccc-dddd-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-bbbb-cccc-dddd-333333333333');

-- Events
INSERT INTO events (id, name, is_primary) VALUES
  ('bbbbbbbb-aaaa-cccc-dddd-111111111111', 'Main Reception',   TRUE),
  ('bbbbbbbb-aaaa-cccc-dddd-222222222222', 'Rehearsal Dinner', FALSE);
