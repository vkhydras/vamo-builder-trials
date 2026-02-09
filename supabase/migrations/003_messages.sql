CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  extracted_intent TEXT,
  tag TEXT CHECK (tag IN ('feature', 'customer', 'revenue', 'ask', 'general', NULL)),
  pineapples_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
