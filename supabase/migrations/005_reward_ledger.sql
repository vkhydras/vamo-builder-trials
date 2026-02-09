CREATE TABLE reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own ledger"
  ON reward_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own ledger"
  ON reward_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ledger"
  ON reward_ledger FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
