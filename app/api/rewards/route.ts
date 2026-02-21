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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Failed to process reward: invalid request body" },
        { status: 400 }
      );
    }

    const { projectId, eventType, idempotencyKey } = body as {
      projectId?: string;
      eventType?: string;
      idempotencyKey?: string;
    };

    if (!eventType || typeof eventType !== "string" || !idempotencyKey || typeof idempotencyKey !== "string") {
      return NextResponse.json(
        { error: "Failed to process reward: eventType and idempotencyKey are required" },
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
      { error: "Failed to process reward" },
      { status: 500 }
    );
  }
}
