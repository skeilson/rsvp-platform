-- Lock the public anon role out of every guest-data table.
--
-- The RSVP flow now runs entirely through server routes in /api/rsvp/*
-- (lookup, guest, group, submit), authenticated by a signed guest_session
-- cookie and backed by the service role key. The browser never holds a
-- privileged DB credential any more.
--
-- Before this migration, the anon key — which ships in every page bundle
-- via NEXT_PUBLIC_SUPABASE_ANON_KEY — could:
--   * SELECT * FROM guests      (enumerate every guest's name + email)
--   * UPDATE guests              (overwrite has_responded / email on any row)
--   * INSERT/UPDATE responses    (spoof or overwrite any RSVP)
--   * INSERT/UPDATE event_responses, custom_answers
--   * SELECT / INSERT / DELETE guest_tags
-- All of those are closed here.
--
-- Policies are dropped by both name-spellings that have accumulated across
-- 001/002/02 migrations, to guarantee a clean cut regardless of which
-- policies a given environment actually has.

-- Guests: no anon access.
DROP POLICY IF EXISTS "anon can read guests" ON guests;
DROP POLICY IF EXISTS "anon can update guests" ON guests;
DROP POLICY IF EXISTS "Allow public read on guests" ON guests;
DROP POLICY IF EXISTS "Allow public update on guests" ON guests;

-- Groups: no anon access.
DROP POLICY IF EXISTS "anon can read groups" ON groups;

-- Responses: no anon writes (no anon read policy ever existed).
DROP POLICY IF EXISTS "anon can insert responses" ON responses;
DROP POLICY IF EXISTS "anon can update responses" ON responses;
DROP POLICY IF EXISTS "Allow public insert on responses" ON responses;

-- Event responses: no anon writes.
DROP POLICY IF EXISTS "anon can insert event_responses" ON event_responses;
DROP POLICY IF EXISTS "anon can update event_responses" ON event_responses;
DROP POLICY IF EXISTS "Allow public insert on event_responses" ON event_responses;

-- Custom answers: no anon writes. (Read already dropped in 006.)
DROP POLICY IF EXISTS "anon can insert custom_answers" ON custom_answers;
DROP POLICY IF EXISTS "anon can update custom_answers" ON custom_answers;

-- Guest tags: no anon access.
DROP POLICY IF EXISTS "anon can read guest_tags" ON guest_tags;
DROP POLICY IF EXISTS "anon can insert guest_tags" ON guest_tags;
DROP POLICY IF EXISTS "anon can delete guest_tags" ON guest_tags;
DROP POLICY IF EXISTS "Allow public read on guest_tags" ON guest_tags;

-- Tags: no anon access.
DROP POLICY IF EXISTS "anon can read tags" ON tags;
DROP POLICY IF EXISTS "Allow public read on tags" ON tags;

-- Events: no anon access.
DROP POLICY IF EXISTS "anon can read events" ON events;
DROP POLICY IF EXISTS "Allow public read on events" ON events;

-- Theme stays readable by anon: the SSR root layout uses the anon key to
-- render brand colors/fonts, and theme is intentionally public.
