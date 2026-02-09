CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'prompt', 'update', 'link_linkedin', 'link_github',
    'link_website', 'feature_shipped', 'customer_added',
    'revenue_logged', 'listing_created', 'offer_received',
    'reward_earned', 'reward_redeemed', 'project_created'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select own events"
  ON activity_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert events"
  ON activity_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
  ON activity_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
