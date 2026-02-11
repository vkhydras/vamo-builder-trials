"use client";

import Link from "next/link";
import { useUser } from "@/hooks/use-user";

export function PineappleBalance() {
  const { profile, loading } = useUser();

  if (loading || !profile) return null;

  return (
    <Link
      href="/wallet"
      style={{
        background: "rgba(200, 200, 200, 0.25)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        backdropFilter: "blur(40px) saturate(180%)",
      }}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all cursor-pointer select-none"
    >
      <span className="text-sm font-bold text-gray-800">
        {profile.pineapple_balance ?? 0}
      </span>
      <span className="text-base">🍍</span>
    </Link>
  );
}
