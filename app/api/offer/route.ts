import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { OPENAI_MODEL } from "@/lib/openai-config";

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
        { error: "Failed to generate offer: invalid request body" },
        { status: 400 }
      );
    }

    const { projectId } = body as { projectId?: string };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Failed to generate offer: projectId is required" },
        { status: 400 }
      );
    }

    // Load project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Failed to generate offer: project not found" }, { status: 404 });
    }

    // Load activity events
    const { data: events } = await supabase
      .from("activity_events")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    // Load message count
    const { count: messageCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    // Count traction signals
    const tractionEvents = (events || []).filter((e) =>
      ["feature_shipped", "customer_added", "revenue_logged"].includes(
        e.event_type
      )
    );

    // Count linked assets
    const linkEvents = (events || []).filter((e) =>
      ["link_linkedin", "link_github", "link_website"].includes(e.event_type)
    );

    // Expire old offers
    await supabase
      .from("offers")
      .update({ status: "expired" })
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("status", "active");

    let offerData;
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const projectSummary = {
        name: project.name,
        description: project.description,
        why_built: project.why_built,
        progress_score: project.progress_score,
        total_prompts: messageCount || 0,
        traction_signals: tractionEvents.map((e) => e.description),
        linked_assets: linkEvents.length,
        activity_count: (events || []).length,
        days_active: Math.ceil(
          (Date.now() - new Date(project.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };

      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a startup valuation engine. Based on the following project data and activity, provide a non-binding offer range and explanation. Be realistic and conservative. Early-stage projects with minimal traction should be valued low ($100-$1,000). Projects with real traction signals should be valued higher.

Return JSON only (no markdown, no code blocks):
{
  "offer_low": number,
  "offer_high": number,
  "reasoning": "string explaining the offer basis",
  "signals_used": ["list", "of", "key signals"]
}

If insufficient data, provide a minimal range and explain what data is needed.`,
          },
          {
            role: "user",
            content: JSON.stringify(projectSummary),
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        offerData = {
          offer_low: typeof parsed.offer_low === "number" && parsed.offer_low >= 0 ? parsed.offer_low : Math.max(project.progress_score * 10, 100),
          offer_high: typeof parsed.offer_high === "number" && parsed.offer_high >= 0 ? parsed.offer_high : Math.max(project.progress_score * 30, 500),
          reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "Estimate based on project activity.",
          signals_used: Array.isArray(parsed.signals_used) ? parsed.signals_used.filter((s: unknown) => typeof s === "string") : [],
        };
      } else {
        throw new Error("Failed to parse offer response");
      }
    } catch {
      offerData = {
        offer_low: Math.max(project.progress_score * 10, 100),
        offer_high: Math.max(project.progress_score * 30, 500),
        reasoning:
          "Automated estimate based on progress score. Add more traction signals for a more accurate valuation.",
        signals_used: [`Progress score: ${project.progress_score}/100`],
      };
    }

    // Insert offer
    const { data: offer } = await supabase
      .from("offers")
      .insert({
        project_id: projectId,
        user_id: user.id,
        offer_low: offerData.offer_low,
        offer_high: offerData.offer_high,
        reasoning: offerData.reasoning,
        signals: { signals_used: offerData.signals_used },
        status: "active",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    // Log activity event
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "offer_received",
      description: `Received offer: $${offerData.offer_low.toLocaleString()} – $${offerData.offer_high.toLocaleString()}`,
      metadata: offerData,
    });

    // Track analytics
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      project_id: projectId,
      event_name: "offer_requested",
      properties: { offerId: offer?.id },
    });

    return NextResponse.json({
      offer,
      reasoning: offerData.reasoning,
      signals: offerData.signals_used,
    });
  } catch (error) {
    console.error("Offer API error:", error);
    return NextResponse.json(
      { error: "Failed to generate offer" },
      { status: 500 }
    );
  }
}
