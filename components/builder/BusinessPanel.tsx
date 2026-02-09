"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ActivityEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Rocket,
  Users,
  DollarSign,
  LinkIcon,
  Github,
  Linkedin,
  Globe,
  Trophy,
  Activity,
  Check,
  Pencil,
} from "lucide-react";

interface BusinessPanelProps {
  project: Project;
  refreshKey: number;
  onProjectUpdate: () => void;
  onViewTimeline?: () => void;
}

export function BusinessPanel({
  project,
  refreshKey,
  onProjectUpdate,
  onViewTimeline,
}: BusinessPanelProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [tractionSignals, setTractionSignals] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWhy, setEditingWhy] = useState(false);
  const [whyText, setWhyText] = useState(project.why_built || "");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkedAssets, setLinkedAssets] = useState<Record<string, string>>({});

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    const [eventsRes, tractionRes, linksRes] = await Promise.all([
      supabase
        .from("activity_events")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("activity_events")
        .select("*")
        .eq("project_id", project.id)
        .in("event_type", ["feature_shipped", "customer_added", "revenue_logged"])
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_events")
        .select("*")
        .eq("project_id", project.id)
        .in("event_type", ["link_linkedin", "link_github", "link_website"])
        .order("created_at", { ascending: false }),
    ]);

    setEvents(eventsRes.data || []);
    setTractionSignals(tractionRes.data || []);

    const assets: Record<string, string> = {};
    (linksRes.data || []).forEach((e) => {
      const url = (e.metadata as Record<string, string>)?.url || "";
      if (e.event_type === "link_linkedin") assets.linkedin = url;
      if (e.event_type === "link_github") assets.github = url;
      if (e.event_type === "link_website") assets.website = url;
    });
    setLinkedAssets(assets);
    setLoading(false);
  }, [project.id, supabase]);

  useEffect(() => {
    void loadData();
  }, [refreshKey, loadData]);

  async function saveWhy() {
    await supabase
      .from("projects")
      .update({ why_built: whyText, updated_at: new Date().toISOString() })
      .eq("id", project.id);
    setEditingWhy(false);
    onProjectUpdate();
    toast.success("Updated!");
  }

  async function handleLinkAsset() {
    if (!linkUrl.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const eventTypeMap: Record<string, string> = {
      linkedin: "link_linkedin",
      github: "link_github",
      website: "link_website",
    };
    const eventType = eventTypeMap[linkType];

    await supabase.from("activity_events").insert({
      project_id: project.id,
      user_id: user.id,
      event_type: eventType,
      description: `Linked ${linkType}: ${linkUrl}`,
      metadata: { url: linkUrl },
    });

    const idempotencyKey = `${project.id}-${eventType}`;
    await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        eventType,
        idempotencyKey,
      }),
    });

    toast.success(`${linkType} linked! Pineapples earned!`);
    setLinkDialogOpen(false);
    setLinkUrl("");
    loadData();
    onProjectUpdate();
  }

  function getEventIcon(eventType: string) {
    switch (eventType) {
      case "feature_shipped": return <Rocket className="h-3.5 w-3.5" />;
      case "customer_added": return <Users className="h-3.5 w-3.5" />;
      case "revenue_logged": return <DollarSign className="h-3.5 w-3.5" />;
      case "link_linkedin": return <Linkedin className="h-3.5 w-3.5" />;
      case "link_github": return <Github className="h-3.5 w-3.5" />;
      case "link_website": return <Globe className="h-3.5 w-3.5" />;
      case "reward_earned": return <Trophy className="h-3.5 w-3.5" />;
      case "prompt": return <Activity className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Section 1: Valuation Range */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Valuation Range
          </h3>
          {project.valuation_low > 0 || project.valuation_high > 0 ? (
            <p className="text-xl font-bold">
              ${project.valuation_low.toLocaleString()} &ndash; ${project.valuation_high.toLocaleString()}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Not yet estimated</p>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                Log progress to unlock
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1 italic">
            Estimates based on logged activity only.
          </p>
        </div>

        <hr />

        {/* Section 2: Why I Built This */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Why I Built This
            </h3>
            {!editingWhy && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setEditingWhy(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {editingWhy ? (
            <div className="space-y-2">
              <Textarea
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                maxLength={1000}
                rows={4}
                className="text-sm"
                placeholder="Why did you start building this?"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{whyText.length}/1000</span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                    setEditingWhy(false);
                    setWhyText(project.why_built || "");
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={saveWhy}>Save</Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {project.why_built || "Click edit to add your \"why\" statement"}
            </p>
          )}
        </div>

        <hr />

        {/* Section 3: Progress Score */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Progress Score
          </h3>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {project.progress_score <= 25 ? "Early Stage" :
               project.progress_score <= 50 ? "Building" :
               project.progress_score <= 75 ? "Traction" : "Growth"}
            </span>
            <span className={`text-lg font-bold ${
              project.progress_score <= 25 ? "text-red-500" :
              project.progress_score <= 50 ? "text-yellow-500" :
              project.progress_score <= 75 ? "text-green-500" :
              "text-blue-500"
            }`}>
              {project.progress_score}/100
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                project.progress_score <= 25 ? "bg-red-500" :
                project.progress_score <= 50 ? "bg-yellow-500" :
                project.progress_score <= 75 ? "bg-green-500" :
                "bg-blue-500"
              }`}
              style={{ width: `${project.progress_score}%` }}
            />
          </div>
        </div>

        <hr />

        {/* Section 4: Traction Signals */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Traction Signals
          </h3>
          {tractionSignals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
              Start logging progress in the chat to see traction signals here.
            </p>
          ) : (
            <div className="space-y-2">
              {tractionSignals.map((signal) => (
                <div key={signal.id} className="flex items-start gap-2.5 py-1.5">
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    {getEventIcon(signal.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words">{signal.description}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr />

        {/* Section 5: Linked Assets */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Linked Assets
          </h3>
          <div className="space-y-2">
            {[
              { type: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, reward: 5 },
              { type: "github", label: "GitHub", icon: <Github className="h-4 w-4" />, reward: 5 },
              { type: "website", label: "Website", icon: <Globe className="h-4 w-4" />, reward: 3 },
            ].map((asset) => (
              <div key={asset.type} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm">
                  {asset.icon}
                  <span>{asset.label}</span>
                </div>
                {linkedAssets[asset.type] ? (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Linked</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setLinkType(asset.type);
                      setLinkDialogOpen(true);
                    }}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link <span className="text-amber-600 ml-1">+{asset.reward}🍍</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <hr />

        {/* Section 6: Mini Activity Timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Activity Timeline
            </h3>
            {onViewTimeline && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onViewTimeline}>
                View full timeline
              </Button>
            )}
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
              No activity yet. Start chatting to log progress!
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-2.5 py-1">
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words">{event.description}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link Asset Dialog */}
      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) setLinkUrl("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link {linkType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder={`https://${
                  linkType === "linkedin" ? "linkedin.com/in/..." :
                  linkType === "github" ? "github.com/..." :
                  "your-site.com"
                }`}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleLinkAsset}
              disabled={!linkUrl.trim()}
            >
              Link & Earn Pineapples 🍍
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
