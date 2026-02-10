"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
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
import { Store, TrendingUp, DollarSign } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Marketplace
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Discover and acquire startup projects with verified progress
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 p-6 space-y-3"
                >
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200">
              <Store className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No listings available yet. Be the first to list!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelected(listing)}
                >
                  {listing.screenshots && listing.screenshots.length > 0 && (
                    <div className="aspect-video bg-gray-50 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.screenshots[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {listing.description ||
                        listing.projects?.description ||
                        "No description"}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      {listing.asking_price_low != null &&
                      listing.asking_price_high != null ? (
                        <span className="text-sm font-bold text-gray-900">
                          ${listing.asking_price_low.toLocaleString()} – $
                          {listing.asking_price_high.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Price not set
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                      >
                        {listing.projects?.progress_score || 0}%
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Listed{" "}
                      {formatDistanceToNow(new Date(listing.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail Dialog */}
          <Dialog
            open={!!selected}
            onOpenChange={() => setSelected(null)}
          >
            <DialogContent className="max-w-lg border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {selected?.title}
                </DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {selected.description ||
                      selected.projects?.description ||
                      "No description provided"}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                          Asking Price
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {selected.asking_price_low != null &&
                        selected.asking_price_high != null
                          ? `$${selected.asking_price_low.toLocaleString()} – $${selected.asking_price_high.toLocaleString()}`
                          : "Not set"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                          Progress
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {selected.projects?.progress_score || 0}/100
                      </p>
                    </div>
                  </div>
                  {selected.metrics &&
                    Object.keys(selected.metrics).length > 0 && (
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                          Metrics
                        </p>
                        <div className="text-sm space-y-1.5">
                          {Object.entries(selected.metrics).map(
                            ([key, val]) => (
                              <div
                                key={key}
                                className="flex justify-between py-1 border-b border-gray-100 last:border-0"
                              >
                                <span className="capitalize text-gray-500">
                                  {key.replace(/_/g, " ")}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {String(val)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  <p className="text-[11px] text-gray-400 italic">
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
