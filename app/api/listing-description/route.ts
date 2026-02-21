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
        { error: "Failed to generate description: invalid request body" },
        { status: 400 }
      );
    }

    const { projectId } = body as { projectId?: string };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Failed to generate description: projectId is required" },
        { status: 400 }
      );
    }

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Failed to generate description: project not found" }, { status: 404 });
    }

    const { data: events } = await supabase
      .from("activity_events")
      .select("event_type, description")
      .eq("project_id", projectId)
      .in("event_type", [
        "feature_shipped",
        "customer_added",
        "revenue_logged",
      ])
      .order("created_at", { ascending: false })
      .limit(20);

    const { count: messageCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    let description: string;

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `Write a concise, compelling marketplace listing description (2-3 sentences) for a startup project being listed for sale. Highlight what makes it valuable based on the data provided. Be factual and professional. Do not use markdown. Return only the description text.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              name: project.name,
              description: project.description,
              why_built: project.why_built,
              progress_score: project.progress_score,
              total_prompts: messageCount || 0,
              traction_signals: (events || []).map((e) => e.description),
            }),
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      description =
        completion.choices[0]?.message?.content?.trim() ||
        project.description ||
        "";
    } catch {
      description = project.description || "";
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Listing description error:", error);
    return NextResponse.json(
      { error: "Failed to generate listing description" },
      { status: 500 }
    );
  }
}
