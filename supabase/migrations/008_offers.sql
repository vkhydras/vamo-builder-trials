CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_low INTEGER NOT NULL,
  offer_high INTEGER NOT NULL,
  reasoning TEXT,
  signals JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own offers"
  ON offers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert offers"
  ON offers FOR INSERT WITH CHECK (auth.uid() = user_id);
