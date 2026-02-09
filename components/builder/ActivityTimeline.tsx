"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityEvent } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  Rocket,
  Users,
  DollarSign,
  Linkedin,
  Github,
  Globe,
  Trophy,
  Activity,
  MessageSquare,
  Tag,
  Eye,
  Gift,
  Search,
} from "lucide-react";

interface ActivityTimelineProps {
  projectId: string;
}

const EVENT_TYPES = [
  { value: "prompt", label: "Prompts", icon: MessageSquare },
  { value: "feature_shipped", label: "Features", icon: Rocket },
  { value: "customer_added", label: "Customers", icon: Users },
  { value: "revenue_logged", label: "Revenue", icon: DollarSign },
  { value: "reward_earned", label: "Rewards", icon: Trophy },
  { value: "link", label: "Links", icon: Globe },
  { value: "other", label: "Other", icon: Activity },
];

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("activity_events")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    }
    loadEvents();
  }, [projectId, supabase]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) => e.description?.toLowerCase().includes(q) || e.event_type.toLowerCase().includes(q)
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((e) => {
        if (selectedTypes.includes("link")) {
          if (["link_linkedin", "link_github", "link_website"].includes(e.event_type)) return true;
        }
        if (selectedTypes.includes("other")) {
          if (["update", "project_created", "listing_created", "offer_received", "reward_redeemed"].includes(e.event_type)) return true;
        }
        return selectedTypes.includes(e.event_type);
      });
    }

    return filtered;
  }, [events, searchQuery, selectedTypes]);

  function getEventIcon(eventType: string) {
    switch (eventType) {
      case "feature_shipped": return <Rocket className="h-4 w-4" />;
      case "customer_added": return <Users className="h-4 w-4" />;
      case "revenue_logged": return <DollarSign className="h-4 w-4" />;
      case "link_linkedin": return <Linkedin className="h-4 w-4" />;
      case "link_github": return <Github className="h-4 w-4" />;
      case "link_website": return <Globe className="h-4 w-4" />;
      case "reward_earned": return <Trophy className="h-4 w-4" />;
      case "reward_redeemed": return <Gift className="h-4 w-4" />;
      case "prompt": return <MessageSquare className="h-4 w-4" />;
      case "listing_created": return <Tag className="h-4 w-4" />;
      case "offer_received": return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  }

  function getEventColor(eventType: string) {
    switch (eventType) {
      case "feature_shipped": return "text-blue-600 bg-blue-50";
      case "customer_added": return "text-green-600 bg-green-50";
      case "revenue_logged": return "text-purple-600 bg-purple-50";
      case "reward_earned": return "text-amber-600 bg-amber-50";
      case "link_linkedin":
      case "link_github":
      case "link_website": return "text-cyan-600 bg-cyan-50";
      case "listing_created": return "text-indigo-600 bg-indigo-50";
      case "offer_received": return "text-pink-600 bg-pink-50";
      default: return "text-muted-foreground bg-muted";
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="multiple"
          value={selectedTypes}
          onValueChange={setSelectedTypes}
          className="flex flex-wrap justify-start gap-1"
        >
          {EVENT_TYPES.map((type) => (
            <ToggleGroupItem
              key={type.value}
              value={type.value}
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              <type.icon className="h-3 w-3 mr-1" />
              {type.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {events.length === 0
              ? "No activity events yet."
              : "No events match your filters."}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex gap-3 relative">
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center z-10 ${getEventColor(event.event_type)}`}
                  >
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {event.event_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm break-words">
                      {event.description || "No description"}
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
          </div>
        )}
      </div>

      <div className="p-3 border-t text-center text-xs text-muted-foreground">
        {filteredEvents.length} of {events.length} events
      </div>
    </div>
  );
}
