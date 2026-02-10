"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [whyBuilt, setWhyBuilt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    trackEvent("page_view", { path: "/projects/new" });
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Project name is required";
    if (name.trim().length > 100) errs.name = "Max 100 characters";
    if (url && !url.match(/^https?:\/\/.+/)) errs.url = "Must start with http:// or https://";
    if (description.length > 500) errs.description = "Max 500 characters";
    if (whyBuilt.length > 1000) errs.whyBuilt = "Max 1000 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to create a project.");
      setLoading(false);
      return;
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
        why_built: whyBuilt.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create project: " + error.message);
      setLoading(false);
      return;
    }

    await supabase.from("activity_events").insert({
      project_id: project.id,
      user_id: user.id,
      event_type: "project_created",
      description: `Created project "${project.name}"`,
    });

    await trackEvent("project_created", { projectId: project.id });

    toast.success("Project created!");
    router.push(`/builder/${project.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
        Back to projects
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-black tracking-tight text-gray-900">
            Create New Project
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Start tracking your startup progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 text-sm font-medium">
              Project Name *
            </Label>
            <Input
              id="name"
              placeholder="My Awesome Startup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What does your project do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {description.length}/500
            </p>
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-700 text-sm font-medium">
              External URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://your-project.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-gray-400">
              Link to your Lovable, Replit, or external project
            </p>
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whyBuilt" className="text-gray-700 text-sm font-medium">
              Why did you build this?
            </Label>
            <Textarea
              id="whyBuilt"
              placeholder="What problem are you solving? What motivates you?"
              value={whyBuilt}
              onChange={(e) => setWhyBuilt(e.target.value)}
              maxLength={1000}
              rows={4}
              className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {whyBuilt.length}/1000
            </p>
            {errors.whyBuilt && (
              <p className="text-sm text-red-500">{errors.whyBuilt}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium h-11"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
