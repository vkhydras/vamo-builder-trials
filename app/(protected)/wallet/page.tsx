"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { RewardLedgerEntry, Redemption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      // Reload data
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "fulfilled":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Fulfilled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Balance Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Pineapple Balance</p>
            <p className="text-4xl font-bold">
              🍍 {profile?.pineapple_balance ?? 0}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setRedeemOpen(true)}
            disabled={(profile?.pineapple_balance || 0) < 50}
          >
            Redeem
          </Button>
        </CardContent>
      </Card>

      {/* Reward History */}
      <Card>
        <CardHeader>
          <CardTitle>Reward History</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rewards yet. Start building to earn pineapples!
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {entry.event_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          entry.reward_amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {entry.reward_amount > 0 ? "+" : ""}
                        {entry.reward_amount} 🍍
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.balance_after}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {hasMoreLedger && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" onClick={loadMoreLedger}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No redemptions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(r.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.amount} 🍍
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {r.reward_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Pineapples</DialogTitle>
            <DialogDescription>
              Convert your pineapples to Uber Eats credits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold">
                🍍 {profile?.pineapple_balance ?? 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Amount to Redeem (min 50)</Label>
              <Input
                type="number"
                min={50}
                max={profile?.pineapple_balance || 0}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label>Reward Type</Label>
              <div className="text-sm text-muted-foreground">
                Uber Eats Credit
              </div>
            </div>
            <Button
              className="w-full"
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
