"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Plus, ArrowRight, Rocket } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    trackEvent("page_view", { path: "/projects" });
    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    }
    loadProjects();
  }, [supabase]);

  function getStatusColor(status: string) {
    switch (status) {
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "listed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "sold": return "bg-purple-50 text-purple-700 border-purple-200";
      case "archived": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "";
    }
  }

  function getProgressLabel(score: number) {
    if (score <= 25) return "Early Stage";
    if (score <= 50) return "Building";
    if (score <= 75) return "Traction";
    return "Growth";
  }

  function getProgressColor(score: number) {
    if (score <= 25) return "bg-red-500";
    if (score <= 50) return "bg-amber-500";
    if (score <= 75) return "bg-emerald-500";
    return "bg-blue-500";
  }

  function getProgressGradient(score: number) {
    if (score <= 25) return "linear-gradient(90deg, #ef4444, #f87171)";
    if (score <= 50) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    if (score <= 75) return "linear-gradient(90deg, #10b981, #34d399)";
    return "linear-gradient(90deg, #3b82f6, #60a5fa)";
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-500" />
            Your Projects
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track your startup projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border border-gray-200 p-6 space-y-3 gap-0 shadow-none"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full rounded-full" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-dot-grid relative gap-0 shadow-none">
          <div className="relative z-10">
            <div className="text-5xl mb-4">🍍</div>
            <p className="text-gray-600 font-medium mb-2">
              No projects yet. Create your first one!
            </p>
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
              Create a project, start logging updates, and earn pineapples along the way.
            </p>
            <Link href="/projects/new">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {projects.map((project) => (
            <Link key={project.id} href={`/builder/${project.id}`}>
              <Card className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full bg-white group gap-0 shadow-none">
                <div
                  className="h-1"
                  style={{ background: getProgressGradient(project.progress_score) }}
                />
                <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {project.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {project.description || "No description"}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {getProgressLabel(project.progress_score)}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {project.progress_score}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress_score)}`}
                      style={{ width: `${project.progress_score}%` }}
                    />
                  </div>
                </div>

                {(project.valuation_low > 0 || project.valuation_high > 0) && (
                  <p className="text-xs text-gray-400">
                    ${project.valuation_low.toLocaleString()} – $
                    {project.valuation_high.toLocaleString()}
                  </p>
                )}

                <div className="flex items-center text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open workspace
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
