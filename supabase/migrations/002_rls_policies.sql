-- Enable RLS on all tables
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme ENABLE ROW LEVEL SECURITY;

-- Guests: allow public read for name lookup
CREATE POLICY "anon can read guests"
ON guests FOR SELECT
TO anon
USING (true);

-- Guests: allow public update for has_responded flag
CREATE POLICY "anon can update guests"
ON guests FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Groups: allow public read
CREATE POLICY "anon can read groups"
ON groups FOR SELECT
TO anon
USING (true);

-- Tags: allow public read
CREATE POLICY "anon can read tags"
ON tags FOR SELECT
TO anon
USING (true);

-- Guest tags: allow public read for eligibility check
CREATE POLICY "anon can read guest_tags"
ON guest_tags FOR SELECT
TO anon
USING (true);

-- Allow guests to be tagged during RSVP submission
-- Required for custom question tag-on-answer functionality
CREATE POLICY "anon can insert guest_tags"
ON guest_tags FOR INSERT
TO anon
WITH CHECK (true);

-- Allow existing tags to be removed during RSVP resubmission
-- Required when a guest changes their answer to a tagged custom question
CREATE POLICY "anon can delete guest_tags"
ON guest_tags FOR DELETE
TO anon
USING (true);

-- Events: allow public read
CREATE POLICY "anon can read events"
ON events FOR SELECT
TO anon
USING (true);

-- Responses: allow public insert
CREATE POLICY "anon can insert responses"
ON responses FOR INSERT
TO anon
WITH CHECK (true);

-- Allow guests to update their response on resubmission
CREATE POLICY "anon can update responses"
ON responses FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Event responses: allow public insert
CREATE POLICY "anon can insert event_responses"
ON event_responses FOR INSERT
TO anon
WITH CHECK (true);

-- Event responses: allow public update on resubmission
CREATE POLICY "anon can update event_responses"
ON event_responses FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Custom answers: allow public insert
CREATE POLICY "anon can insert custom_answers"
ON custom_answers FOR INSERT
TO anon
WITH CHECK (true);

-- Allow guests to update custom answers on resubmission
CREATE POLICY "anon can update custom_answers"
ON custom_answers FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow public read of custom answers
CREATE POLICY "anon can read custom_answers"
ON custom_answers FOR SELECT
TO anon
USING (true);

-- Theme: allow public read so guest-facing pages can load the theme
CREATE POLICY "anon can read theme"
ON theme FOR SELECT
TO anon
USING (true);

-- Allow public read access to rsvp-assets storage bucket
CREATE POLICY "public can read rsvp-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rsvp-assets');

-- Allow service role to upload to rsvp-assets bucket
CREATE POLICY "service role can upload to rsvp-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rsvp-assets');
