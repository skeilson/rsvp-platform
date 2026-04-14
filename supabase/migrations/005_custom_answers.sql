CREATE TABLE custom_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can insert custom_answers"
ON custom_answers FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "anon can read custom_answers"
ON custom_answers FOR SELECT
TO anon
USING (true);

ALTER TABLE custom_answers 
ADD CONSTRAINT custom_answers_guest_question_unique 
UNIQUE (guest_id, question_id);
