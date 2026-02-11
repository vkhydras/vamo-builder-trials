"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/projects", label: "Projects" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/wallet", label: "Wallet" },
  ];

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/projects">
            <Image
              src="/logo.svg"
              alt="Vamo"
              width={72}
              height={18}
            />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname === link.href
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : user ? (
            <>
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:opacity-80 transition-opacity"
              >
                <span>🍍</span>
                <span>{profile?.pineapple_balance ?? 0}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="rounded-full outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.full_name || "User"}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="text-xs bg-emerald-50 text-emerald-700">
                        {profile?.full_name?.charAt(0)?.toUpperCase() ||
                          profile?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-gray-200">
                  <div className="px-2 py-1.5 text-sm text-gray-500 truncate">
                    {profile?.email}
                  </div>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem asChild>
                    <Link href="/projects" className="text-gray-700">Projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="text-gray-700">Wallet</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace" className="text-gray-700">Marketplace</Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-gray-700">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white font-medium">
                  Sign In
                </Button>
              </Link>
              <button
                type="button"
                className="md:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
