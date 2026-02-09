"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ActivityEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
        .in("event_type", [
          "feature_shipped",
          "customer_added",
          "revenue_logged",
        ])
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

    // Build linked assets map
    const assets: Record<string, string> = {};
    (linksRes.data || []).forEach((e) => {
      const url =
        (e.metadata as Record<string, string>)?.url || "";
      if (e.event_type === "link_linkedin") assets.linkedin = url;
      if (e.event_type === "link_github") assets.github = url;
      if (e.event_type === "link_website") assets.website = url;
    });
    setLinkedAssets(assets);
    setLoading(false);
  }, [project.id, supabase]);

  useEffect(() => {
    // refreshKey changes trigger a data reload
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

    // Award pineapples
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

  function getProgressColor(score: number) {
    if (score <= 25) return "text-red-500";
    if (score <= 50) return "text-yellow-500";
    if (score <= 75) return "text-green-500";
    return "text-blue-500";
  }

  function getProgressLabel(score: number) {
    if (score <= 25) return "Early Stage";
    if (score <= 50) return "Building";
    if (score <= 75) return "Traction";
    return "Growth";
  }

  function getEventIcon(eventType: string) {
    switch (eventType) {
      case "feature_shipped":
        return <Rocket className="h-3.5 w-3.5" />;
      case "customer_added":
        return <Users className="h-3.5 w-3.5" />;
      case "revenue_logged":
        return <DollarSign className="h-3.5 w-3.5" />;
      case "link_linkedin":
        return <Linkedin className="h-3.5 w-3.5" />;
      case "link_github":
        return <Github className="h-3.5 w-3.5" />;
      case "link_website":
        return <Globe className="h-3.5 w-3.5" />;
      case "reward_earned":
        return <Trophy className="h-3.5 w-3.5" />;
      case "prompt":
        return <Activity className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Business Analysis</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Valuation Range */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Valuation Range
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {project.valuation_low > 0 || project.valuation_high > 0 ? (
              <p className="text-lg font-semibold">
                ${project.valuation_low.toLocaleString()} – $
                {project.valuation_high.toLocaleString()}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Not yet estimated
                </p>
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why I Built This */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Why I Built This
              </CardTitle>
              {!editingWhy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditingWhy(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {editingWhy ? (
              <div className="space-y-2">
                <Textarea
                  value={whyText}
                  onChange={(e) => setWhyText(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {whyText.length}/1000
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingWhy(false);
                        setWhyText(project.why_built || "");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveWhy}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm">
                {project.why_built || (
                  <span className="text-muted-foreground italic">
                    Click edit to add your &quot;why&quot;
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress Score */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Progress Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-2xl font-bold ${getProgressColor(project.progress_score)}`}
              >
                {project.progress_score}
              </span>
              <Badge variant="outline">{getProgressLabel(project.progress_score)}</Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  project.progress_score <= 25
                    ? "bg-red-500"
                    : project.progress_score <= 50
                      ? "bg-yellow-500"
                      : project.progress_score <= 75
                        ? "bg-green-500"
                        : "bg-blue-500"
                }`}
                style={{ width: `${project.progress_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Traction Signals */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Traction Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {tractionSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start logging progress in the chat to see traction signals here.
              </p>
            ) : (
              <div className="space-y-2">
                {tractionSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-0.5 shrink-0">
                      {getEventIcon(signal.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="break-words">{signal.description}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(signal.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Linked Assets */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Linked Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {[
                {
                  type: "linkedin",
                  label: "LinkedIn",
                  icon: <Linkedin className="h-4 w-4" />,
                },
                {
                  type: "github",
                  label: "GitHub",
                  icon: <Github className="h-4 w-4" />,
                },
                {
                  type: "website",
                  label: "Website",
                  icon: <Globe className="h-4 w-4" />,
                },
              ].map((asset) => (
                <div
                  key={asset.type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {asset.icon}
                    <span>{asset.label}</span>
                  </div>
                  {linkedAssets[asset.type] ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">Linked</span>
                    </div>
                  ) : (
                    <Dialog
                      open={linkDialogOpen && linkType === asset.type}
                      onOpenChange={(open) => {
                        setLinkDialogOpen(open);
                        if (open) setLinkType(asset.type);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setLinkType(asset.type)}
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Link {asset.label}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              placeholder={`https://${asset.type === "linkedin" ? "linkedin.com/in/..." : asset.type === "github" ? "github.com/..." : "your-site.com"}`}
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleLinkAsset}
                            disabled={!linkUrl.trim()}
                          >
                            Link & Earn Pineapples
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Mini Activity Timeline */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Start chatting!
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-0.5 shrink-0 text-muted-foreground">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs break-words line-clamp-2">
                        {event.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {events.length > 0 && onViewTimeline && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={onViewTimeline}
              >
                View full timeline
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
