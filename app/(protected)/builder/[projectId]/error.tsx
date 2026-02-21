"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Builder error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold mb-2">Builder encountered an error</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong while loading the workspace. Please try again.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
          <Button onClick={reset}>Retry</Button>
        </div>
      </div>
    </div>
  );
}
