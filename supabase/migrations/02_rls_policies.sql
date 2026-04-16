-- Allow public read access to guests (for name lookup)
CREATE POLICY "Allow public read on guests"
ON guests FOR SELECT
USING (true);

-- Allow public insert on responses
CREATE POLICY "Allow public insert on responses"
ON responses FOR INSERT
WITH CHECK (true);

-- Allow public insert on event_responses
CREATE POLICY "Allow public insert on event_responses"
ON event_responses FOR INSERT
WITH CHECK (true);

-- Allow public read on tags and guest_tags (for eligibility check)
CREATE POLICY "Allow public read on tags"
ON tags FOR SELECT
USING (true);

CREATE POLICY "Allow public read on guest_tags"
ON guest_tags FOR SELECT
USING (true);

-- Allow public read on events
CREATE POLICY "Allow public read on events"
ON events FOR SELECT
USING (true);

-- Allow public update on guests (for has_responded flag)
CREATE POLICY "Allow public update on guests"
ON guests FOR UPDATE
USING (true);

-- Allow guests to be tagged during RSVP submission
CREATE POLICY "anon can insert guest_tags"
ON guest_tags FOR INSERT
TO anon
WITH CHECK (true);

-- Allow existing tags to be removed during RSVP resubmission
CREATE POLICY "anon can delete guest_tags"
ON guest_tags FOR DELETE
TO anon
USING (true);
