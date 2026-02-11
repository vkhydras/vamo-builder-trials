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
  ArrowUp,
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

  // Prevent embedding the same app inside itself
  const isSameOrigin = project.url
    ? (() => {
        try {
          const projectHost = new URL(project.url).origin;
          return projectHost === window.location.origin;
        } catch {
          return false;
        }
      })()
    : false;

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
          {project.url && (
            <span className="font-mono text-[11px] text-gray-400 truncate max-w-[200px]">
              {project.url}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={device === "desktop" ? "default" : "ghost"}
            size="icon"
            className={`h-8 w-8 ${device === "desktop" ? "bg-gray-900 text-white hover:bg-gray-800" : ""}`}
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={device === "tablet" ? "default" : "ghost"}
            size="icon"
            className={`h-8 w-8 ${device === "tablet" ? "bg-gray-900 text-white hover:bg-gray-800" : ""}`}
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={device === "mobile" ? "default" : "ghost"}
            size="icon"
            className={`h-8 w-8 ${device === "mobile" ? "bg-gray-900 text-white hover:bg-gray-800" : ""}`}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/30 flex items-start justify-center p-4 overflow-auto">
        {project.url && !isSameOrigin ? (
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
        ) : project.url && isSameOrigin ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-3">
              Cannot preview this app inside itself.
            </p>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Open in new tab
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </a>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onOpenSettings}>
              Change URL
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center bg-dot-grid rounded-xl">
            {/* Browser wireframe illustration */}
            <div className="w-64 mb-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Title bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 bg-gray-50/80">
                  <div className="h-2 w-2 rounded-full bg-red-300" />
                  <div className="h-2 w-2 rounded-full bg-yellow-300" />
                  <div className="h-2 w-2 rounded-full bg-green-300" />
                  <div className="flex-1 mx-2 h-3 bg-gray-100 rounded-sm" />
                </div>
                {/* Content skeleton */}
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-8 bg-gray-50 rounded mt-4" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="h-12 bg-gray-50 rounded" />
                    <div className="h-12 bg-gray-50 rounded" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-1 font-medium">
              Link your project to see it live
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
              <ArrowUp className="h-3 w-3" />
              <span>Add a URL to get started</span>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              Add Project URL
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
