"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function Navbar() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="text-lg font-bold tracking-tight">
            VAMO
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/marketplace"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/wallet"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Wallet
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : user ? (
            <>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>🍍</span>
                <span>{profile?.pineapple_balance ?? 0}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="rounded-full outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.full_name || "User"}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name?.charAt(0)?.toUpperCase() ||
                          profile?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {profile?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/projects">Projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet">Wallet</Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
