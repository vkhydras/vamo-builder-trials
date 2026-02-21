import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardReward } from "@/lib/rewards";
import OpenAI from "openai";
import { OPENAI_MODEL } from "@/lib/openai-config";

const TAGGABLE = ["feature", "customer", "revenue"];

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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Failed to process chat: invalid request body" },
        { status: 400 }
      );
    }

    const { projectId, message, tag, messageId } = body as {
      projectId?: string;
      message?: string;
      tag?: string;
      messageId?: string;
    };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Failed to process chat: projectId is required" },
        { status: 400 }
      );
    }

    if (!message && !messageId) {
      return NextResponse.json(
        { error: "Failed to process chat: message or messageId is required" },
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
    let userMessage: { id: string; content: string; tag: string | null } | null = null;
    if (messageId) {
      const { data: existingMessage } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

      if (!existingMessage) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      userMessage = existingMessage;
    } else {
      const { data: insertedMessage } = await supabase
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

      userMessage = insertedMessage;
    }

    const messageText = userMessage?.content || message || "";
    const messageTag = tag ?? userMessage?.tag ?? null;

    // Load last 20 messages for context
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content, tag")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Call OpenAI with fallback message
    let aiResponse;
    let aiFailed = false;
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
      }
      const openai = new OpenAI({ apiKey });

      const chatMessages = (recentMessages || []).reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
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
   - "feature": User shipped, built, launched, deployed, or completed a feature/product/page/tool. Keywords: shipped, built, added, launched, deployed, implemented, created, designed, finished.
   - "customer": User got customers, users, signups, interviews, waitlist members, or any form of user acquisition. Keywords: customer, user, signup, interview, waitlist, subscriber, follower, download, install.
   - "revenue": User made money, got paid, received payment, made sales, earned income. Keywords: $, revenue, payment, sales, sold, income, profit, earned, money, order, purchase, paid.
   - "ask": User is asking a question or seeking advice.
   - "general": ONLY use this if the message does not fit any of the above categories.
3. If the update implies REAL progress (shipped something, talked to users, made revenue), set traction_signal to a brief description.
   - For feature: "Shipped [feature name]"
   - For customer: "[X] users/signups/interviews" or "First customer"
   - For revenue: "$[amount] revenue" or "First paying customer"
4. You MUST return valid JSON with this exact structure:
{
  "reply": "Your response text",
  "intent": "feature|customer|revenue|ask|general",
  "business_update": {
    "progress_delta": 0,
    "traction_signal": null,
    "valuation_adjustment": "none"
  }
}

CRITICAL CLASSIFICATION RULES:
- If the user mentions money, revenue, sales, payment, dollar amounts, or orders: intent MUST be "revenue".
- If the user mentions shipping, building, adding, or deploying a feature: intent MUST be "feature".
- If the user mentions getting customers, users, signups, or interviews: intent MUST be "customer".
- Do NOT classify progress updates as "general". Only use "general" for greetings, off-topic chat, or meta-questions.
- If insufficient data to assess progress, set progress_delta to 0 and traction_signal to null.
- Progress delta max is 5 per prompt. Be conservative with progress scores.`,
          },
          ...chatMessages,
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 500,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiResponse = {
          reply: typeof parsed.reply === "string" ? parsed.reply : raw,
          intent: ["feature", "customer", "revenue", "ask", "general"].includes(parsed.intent) ? parsed.intent : "general",
          business_update: {
            progress_delta: Math.min(Math.max(Number(parsed.business_update?.progress_delta) || 0, 0), 5),
            traction_signal: typeof parsed.business_update?.traction_signal === "string" ? parsed.business_update.traction_signal : null,
            valuation_adjustment: ["up", "down", "none"].includes(parsed.business_update?.valuation_adjustment) ? parsed.business_update.valuation_adjustment : "none",
          },
        };
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
    } catch (error) {
      console.error("OpenAI error:", error);
      aiFailed = true;
      aiResponse = {
        reply: "I couldn't process that right now. Your update has been saved.",
        intent: "general",
        business_update: {
          progress_delta: 0,
          traction_signal: null,
          valuation_adjustment: "none",
        },
      };
    }

    // Use AI-detected intent for tag bonus if user didn't manually select one
    const effectiveTag = messageTag || (TAGGABLE.includes(aiResponse.intent) ? aiResponse.intent : null);

    // Update user message with AI-detected tag if not already set
    if (!messageTag && effectiveTag && userMessage?.id) {
      await supabase
        .from("messages")
        .update({ tag: effectiveTag })
        .eq("id", userMessage.id);
    }

    let pineapples = 0;

    // Award prompt pineapples via reward engine
    try {
      const promptRewardAmount = 1 +
        (effectiveTag && TAGGABLE.includes(effectiveTag) ? 1 : 0);
      const promptResult = await awardReward(supabase, {
        userId: user.id,
        projectId,
        eventType: "prompt",
        idempotencyKey: `${userMessage?.id}-prompt`,
        rewardAmountOverride: promptRewardAmount,
      });

      if (promptResult.rewarded) {
        pineapples += promptResult.amount;
      }
    } catch {
      // Reward failure should not break chat
    }

    // Insert activity event for the prompt
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "prompt",
      description: (messageText || "").substring(0, 200),
      metadata: { intent: aiResponse.intent },
    });

    if (!aiFailed) {
      // Update progress score
      const progressDelta = Math.min(
        aiResponse.business_update?.progress_delta || 0,
        5
      );
      if (progressDelta > 0) {
        const newScore = Math.min(project.progress_score + progressDelta, 100);

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

      // Award traction reward if applicable
      const tractionSignal = aiResponse.business_update?.traction_signal;
      if (tractionSignal) {
        const intent = aiResponse.intent;
        let eventType = "update";
        if (intent === "feature") eventType = "feature_shipped";
        else if (intent === "customer") eventType = "customer_added";
        else if (intent === "revenue") eventType = "revenue_logged";
        else if (intent === "general") {
          // Fallback: infer event type from traction signal or message text
          const combined = `${tractionSignal} ${messageText}`.toLowerCase();
          if (/\$|revenue|sales|paid|payment|income|money|order/.test(combined)) eventType = "revenue_logged";
          else if (/customer|user|signup|interview|waitlist|subscriber/.test(combined)) eventType = "customer_added";
          else if (/shipped|built|launched|deployed|feature|added|created/.test(combined)) eventType = "feature_shipped";
        }

        const { data: tractionEvent } = await supabase
          .from("activity_events")
          .insert({
            project_id: projectId,
            user_id: user.id,
            event_type: eventType,
            description: tractionSignal,
          })
          .select("id")
          .single();

        if (tractionEvent && TRACTION_REWARDS[eventType]) {
          try {
            const tractionResult = await awardReward(supabase, {
              userId: user.id,
              projectId,
              eventType,
              idempotencyKey: `${tractionEvent.id}-${eventType}`,
            });

            if (tractionResult.rewarded) {
              pineapples += tractionResult.amount;
            }
          } catch {
            // Reward failure should not break chat
          }
        }
      }
    }

    // Insert assistant message (after rewards computed)
    const { data: assistantMessage } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: "assistant",
        content: aiResponse.reply,
        extracted_intent: aiResponse.intent,
        tag: messageTag || aiResponse.intent || null,
        pineapples_earned: pineapples,
      })
      .select()
      .single();

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      project_id: projectId,
      event_name: "prompt_sent",
      properties: { messageId: userMessage?.id },
    });

    // Return updated user message with effective tag
    const updatedUserMessage = userMessage ? { ...userMessage, tag: effectiveTag } : userMessage;

    return NextResponse.json({
      message: assistantMessage,
      userMessage: updatedUserMessage,
      pineapples,
      businessUpdate: aiResponse.business_update,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
