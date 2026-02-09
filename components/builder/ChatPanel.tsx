"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChatPanelProps {
  projectId: string;
  onMessageSent: () => void;
}

const TAG_OPTIONS = [
  { value: "feature", label: "Feature", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "customer", label: "Customer", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "revenue", label: "Revenue", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "ask", label: "Ask", color: "bg-amber-100 text-amber-700 border-amber-200" },
];


export function ChatPanel({ projectId, onMessageSent }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

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
    const messageText = input.trim();
    if (!messageText || sending) return;

    setInput("");
    setSending(true);

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

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, data.userMessage, data.message];
      });

      if (data.pineapples > 0) {
        toast.success(`+${data.pineapples} 🍍 earned!`, {
          description: "Keep building to earn more pineapples",
        });
      }

      setSelectedTag(null);
      onMessageSent();
    } catch {
      toast.error("Failed to send message. Please try again.");
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
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <h3 className="font-semibold text-sm">Builder Chat</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Bot className="h-6 w-6" />
              </div>
              <p className="font-medium text-foreground">Welcome to your workspace!</p>
              <p className="mt-1">
                Start logging your progress or use a quick action below.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2.5">
              <div className="shrink-0 mt-0.5">
                {msg.role === "user" ? (
                  <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-background" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold">
                    {msg.role === "user" ? "You" : "Vamo"}
                  </span>
                  {msg.tag && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {msg.tag}
                    </Badge>
                  )}
                  {msg.pineapples_earned > 0 && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      +{msg.pineapples_earned} 🍍
                    </span>
                  )}
                </div>
                {msg.role === "user" ? (
                  <div className="bg-foreground/5 rounded-lg rounded-tl-none px-3 py-2 inline-block max-w-full">
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1 py-2">
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag.value}
              onClick={() =>
                setSelectedTag(selectedTag === tag.value ? null : tag.value)
              }
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                selectedTag === tag.value
                  ? tag.color + " font-medium"
                  : "text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="What did you build or learn today?"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="shrink-0 bg-foreground hover:bg-foreground/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
