"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { trackEvent } from "@/lib/analytics";

interface ListingWithProject {
  id: string;
  title: string;
  description: string | null;
  asking_price_low: number | null;
  asking_price_high: number | null;
  metrics: Record<string, unknown>;
  screenshots: string[];
  timeline_snapshot: unknown[];
  created_at: string;
  status: string;
  projects: {
    name: string;
    progress_score: number;
    description: string | null;
  };
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ListingWithProject | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    trackEvent("page_view", { path: "/marketplace" });
    async function loadListings() {
      const { data } = await supabase
        .from("listings")
        .select("*, projects(name, progress_score, description)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setListings((data as unknown as ListingWithProject[]) || []);
      setLoading(false);
    }
    loadListings();
  }, [supabase]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">
              Discover and acquire startup projects
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  No listings available yet. Be the first to list!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelected(listing)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{listing.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {listing.description ||
                        listing.projects?.description ||
                        "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      {listing.asking_price_low != null &&
                      listing.asking_price_high != null ? (
                        <span className="text-sm font-semibold">
                          ${listing.asking_price_low.toLocaleString()} – $
                          {listing.asking_price_high.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Price not set
                        </span>
                      )}
                      <Badge variant="outline">
                        {listing.projects?.progress_score || 0}% progress
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Listed{" "}
                      {formatDistanceToNow(new Date(listing.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detail Dialog */}
          <Dialog
            open={!!selected}
            onOpenChange={() => setSelected(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selected?.title}</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selected.description ||
                        selected.projects?.description ||
                        "No description provided"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Asking Price
                      </p>
                      <p className="font-semibold">
                        {selected.asking_price_low != null &&
                        selected.asking_price_high != null
                          ? `$${selected.asking_price_low.toLocaleString()} – $${selected.asking_price_high.toLocaleString()}`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Progress Score
                      </p>
                      <p className="font-semibold">
                        {selected.projects?.progress_score || 0}/100
                      </p>
                    </div>
                  </div>
                  {selected.metrics && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Metrics
                      </p>
                      <div className="text-sm space-y-1">
                        {Object.entries(selected.metrics).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize text-muted-foreground">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground italic">
                    Contact the seller through the platform to make an offer.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
