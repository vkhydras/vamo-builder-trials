import type { SupabaseClient } from "@supabase/supabase-js";

const REWARD_SCHEDULE: Record<string, number> = {
  prompt: 1,
  link_linkedin: 5,
  link_github: 5,
  link_website: 3,
  feature_shipped: 3,
  customer_added: 5,
  revenue_logged: 10,
};

const PROMPT_RATE_LIMIT_EVENTS = new Set(["prompt"]);

function formatEventLabel(eventType: string) {
  return eventType.replace(/_/g, " ");
}

export async function awardReward(
  supabase: SupabaseClient,
  {
    userId,
    projectId,
    eventType,
    idempotencyKey,
    rewardAmountOverride,
  }: {
    userId: string;
    projectId?: string | null;
    eventType: string;
    idempotencyKey: string;
    rewardAmountOverride?: number;
  }
) {
  // Check if already rewarded (idempotency)
  const { data: existing } = await supabase
    .from("reward_ledger")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existing) {
    return {
      rewarded: false,
      duplicate: true,
      amount: existing.reward_amount,
      newBalance: existing.balance_after,
    };
  }

  // Rate limit: max 60 rewarded prompts per project per hour
  if (projectId && PROMPT_RATE_LIMIT_EVENTS.has(eventType)) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("reward_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .eq("event_type", "prompt")
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= 60) {
      // Still get current balance to return accurate data
      const { data: profile } = await supabase
        .from("profiles")
        .select("pineapple_balance")
        .eq("id", userId)
        .single();

      return {
        rewarded: false,
        rateLimited: true,
        amount: 0,
        newBalance: profile?.pineapple_balance || 0,
      };
    }
  }

  const scheduledAmount = REWARD_SCHEDULE[eventType] || 0;
  const rewardAmount = rewardAmountOverride ?? scheduledAmount;
  if (rewardAmount === 0) {
    return {
      rewarded: false,
      amount: 0,
      newBalance: 0,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", userId)
    .single();

  const currentBalance = profile?.pineapple_balance || 0;
  const newBalance = currentBalance + rewardAmount;

  const { error: ledgerError } = await supabase
    .from("reward_ledger")
    .insert({
      user_id: userId,
      project_id: projectId || null,
      event_type: eventType,
      reward_amount: rewardAmount,
      balance_after: newBalance,
      idempotency_key: idempotencyKey,
    });

  if (ledgerError) {
    return {
      rewarded: false,
      duplicate: true,
      amount: 0,
      newBalance: currentBalance,
    };
  }

  await supabase
    .from("profiles")
    .update({ pineapple_balance: newBalance })
    .eq("id", userId);

  if (projectId) {
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: userId,
      event_type: "reward_earned",
      description: `Earned ${rewardAmount} pineapple${rewardAmount > 1 ? "s" : ""} for ${formatEventLabel(eventType)}`,
      metadata: { amount: rewardAmount, eventType },
    });
  }

  await supabase.from("analytics_events").insert({
    user_id: userId,
    project_id: projectId || null,
    event_name: "reward_earned",
    properties: { amount: rewardAmount, eventType },
  });

  return {
    rewarded: true,
    amount: rewardAmount,
    newBalance,
  };
}
