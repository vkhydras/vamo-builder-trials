"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { trackEvent } from "@/lib/analytics";
import type { Profile, Project, Redemption } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  FolderOpen,
  MessageSquare,
  Trophy,
  ArrowDownRight,
  Store,
} from "lucide-react";

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
  const [analyticsFilter, setAnalyticsFilter] = useState("");
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState<(Profile & { project_count?: number }) | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userActivity, setUserActivity] = useState<{ id: string; event_type: string; description: string | null; created_at: string }[]>([]);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

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

      // Count projects per user
      const projectsByOwner: Record<string, number> = {};
      (projectsRes.data || []).forEach((p) => {
        const ownerId = (p as { owner_id: string }).owner_id;
        projectsByOwner[ownerId] = (projectsByOwner[ownerId] || 0) + 1;
      });

      setUsers(
        ((usersRes.data || []) as typeof users).map((u) => ({
          ...u,
          project_count: projectsByOwner[u.id] || 0,
        }))
      );
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

  async function viewUserDetail(user: Profile & { project_count?: number }) {
    setSelectedUser(user);
    setUserDetailLoading(true);

    const [projectsRes, activityRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_events")
        .select("id, event_type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setUserProjects((projectsRes.data as Project[]) || []);
    setUserActivity(activityRes.data || []);
    setUserDetailLoading(false);
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

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "listed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "sold":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "archived":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "";
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const statItems = stats
    ? [
        { label: "Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
        { label: "Projects", value: stats.totalProjects, icon: FolderOpen, color: "text-emerald-600 bg-emerald-50" },
        { label: "Prompts", value: stats.totalPrompts, icon: MessageSquare, color: "text-violet-600 bg-violet-50" },
        { label: "Earned", value: `${stats.totalPineapplesEarned}`, icon: Trophy, color: "text-amber-600 bg-amber-50", suffix: " 🍍" },
        { label: "Redeemed", value: `${stats.totalPineapplesRedeemed}`, icon: ArrowDownRight, color: "text-red-600 bg-red-50", suffix: " 🍍" },
        { label: "Listings", value: stats.activeListings, icon: Store, color: "text-cyan-600 bg-cyan-50" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of platform activity
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {statItems.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 gap-0 shadow-none"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {stat.value}
                {stat.suffix && (
                  <span className="text-base">{stat.suffix}</span>
                )}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="redemptions">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="redemptions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">
            Redemptions ({pendingRedemptions.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">
            Users
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">
            Projects
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Pending Redemptions */}
        <TabsContent value="redemptions">
          <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden gap-0 shadow-none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Pending Redemptions</h2>
            </div>
            <div className="p-6">
              {pendingRedemptions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">
                  No pending redemptions
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-gray-500">User</TableHead>
                      <TableHead className="text-gray-500">Amount</TableHead>
                      <TableHead className="text-gray-500">Type</TableHead>
                      <TableHead className="text-gray-500">Requested</TableHead>
                      <TableHead className="text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRedemptions.map((r) => (
                      <TableRow key={r.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-700">
                          {r.profiles?.email || r.user_id}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900">
                          {r.amount} 🍍
                        </TableCell>
                        <TableCell className="text-sm capitalize text-gray-700">
                          {r.reward_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(r.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                              onClick={() =>
                                updateRedemption(r.id, "fulfilled")
                              }
                            >
                              Fulfill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
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
            </div>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden gap-0 shadow-none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">All Users</h2>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500">Email</TableHead>
                    <TableHead className="text-gray-500">Name</TableHead>
                    <TableHead className="text-gray-500">Pineapples</TableHead>
                    <TableHead className="text-gray-500">Projects</TableHead>
                    <TableHead className="text-gray-500">Admin</TableHead>
                    <TableHead className="text-gray-500">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => viewUserDetail(u)}
                    >
                      <TableCell className="text-sm text-gray-700">{u.email}</TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {u.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900">
                        {u.pineapple_balance} 🍍
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {u.project_count || 0}
                      </TableCell>
                      <TableCell>
                        {u.is_admin && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                          >
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(u.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden gap-0 shadow-none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">All Projects</h2>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500">Name</TableHead>
                    <TableHead className="text-gray-500">Owner</TableHead>
                    <TableHead className="text-gray-500">Status</TableHead>
                    <TableHead className="text-gray-500">Progress</TableHead>
                    <TableHead className="text-gray-500">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id} className="border-gray-100">
                      <TableCell className="text-sm font-semibold text-gray-900">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {p.profiles?.email || p.owner_id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] ${getStatusBadge(p.status)}`}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.progress_score <= 25
                                  ? "bg-red-500"
                                  : p.progress_score <= 50
                                  ? "bg-amber-500"
                                  : p.progress_score <= 75
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${p.progress_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {p.progress_score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(p.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden gap-0 shadow-none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Analytics Events</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Filter by event name..."
                    value={analyticsFilter}
                    onChange={(e) => setAnalyticsFilter(e.target.value)}
                    className="h-9 text-sm border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => setAnalyticsStartDate(e.target.value)}
                    className="h-9 text-sm w-40 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={analyticsEndDate}
                    onChange={(e) => setAnalyticsEndDate(e.target.value)}
                    className="h-9 text-sm w-40 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                {(analyticsFilter || analyticsStartDate || analyticsEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-gray-500 hover:text-gray-900"
                    onClick={() => {
                      setAnalyticsFilter("");
                      setAnalyticsStartDate("");
                      setAnalyticsEndDate("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500">Event</TableHead>
                    <TableHead className="text-gray-500">Properties</TableHead>
                    <TableHead className="text-gray-500">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsEvents
                    .filter((e) => {
                      if (analyticsFilter && !e.event_name.toLowerCase().includes(analyticsFilter.toLowerCase())) return false;
                      const eventDate = new Date(e.created_at).toISOString().split("T")[0];
                      if (analyticsStartDate && eventDate < analyticsStartDate) return false;
                      if (analyticsEndDate && eventDate > analyticsEndDate) return false;
                      return true;
                    })
                    .map((e) => (
                    <TableRow key={e.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {e.event_name}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                        {JSON.stringify(e.properties)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
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
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Load More
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg border-gray-200">
          <DialogHeader>
            <DialogTitle className="font-bold text-gray-900">
              {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Pineapples</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.pineapple_balance} 🍍</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Projects</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.project_count || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Joined</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDistanceToNow(new Date(selectedUser.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {userDetailLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  {userProjects.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Projects</p>
                      <div className="space-y-2">
                        {userProjects.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.status} &middot; {p.progress_score}%</p>
                            </div>
                            <Badge variant="secondary" className={`text-[11px] ${getStatusBadge(p.status)}`}>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {userActivity.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Recent Activity</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {userActivity.map((a) => (
                          <div key={a.id} className="flex items-center justify-between py-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 truncate">
                                <span className="font-medium capitalize">{a.event_type.replace(/_/g, " ")}</span>
                                {a.description && ` — ${a.description}`}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {userProjects.length === 0 && userActivity.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No projects or activity yet.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
