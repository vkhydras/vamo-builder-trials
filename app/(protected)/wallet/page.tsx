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

export default function WalletPage() {
  const { profile, refreshProfile } = useUser();
  const [ledger, setLedger] = useState<RewardLedgerEntry[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [hasMoreLedger, setHasMoreLedger] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    trackEvent("page_view", { path: "/wallet" });
    async function loadData() {
      const [ledgerRes, redemptionRes] = await Promise.all([
        supabase
          .from("reward_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .range(0, 19),
        supabase
          .from("redemptions")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setLedger(ledgerRes.data || []);
      setHasMoreLedger((ledgerRes.data || []).length === 20);
      setRedemptions(redemptionRes.data || []);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  async function loadMoreLedger() {
    const nextPage = ledgerPage + 1;
    const from = nextPage * 20;
    const { data } = await supabase
      .from("reward_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + 19);

    setLedger((prev) => [...prev, ...(data || [])]);
    setHasMoreLedger((data || []).length === 20);
    setLedgerPage(nextPage);
  }

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

      const [ledgerRes, redemptionRes] = await Promise.all([
        supabase
          .from("reward_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .range(0, 19),
        supabase
          .from("redemptions")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      setLedger(ledgerRes.data || []);
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Pineapple Balance</p>
          <p className="text-4xl font-black text-gray-900 mt-1">
            🍍 {profile?.pineapple_balance ?? 0}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setRedeemOpen(true)}
          disabled={(profile?.pineapple_balance || 0) < 50}
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
        >
          Redeem
        </Button>
      </div>

      {/* Reward History */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Reward History</h2>
        </div>
        <div className="p-6">
          {ledger.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">🍍</div>
              <p className="text-sm text-gray-500">
                No rewards yet. Start building to earn pineapples!
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500">Date</TableHead>
                    <TableHead className="text-gray-500">Event</TableHead>
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
              {hasMoreLedger && (
                <div className="text-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreLedger}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Redemption History */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Redemption History</h2>
        </div>
        <div className="p-6">
          {redemptions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              No redemptions yet.
            </p>
          ) : (
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
          )}
        </div>
      </div>

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
