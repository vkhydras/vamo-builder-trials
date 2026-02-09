import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, rewardType = "uber_eats" } = await request.json();

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: "Minimum redemption is 50 pineapples" },
        { status: 400 }
      );
    }

    // Use atomic RPC for balance integrity
    const { data: result, error: rpcError } = await supabase.rpc(
      "process_redemption",
      {
        p_user_id: user.id,
        p_amount: amount,
        p_reward_type: rewardType,
      }
    );

    if (rpcError) {
      console.error("Redemption RPC error:", rpcError);
      // Fallback to manual approach if RPC not available
      return await fallbackRedeem(supabase, user.id, amount, rewardType);
    }

    const rpcResult = result as { success: boolean; error?: string; redemption_id?: string; new_balance?: number };

    if (!rpcResult.success) {
      return NextResponse.json(
        { error: rpcResult.error || "Redemption failed" },
        { status: 400 }
      );
    }

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "reward_redeemed",
      properties: { amount, rewardType },
    });

    return NextResponse.json({
      success: true,
      redemption: { id: rpcResult.redemption_id },
      newBalance: rpcResult.new_balance,
    });
  } catch (error) {
    console.error("Redeem API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fallback if RPC is not available (e.g., migration not yet run)
async function fallbackRedeem(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
  rewardType: string
) {
  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", userId)
    .single();

  if (!profile || profile.pineapple_balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  const newBalance = profile.pineapple_balance - amount;

  // Deduct balance
  await supabase
    .from("profiles")
    .update({ pineapple_balance: newBalance })
    .eq("id", userId);

  // Create redemption record
  const { data: redemption } = await supabase
    .from("redemptions")
    .insert({
      user_id: userId,
      amount,
      reward_type: rewardType,
      status: "pending",
    })
    .select()
    .single();

  // Insert negative ledger entry
  await supabase.from("reward_ledger").insert({
    user_id: userId,
    event_type: "redemption",
    reward_amount: -amount,
    balance_after: newBalance,
    idempotency_key: `redemption-${redemption?.id}`,
  });

  // Track analytics
  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: "reward_redeemed",
    properties: { amount, rewardType },
  });

  return NextResponse.json({
    success: true,
    redemption,
    newBalance,
  });
}
