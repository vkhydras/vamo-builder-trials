import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const REWARD_AMOUNTS: Record<string, number> = {
  prompt: 1,
  feature: 1,
  customer: 1,
  revenue: 1,
};

const TRACTION_REWARDS: Record<string, number> = {
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

    const { projectId, message, tag } = await request.json();

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "projectId and message are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Insert user message
    const { data: userMessage } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: "user",
        content: message,
        tag: tag || null,
      })
      .select()
      .single();

    // Load last 20 messages for context
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content, tag")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Call OpenAI
    let aiResponse;
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const chatMessages = (recentMessages || []).reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Vamo, an AI co-pilot for startup founders. The user is building a project called "${project.name}".
${project.description ? `Project description: ${project.description}` : ""}
${project.why_built ? `Why they built it: ${project.why_built}` : ""}
Current progress score: ${project.progress_score}/100

Your job:
1. Respond helpfully to their update or question (keep it concise, 2-3 sentences max).
2. Extract the intent of their message. Classify as one of: feature, customer, revenue, ask, general.
3. If the update implies progress (shipped something, talked to users, made revenue), generate an updated business analysis.
4. Return your response as JSON only (no markdown, no code blocks):
{
  "reply": "Your response text",
  "intent": "feature|customer|revenue|ask|general",
  "business_update": {
    "progress_delta": 0-5,
    "traction_signal": "string or null",
    "valuation_adjustment": "up|down|none"
  }
}

If insufficient data to assess progress, set progress_delta to 0 and traction_signal to null.
Progress delta max is 5 per prompt. Be conservative with progress scores.`,
          },
          ...chatMessages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const raw = completion.choices[0]?.message?.content || "";
      // Try to parse JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        aiResponse = {
          reply: raw,
          intent: "general",
          business_update: {
            progress_delta: 0,
            traction_signal: null,
            valuation_adjustment: "none",
          },
        };
      }
    } catch {
      aiResponse = {
        reply:
          "I couldn't process that right now. Your update has been saved.",
        intent: "general",
        business_update: {
          progress_delta: 0,
          traction_signal: null,
          valuation_adjustment: "none",
        },
      };
    }

    // Determine pineapples for this prompt
    let pineapples = REWARD_AMOUNTS.prompt; // base: 1
    if (tag && tag !== "general" && REWARD_AMOUNTS[tag]) {
      pineapples += REWARD_AMOUNTS[tag]; // bonus for tagging
    }

    // Insert assistant message
    const { data: assistantMessage } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: "assistant",
        content: aiResponse.reply,
        extracted_intent: aiResponse.intent,
        tag: tag || aiResponse.intent || null,
        pineapples_earned: pineapples,
      })
      .select()
      .single();

    // Insert activity event for the prompt
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "prompt",
      description: message.substring(0, 200),
      metadata: { intent: aiResponse.intent },
    });

    // Insert traction signal event if applicable
    const tractionSignal = aiResponse.business_update?.traction_signal;
    if (tractionSignal) {
      const intent = aiResponse.intent;
      let eventType = "update";
      if (intent === "feature") eventType = "feature_shipped";
      else if (intent === "customer") eventType = "customer_added";
      else if (intent === "revenue") eventType = "revenue_logged";

      const { data: tractionEvent } = await supabase.from("activity_events").insert({
        project_id: projectId,
        user_id: user.id,
        event_type: eventType,
        description: tractionSignal,
      }).select("id").single();

      // Award traction-specific reward (feature_shipped: 3, customer_added: 5, revenue_logged: 10)
      if (tractionEvent && TRACTION_REWARDS[eventType]) {
        const tractionRewardAmount = TRACTION_REWARDS[eventType];
        const tractionIdempotencyKey = `${tractionEvent.id}-${eventType}-reward`;

        try {
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("pineapple_balance")
            .eq("id", user.id)
            .single();

          const currentBal = currentProfile?.pineapple_balance || 0;
          const newBal = currentBal + tractionRewardAmount;

          const { error: tractionLedgerError } = await supabase
            .from("reward_ledger")
            .insert({
              user_id: user.id,
              project_id: projectId,
              event_type: eventType,
              reward_amount: tractionRewardAmount,
              balance_after: newBal,
              idempotency_key: tractionIdempotencyKey,
            });

          if (!tractionLedgerError) {
            await supabase
              .from("profiles")
              .update({ pineapple_balance: newBal })
              .eq("id", user.id);

            pineapples += tractionRewardAmount;

            await supabase.from("activity_events").insert({
              project_id: projectId,
              user_id: user.id,
              event_type: "reward_earned",
              description: `Earned ${tractionRewardAmount} pineapple${tractionRewardAmount > 1 ? "s" : ""} for ${eventType.replace(/_/g, " ")}`,
              metadata: { amount: tractionRewardAmount },
            });
          }
        } catch {
          // Traction reward failure should not break chat
        }
      }
    }

    // Update progress score
    const progressDelta = Math.min(
      aiResponse.business_update?.progress_delta || 0,
      5
    );
    if (progressDelta > 0) {
      const newScore = Math.min(project.progress_score + progressDelta, 100);

      // Update valuation based on progress
      let valuationLow = project.valuation_low;
      let valuationHigh = project.valuation_high;
      if (aiResponse.business_update?.valuation_adjustment === "up") {
        valuationLow = Math.max(valuationLow, newScore * 50);
        valuationHigh = Math.max(valuationHigh, newScore * 150);
      }

      await supabase
        .from("projects")
        .update({
          progress_score: newScore,
          valuation_low: valuationLow,
          valuation_high: valuationHigh,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    // Award pineapples via reward engine
    try {
      const idempotencyKey = `${userMessage?.id}-prompt-reward`;

      // Check rate limit: max 60 rewarded prompts per project per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("reward_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .gte("created_at", oneHourAgo);

      if ((count || 0) < 60) {
        // Get current balance
        const { data: profile } = await supabase
          .from("profiles")
          .select("pineapple_balance")
          .eq("id", user.id)
          .single();

        const currentBalance = profile?.pineapple_balance || 0;
        const newBalance = currentBalance + pineapples;

        // Check idempotency
        const { error: ledgerError } = await supabase
          .from("reward_ledger")
          .insert({
            user_id: user.id,
            project_id: projectId,
            event_type: "prompt",
            reward_amount: pineapples,
            balance_after: newBalance,
            idempotency_key: idempotencyKey,
          });

        if (!ledgerError) {
          await supabase
            .from("profiles")
            .update({ pineapple_balance: newBalance })
            .eq("id", user.id);

          await supabase.from("activity_events").insert({
            project_id: projectId,
            user_id: user.id,
            event_type: "reward_earned",
            description: `Earned ${pineapples} pineapple${pineapples > 1 ? "s" : ""} for prompt`,
            metadata: { amount: pineapples },
          });
        }
      } else {
        pineapples = 0; // Rate limited
      }
    } catch {
      // Reward failure should not break chat
    }

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      project_id: projectId,
      event_name: "prompt_sent",
      properties: { messageId: userMessage?.id },
    });

    return NextResponse.json({
      message: assistantMessage,
      userMessage,
      pineapples,
      businessUpdate: aiResponse.business_update,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
