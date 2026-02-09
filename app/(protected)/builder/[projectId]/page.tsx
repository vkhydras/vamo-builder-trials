"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Project } from "@/lib/types";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { UIPreview } from "@/components/builder/UIPreview";
import { BusinessPanel } from "@/components/builder/BusinessPanel";
import { ActivityTimeline } from "@/components/builder/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  MessageSquare,
  Tag,
  DollarSign,
  Pencil,
  Check,
  X,
} from "lucide-react";

export default function BuilderPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const { profile, refreshProfile } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Listing dialog
  const [listingOpen, setListingOpen] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [listingDesc, setListingDesc] = useState("");
  const [listingPriceLow, setListingPriceLow] = useState("");
  const [listingPriceHigh, setListingPriceHigh] = useState("");
  const [listingSubmitting, setListingSubmitting] = useState(false);

  // Offer dialog
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerData, setOfferData] = useState<{
    offer: { offer_low: number; offer_high: number };
    reasoning: string;
    signals: string[];
  } | null>(null);

  // URL settings dialog
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Timeline dialog
  const [timelineOpen, setTimelineOpen] = useState(false);

  const loadProject = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!data) {
      router.push("/projects");
      return;
    }
    setProject(data);
    setNameInput(data.name);
    setLoading(false);
  }, [projectId, router, supabase]);

  useEffect(() => {
    loadProject();
    trackEvent("page_view", { path: `/builder/${projectId}`, projectId });
  }, [projectId, loadProject]);

  function handleMessageSent() {
    setRefreshKey((prev) => prev + 1);
    loadProject();
    refreshProfile();
  }

  async function saveName() {
    if (!nameInput.trim() || !project) return;
    await supabase
      .from("projects")
      .update({ name: nameInput.trim(), updated_at: new Date().toISOString() })
      .eq("id", project.id);
    setEditingName(false);
    loadProject();
  }

  async function saveUrl() {
    if (!project) return;
    await supabase
      .from("projects")
      .update({ url: urlInput.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", project.id);
    setUrlDialogOpen(false);
    loadProject();
    toast.success("URL updated!");
  }

  async function handleGetOffer() {
    setOfferOpen(true);
    setOfferLoading(true);
    setOfferData(null);

    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setOfferData(data);
    } catch {
      toast.error("Failed to generate offer");
      setOfferOpen(false);
    } finally {
      setOfferLoading(false);
    }
  }

  async function handleCreateListing() {
    if (!project || !listingTitle.trim()) return;
    setListingSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get timeline snapshot
    const { data: timeline } = await supabase
      .from("activity_events")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    const { data: messages } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    const { error } = await supabase.from("listings").insert({
      project_id: project.id,
      user_id: user.id,
      title: listingTitle,
      description: listingDesc || null,
      asking_price_low: parseInt(listingPriceLow) || project.valuation_low,
      asking_price_high: parseInt(listingPriceHigh) || project.valuation_high,
      timeline_snapshot: timeline,
      metrics: {
        progress_score: project.progress_score,
        total_prompts: messages,
        traction_signals: (timeline || []).filter((e) =>
          ["feature_shipped", "customer_added", "revenue_logged"].includes(
            e.event_type
          )
        ).length,
      },
    });

    if (error) {
      toast.error("Failed to create listing");
      setListingSubmitting(false);
      return;
    }

    // Update project status
    await supabase
      .from("projects")
      .update({ status: "listed" })
      .eq("id", project.id);

    // Log events
    await supabase.from("activity_events").insert({
      project_id: project.id,
      user_id: user.id,
      event_type: "listing_created",
      description: `Listed project for sale: ${listingTitle}`,
    });

    await trackEvent("listing_created", {
      projectId: project.id,
    });

    toast.success("Listing published!");
    setListingOpen(false);
    setListingSubmitting(false);
    loadProject();
  }

  if (loading || !project) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const headerContent = (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-3">
        {editingName ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-8 text-sm w-48"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setEditingName(false);
                  setNameInput(project.name);
                }
              }}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveName}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingName(false);
                setNameInput(project.name);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            className="font-semibold text-sm hover:text-muted-foreground transition-colors flex items-center gap-1.5"
            onClick={() => setEditingName(true)}
          >
            {project.name}
            <Pencil className="h-3 w-3 opacity-50" />
          </button>
        )}
        <Badge variant="secondary" className="text-xs">
          🍍 {profile?.pineapple_balance ?? 0}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {project.progress_score >= 10 && (
          <Button variant="outline" size="sm" onClick={handleGetOffer}>
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            Get Vamo Offer
          </Button>
        )}
        {project.progress_score >= 20 && (
          <Button
            size="sm"
            onClick={() => {
              setListingTitle(project.name);
              setListingPriceLow(project.valuation_low.toString());
              setListingPriceHigh(project.valuation_high.toString());
              setListingOpen(true);
            }}
          >
            <Tag className="h-3.5 w-3.5 mr-1" />
            List for Sale
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {headerContent}

      {/* Desktop: 3-panel layout */}
      <div className="flex-1 hidden xl:flex overflow-hidden">
        <div className="w-[320px] border-r flex flex-col overflow-hidden">
          <ChatPanel projectId={projectId} onMessageSent={handleMessageSent} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <UIPreview
            project={project}
            onOpenSettings={() => {
              setUrlInput(project.url || "");
              setUrlDialogOpen(true);
            }}
          />
        </div>
        <div className="w-[360px] border-l flex flex-col overflow-hidden">
          <BusinessPanel
            project={project}
            refreshKey={refreshKey}
            onProjectUpdate={loadProject}
            onViewTimeline={() => setTimelineOpen(true)}
          />
        </div>
      </div>

      {/* Tablet: 2 panels + slide-out chat */}
      <div className="flex-1 hidden md:flex xl:hidden overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <UIPreview
            project={project}
            onOpenSettings={() => {
              setUrlInput(project.url || "");
              setUrlDialogOpen(true);
            }}
          />
        </div>
        <div className="w-[360px] border-l flex flex-col overflow-hidden">
          <BusinessPanel
            project={project}
            refreshKey={refreshKey}
            onProjectUpdate={loadProject}
            onViewTimeline={() => setTimelineOpen(true)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-4 left-4 h-12 w-12 rounded-full shadow-lg z-50 xl:hidden"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[350px] p-0">
            <ChatPanel
              projectId={projectId}
              onMessageSent={handleMessageSent}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile: Tab-based navigation */}
      <div className="flex-1 md:hidden overflow-hidden">
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
            <ChatPanel
              projectId={projectId}
              onMessageSent={handleMessageSent}
            />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
            <UIPreview
              project={project}
              onOpenSettings={() => {
                setUrlInput(project.url || "");
                setUrlDialogOpen(true);
              }}
            />
          </TabsContent>
          <TabsContent value="business" className="flex-1 overflow-hidden m-0">
            <BusinessPanel
              project={project}
              refreshKey={refreshKey}
              onProjectUpdate={loadProject}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* URL Settings Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project URL</DialogTitle>
            <DialogDescription>
              Link to your Lovable, Replit, or external project to see a live preview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://your-project.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={saveUrl}>
              Save URL
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vamo Instant Offer</DialogTitle>
          </DialogHeader>
          {offerLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : offerData ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Offer Range</p>
                <p className="text-2xl font-bold">
                  ${offerData.offer.offer_low.toLocaleString()} – $
                  {offerData.offer.offer_high.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Reasoning</p>
                <p className="text-sm text-muted-foreground">
                  {offerData.reasoning}
                </p>
              </div>
              {offerData.signals && offerData.signals.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Signals Used</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {offerData.signals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">
                This is a non-binding estimate based on your logged activity.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOfferOpen(false)}
                >
                  Dismiss
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setOfferOpen(false);
                    setListingTitle(project.name);
                    setListingPriceLow(
                      offerData.offer.offer_low.toString()
                    );
                    setListingPriceHigh(
                      offerData.offer.offer_high.toString()
                    );
                    setListingOpen(true);
                  }}
                >
                  List for Sale
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Activity Timeline Dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Activity Timeline</DialogTitle>
            <DialogDescription>
              Full history of events for this project
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ActivityTimeline projectId={projectId} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Listing Dialog */}
      <Dialog open={listingOpen} onOpenChange={setListingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List Project for Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={listingDesc}
                onChange={(e) => setListingDesc(e.target.value)}
                placeholder="Describe what makes this project valuable..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Low ($)</Label>
                <Input
                  type="number"
                  value={listingPriceLow}
                  onChange={(e) => setListingPriceLow(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Price High ($)</Label>
                <Input
                  type="number"
                  value={listingPriceHigh}
                  onChange={(e) => setListingPriceHigh(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateListing}
              disabled={!listingTitle.trim() || listingSubmitting}
            >
              {listingSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
