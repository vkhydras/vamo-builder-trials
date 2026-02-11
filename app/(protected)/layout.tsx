"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PineappleBalance } from "@/components/pineapple-balance";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBuilder = pathname.startsWith("/builder");
  const isAdmin = pathname.startsWith("/admin");

  if (isBuilder) {
    return (
      <>
        {children}
        <PineappleBalance />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!isAdmin && <PineappleBalance />}
    </div>
  );
}
