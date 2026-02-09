"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChatPanelProps {
  projectId: string;
  onMessageSent: () => void;
}

const TAG_OPTIONS = [
  { value: "feature", label: "Feature", color: "bg-blue-100 text-blue-800" },
  { value: "customer", label: "Customer", color: "bg-green-100 text-green-800" },
  { value: "revenue", label: "Revenue", color: "bg-purple-100 text-purple-800" },
  { value: "ask", label: "Ask", color: "bg-yellow-100 text-yellow-800" },
];

export function ChatPanel({ projectId, onMessageSent }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);
    }
    loadMessages();
  }, [projectId, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);

    // Optimistic: add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      user_id: "",
      role: "user",
      content: messageText,
      extracted_intent: null,
      tag: selectedTag as Message["tag"],
      pineapples_earned: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: messageText,
          tag: selectedTag,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();

      // Replace temp message with real ones
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, data.userMessage, data.message];
      });

      if (data.pineapples > 0) {
        toast.success(`+${data.pineapples} 🍍 earned!`);
      }

      setSelectedTag(null);
      onMessageSent();
    } catch {
      toast.error("Failed to send message. Please try again.");
      // Restore input
      setInput(messageText);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Builder Chat</h3>
        <p className="text-xs text-muted-foreground">
          Log updates to earn pineapples
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Start logging your progress!</p>
              <p className="mt-1">
                Tell me what you&apos;ve built, who you&apos;ve talked to, or
                what revenue you&apos;ve made.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.role === "user" ? "" : ""
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {msg.role === "user" ? (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">
                    {msg.role === "user" ? "You" : "Vamo"}
                  </span>
                  {msg.tag && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {msg.tag}
                    </Badge>
                  )}
                  {msg.pineapples_earned > 0 && (
                    <span className="text-xs text-amber-600">
                      +{msg.pineapples_earned} 🍍
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag.value}
              onClick={() =>
                setSelectedTag(selectedTag === tag.value ? null : tag.value)
              }
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                selectedTag === tag.value
                  ? tag.color + " border-current"
                  : "text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="What did you build or learn today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
