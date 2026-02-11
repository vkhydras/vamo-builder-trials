import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardReward } from "@/lib/rewards";

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

    const result = await awardReward(supabase, {
      userId: user.id,
      projectId,
      eventType,
      idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rewards API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
