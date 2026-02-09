-- Migration 011: Atomic redemption RPC function
-- Ensures balance deduction and ledger entry happen atomically

CREATE OR REPLACE FUNCTION public.process_redemption(
  p_user_id UUID,
  p_amount INTEGER,
  p_reward_type TEXT DEFAULT 'uber_eats'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_redemption_id UUID;
BEGIN
  -- Lock the profile row to prevent concurrent modifications
  SELECT pineapple_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  IF p_amount < 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum redemption is 50 pineapples');
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Deduct balance
  UPDATE profiles
  SET pineapple_balance = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  -- Create redemption record
  INSERT INTO redemptions (user_id, amount, reward_type, status)
  VALUES (p_user_id, p_amount, p_reward_type, 'pending')
  RETURNING id INTO v_redemption_id;

  -- Insert negative ledger entry
  INSERT INTO reward_ledger (user_id, event_type, reward_amount, balance_after, idempotency_key)
  VALUES (p_user_id, 'redemption', -p_amount, v_new_balance, 'redemption-' || v_redemption_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
