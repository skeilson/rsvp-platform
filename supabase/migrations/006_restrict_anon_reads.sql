-- Revoke the anon SELECT policy on custom_answers.
-- The admin dashboard now reads custom_answers via a server-side route
-- using the service role key, so anon no longer needs this read access.
-- The previous policy let anyone with the public anon key read every
-- guest's custom question answers (e.g. dietary restrictions).
DROP POLICY IF EXISTS "anon can read custom_answers" ON custom_answers;
