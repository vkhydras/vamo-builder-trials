"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";

interface UIPreviewProps {
  project: Project;
  onOpenSettings: () => void;
}

export function UIPreview({ project, onOpenSettings }: UIPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  function handleRefresh() {
    setIframeKey((prev) => prev + 1);
    setIframeLoading(true);
    setIframeError(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={device === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/30 flex items-start justify-center p-4 overflow-auto">
        {project.url ? (
          <div
            className="bg-white rounded-lg shadow-sm overflow-hidden h-full transition-all"
            style={{
              width: deviceWidths[device],
              maxWidth: "100%",
            }}
          >
            {iframeLoading && !iframeError && (
              <div className="p-4">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}
            {iframeError ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                {project.screenshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.screenshot_url}
                    alt="Project screenshot"
                    className="max-w-full rounded-lg"
                  />
                ) : (
                  <>
                    <p className="text-muted-foreground mb-3">
                      Preview unavailable
                    </p>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Open in new tab
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </>
                )}
              </div>
            ) : (
              <iframe
                key={iframeKey}
                src={project.url}
                className={`w-full h-full border-0 ${iframeLoading ? "hidden" : ""}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => setIframeLoading(false)}
                onError={() => {
                  setIframeError(true);
                  setIframeLoading(false);
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-3">
              Link a project URL to see a live preview
            </p>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              Add Project URL
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
