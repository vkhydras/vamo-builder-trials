CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  asking_price_low INTEGER,
  asking_price_high INTEGER,
  timeline_snapshot JSONB,
  screenshots JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select own listings"
  ON listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert listings"
  ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own listings"
  ON listings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT USING (status = 'active');
