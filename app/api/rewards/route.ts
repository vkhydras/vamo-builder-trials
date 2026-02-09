import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REWARD_SCHEDULE: Record<string, number> = {
  prompt: 1,
  link_linkedin: 5,
  link_github: 5,
  link_website: 3,
  feature_shipped: 3,
  customer_added: 5,
  revenue_logged: 10,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, eventType, idempotencyKey } = await request.json();

    if (!eventType || !idempotencyKey) {
      return NextResponse.json(
        { error: "eventType and idempotencyKey are required" },
        { status: 400 }
      );
    }

    // Check if already rewarded (idempotency)
    const { data: existing } = await supabase
      .from("reward_ledger")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existing) {
      return NextResponse.json({
        rewarded: false,
        duplicate: true,
        amount: existing.reward_amount,
        newBalance: existing.balance_after,
      });
    }

    // Rate limit check: max 60 per project per hour
    if (projectId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("reward_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .gte("created_at", oneHourAgo);

      if ((count || 0) >= 60) {
        return NextResponse.json({
          rewarded: false,
          rateLimited: true,
          amount: 0,
          newBalance: 0,
        });
      }
    }

    const rewardAmount = REWARD_SCHEDULE[eventType] || 0;
    if (rewardAmount === 0) {
      return NextResponse.json({
        rewarded: false,
        amount: 0,
        newBalance: 0,
      });
    }

    // Get current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("pineapple_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = profile?.pineapple_balance || 0;
    const newBalance = currentBalance + rewardAmount;

    // Insert ledger entry
    const { error: ledgerError } = await supabase
      .from("reward_ledger")
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        event_type: eventType,
        reward_amount: rewardAmount,
        balance_after: newBalance,
        idempotency_key: idempotencyKey,
      });

    if (ledgerError) {
      // Likely duplicate key
      return NextResponse.json({
        rewarded: false,
        duplicate: true,
        amount: 0,
        newBalance: currentBalance,
      });
    }

    // Update balance
    await supabase
      .from("profiles")
      .update({ pineapple_balance: newBalance })
      .eq("id", user.id);

    // Log activity event
    if (projectId) {
      await supabase.from("activity_events").insert({
        project_id: projectId,
        user_id: user.id,
        event_type: "reward_earned",
        description: `Earned ${rewardAmount} pineapple${rewardAmount > 1 ? "s" : ""} for ${eventType}`,
        metadata: { amount: rewardAmount, eventType },
      });
    }

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      project_id: projectId || null,
      event_name: "reward_earned",
      properties: { amount: rewardAmount, eventType },
    });

    return NextResponse.json({
      rewarded: true,
      amount: rewardAmount,
      newBalance,
    });
  } catch (error) {
    console.error("Rewards API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
