"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { trackEvent } from "@/lib/analytics";
import type { Profile, Project, Redemption } from "@/lib/types";

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  properties: Record<string, unknown>;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalPrompts: number;
  totalPineapplesEarned: number;
  totalPineapplesRedeemed: number;
  activeListings: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<(Profile & { project_count?: number })[]>([]);
  const [projects, setProjects] = useState<(Project & { profiles?: { email: string } })[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<(Redemption & { profiles?: { email: string } })[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsPage, setAnalyticsPage] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    trackEvent("page_view", { path: "/admin" });
    async function loadAdmin() {
      const [
        usersRes,
        projectsRes,
        redemptionsRes,
        analyticsRes,
        promptCountRes,
        ledgerEarnedRes,
        ledgerRedeemedRes,
        listingsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("*, profiles(email)").order("created_at", { ascending: false }),
        supabase
          .from("redemptions")
          .select("*, profiles(email)")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("analytics_events")
          .select("*")
          .order("created_at", { ascending: false })
          .range(0, 49),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", "prompt_sent"),
        supabase
          .from("reward_ledger")
          .select("reward_amount")
          .gt("reward_amount", 0),
        supabase
          .from("reward_ledger")
          .select("reward_amount")
          .lt("reward_amount", 0),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      setUsers((usersRes.data as typeof users) || []);
      setProjects((projectsRes.data as typeof projects) || []);
      setPendingRedemptions((redemptionsRes.data as typeof pendingRedemptions) || []);
      setAnalyticsEvents((analyticsRes.data as AnalyticsEvent[]) || []);

      const totalEarned = (ledgerEarnedRes.data || []).reduce(
        (sum, e) => sum + e.reward_amount,
        0
      );
      const totalRedeemed = Math.abs(
        (ledgerRedeemedRes.data || []).reduce(
          (sum, e) => sum + e.reward_amount,
          0
        )
      );

      setStats({
        totalUsers: (usersRes.data || []).length,
        totalProjects: (projectsRes.data || []).length,
        totalPrompts: promptCountRes.count || 0,
        totalPineapplesEarned: totalEarned,
        totalPineapplesRedeemed: totalRedeemed,
        activeListings: listingsRes.count || 0,
      });

      setLoading(false);
    }
    loadAdmin();
  }, [supabase]);

  async function updateRedemption(id: string, status: "fulfilled" | "failed") {
    const { error } = await supabase
      .from("redemptions")
      .update({
        status,
        fulfilled_at: status === "fulfilled" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update redemption");
      return;
    }

    setPendingRedemptions((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Redemption marked as ${status}`);
  }

  async function loadMoreAnalytics() {
    const nextPage = analyticsPage + 1;
    const from = nextPage * 50;
    const { data } = await supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + 49);
    setAnalyticsEvents((prev) => [...prev, ...((data as AnalyticsEvent[]) || [])]);
    setAnalyticsPage(nextPage);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Users", value: stats.totalUsers },
            { label: "Projects", value: stats.totalProjects },
            { label: "Prompts", value: stats.totalPrompts },
            { label: "Earned", value: `🍍 ${stats.totalPineapplesEarned}` },
            { label: "Redeemed", value: `🍍 ${stats.totalPineapplesRedeemed}` },
            { label: "Listings", value: stats.activeListings },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="redemptions">
        <TabsList>
          <TabsTrigger value="redemptions">
            Pending Redemptions ({pendingRedemptions.length})
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Pending Redemptions */}
        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle>Pending Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRedemptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending redemptions
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRedemptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          {r.profiles?.email || r.user_id}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          🍍 {r.amount}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {r.reward_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(r.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() =>
                                updateRedemption(r.id, "fulfilled")
                              }
                            >
                              Fulfill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateRedemption(r.id, "failed")}
                            >
                              Fail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Pineapples</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">
                        {u.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        🍍 {u.pineapple_balance}
                      </TableCell>
                      <TableCell>
                        {u.is_admin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(u.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.profiles?.email || p.owner_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.progress_score}/100
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(p.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm font-medium">
                        {e.event_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {JSON.stringify(e.properties)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(e.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreAnalytics}
                >
                  Load More
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
