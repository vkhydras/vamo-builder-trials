"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { RewardLedgerEntry, Redemption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { History, Gift } from "lucide-react";

export default function WalletPage() {
  const { profile, refreshProfile } = useUser();
  const [ledger, setLedger] = useState<(RewardLedgerEntry & { projects?: { name: string } | null })[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [hasMoreLedger, setHasMoreLedger] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  async function loadLedgerPage(page: number) {
    const from = page * 20;
    const { data } = await supabase
      .from("reward_ledger")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })
      .range(from, from + 19);

    setLedger(data || []);
    setHasMoreLedger((data || []).length === 20);
    setLedgerPage(page);
  }

  useEffect(() => {
    trackEvent("page_view", { path: "/wallet" });
    async function loadData() {
      const redemptionRes = await supabase
        .from("redemptions")
        .select("*")
        .order("created_at", { ascending: false });

      await loadLedgerPage(0);
      setRedemptions(redemptionRes.data || []);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  async function handleRedeem() {
    const amount = parseInt(redeemAmount);
    if (!amount || amount < 50) {
      toast.error("Minimum redemption is 50 pineapples");
      return;
    }
    if (amount > (profile?.pineapple_balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setRedeeming(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, rewardType: "uber_eats" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(
        "Redemption submitted! You'll receive your reward within 48 hours."
      );
      setRedeemOpen(false);
      setRedeemAmount("");
      refreshProfile();

      const redemptionRes = await supabase
        .from("redemptions")
        .select("*")
        .order("created_at", { ascending: false });

      await loadLedgerPage(0);
      setRedemptions(redemptionRes.data || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Redemption failed"
      );
    } finally {
      setRedeeming(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Pending
          </Badge>
        );
      case "fulfilled":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Fulfilled
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Balance Card */}
      <Card className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 flex items-center justify-between gap-0 border-0 shadow-none">
        <div>
          <p className="text-sm text-gray-400">Pineapple Balance</p>
          <p className="text-4xl font-black text-white mt-1">
            🍍 {profile?.pineapple_balance ?? 0}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setRedeemOpen(true)}
          disabled={(profile?.pineapple_balance || 0) < 50}
          className="bg-[#F9F9F9] hover:bg-gray-100 text-gray-900 font-medium"
        >
          Redeem
        </Button>
      </Card>

      {/* Reward History */}
      <Card className="rounded-2xl border border-gray-200 bg-[#F9F9F9] overflow-hidden gap-0 shadow-none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Reward History</h2>
        </div>
        <div className="p-4 sm:p-6">
          {ledger.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-14 flex flex-col items-center justify-center">
              <History className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                No rewards yet. Start building to earn pineapples!
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-gray-500">Date</TableHead>
                      <TableHead className="text-gray-500">Event</TableHead>
                      <TableHead className="text-gray-500">Project</TableHead>
                      <TableHead className="text-right text-gray-500">
                        Amount
                      </TableHead>
                      <TableHead className="text-right text-gray-500">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => (
                      <TableRow key={entry.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-gray-700">
                          {entry.event_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {entry.projects?.name || "\u2014"}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-semibold ${
                            entry.reward_amount > 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {entry.reward_amount > 0 ? "+" : ""}
                          {entry.reward_amount} 🍍
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-700">
                          {entry.balance_after}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="md:hidden space-y-3 stagger-children">
                {ledger.map((entry) => (
                  <Card
                    key={entry.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 gap-0 shadow-none"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 capitalize">
                      {entry.event_type.replace(/_/g, " ")}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          {entry.projects?.name || "\u2014"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pl-4">
                        <p
                          className={`text-sm font-semibold ${
                            entry.reward_amount > 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {entry.reward_amount > 0 ? "+" : ""}
                          {entry.reward_amount} 🍍
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          bal {entry.balance_after}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLedgerPage(Math.max(ledgerPage - 1, 0))}
                  disabled={ledgerPage === 0}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-500">
                  Page {ledgerPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLedgerPage(ledgerPage + 1)}
                  disabled={!hasMoreLedger}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Redemption History */}
      <Card className="rounded-2xl border border-gray-200 bg-[#F9F9F9] overflow-hidden gap-0 shadow-none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Redemption History</h2>
        </div>
        <div className="p-4 sm:p-6">
          {redemptions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-14 flex flex-col items-center justify-center">
              <Gift className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                No redemptions yet.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-gray-500">Date</TableHead>
                      <TableHead className="text-gray-500">Amount</TableHead>
                      <TableHead className="text-gray-500">Reward Type</TableHead>
                      <TableHead className="text-gray-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((r) => (
                      <TableRow key={r.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(r.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900">
                          {r.amount} 🍍
                        </TableCell>
                        <TableCell className="text-sm capitalize text-gray-700">
                          {r.reward_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="md:hidden space-y-3 stagger-children">
                {redemptions.map((r) => (
                  <Card
                    key={r.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 gap-0 shadow-none"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {r.amount} 🍍
                      </p>
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm capitalize text-gray-700">
                        {r.reward_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="border-gray-200">
          <DialogHeader>
            <DialogTitle className="font-bold text-gray-900">
              Redeem Pineapples
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Convert your pineapples to Uber Eats credits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Current Balance
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                🍍 {profile?.pineapple_balance ?? 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Amount to Redeem (min 50)
              </Label>
              <Input
                type="number"
                min={50}
                max={profile?.pineapple_balance || 0}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="50"
                className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Reward Type
              </Label>
              <div className="text-sm text-gray-500 rounded-xl bg-gray-50 p-3">
                Uber Eats Credit
              </div>
            </div>
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium h-11"
              onClick={handleRedeem}
              disabled={
                redeeming ||
                !redeemAmount ||
                parseInt(redeemAmount) < 50 ||
                parseInt(redeemAmount) > (profile?.pineapple_balance || 0)
              }
            >
              {redeeming ? "Processing..." : "Confirm Redemption"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
