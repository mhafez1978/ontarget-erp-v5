"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string; // ISO string (persisted)
}

interface ChatWidgetConfig {
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  theme?: "light" | "dark";
  initialOpen?: boolean;
}

interface ChatWidgetProps {
  companySlug: string;
  companyName?: string;
  config?: ChatWidgetConfig;
  mountInside?: boolean; // if true, the widget will position relative to its container instead of fixed to window
}

export function ChatWidget({
  companySlug,
  companyName = "Company",
  config,
  mountInside = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(Boolean(config?.initialOpen));
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("ChatWidget mounted for", companySlug, "config:", config);

    // Load last conversation messages
    (async () => {
      try {
        const res = await fetch(
          `/api/storefront/${companySlug}/widget/conversations`,
          { method: "GET" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.messages)) {
          setMessages(
            data.messages.map(
              (m: { role?: string; content?: string; createdAt?: string }) => ({
                role: (m.role as Message["role"]) || "user",
                content: m.content || "",
                timestamp: m.createdAt || new Date().toISOString(),
              })
            )
          );
        }

        // If server returned a conversationId, persist a per-store cookie for visitors
        const convId = data?.conversationId;
        if (convId) {
          try {
            document.cookie = `widgetConversationId_${companySlug}=${convId}; Path=/; Max-Age=${
              60 * 60 * 24 * 30
            }`;
          } catch {
            // noop in environments where cookies aren't available
          }
        }
      } catch (e) {
        console.error("Failed to load chat conversation", e);
      }
    })();

    // Setup event batching flush interval
    const flushInterval = setInterval(() => {
      flushEventQueue();
    }, 5000);

    // Flush on unload
    const onUnload = () => {
      flushEventQueue(true);
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(flushInterval);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [companySlug, config]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const primaryColor = config?.primaryColor || "#3B82F6";

  // Telemetry event queue (batched)
  const eventQueueRef = useRef<Array<Record<string, unknown>>>([]);

  const enqueueEvent = (ev: { type: string; [k: string]: unknown }) => {
    eventQueueRef.current.push({
      type: ev.type,
      data: ev,
      ts: new Date().toISOString(),
    });
    if (eventQueueRef.current.length >= 10) flushEventQueue();
  };

  const flushEventQueue = async (useBeacon = false) => {
    if (eventQueueRef.current.length === 0) return;
    const batch = eventQueueRef.current.splice(0, eventQueueRef.current.length);
    const payload = {
      events: batch.map((e) => ({
        companyId: companySlug,
        eventType: e.type,
        payload: e,
      })),
    };
    try {
      const body = JSON.stringify(payload);
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/telemetry/track", body);
      } else {
        await fetch("/api/telemetry/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }
    } catch (err) {
      console.error("Telemetry flush failed, re-queueing", err);
      // re-queue
      eventQueueRef.current.unshift(...batch);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Persist user message (capture conversation id from server)
      try {
        const resp = await fetch(
          `/api/storefront/${companySlug}/widget/conversations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "user",
              content: userMessage.content,
            }),
          }
        );
        if (resp.ok) {
          const d = await resp.json();
          const convId = d?.conversationId;
          if (convId) {
            try {
              document.cookie = `widgetConversationId_${companySlug}=${convId}; Path=/; Max-Age=${
                60 * 60 * 24 * 30
              }`;
            } catch {
              // noop
            }
          }
        }
      } catch (e) {
        console.error("Failed to persist user message", e);
      }

      // Get AI response from existing chat endpoint
      const response = await fetch(`/api/storefront/${companySlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-5),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I'm having trouble right now.",
        timestamp: new Date().toISOString(),
      };

      // Persist assistant message
      await fetch(`/api/storefront/${companySlug}/widget/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "assistant",
          content: assistantMessage.content,
        }),
      });

      setMessages((prev) => [...prev, assistantMessage]);

      // Analytics: enqueue assistant response
      enqueueEvent({
        type: "chat_message_received",
        content: assistantMessage.content,
        role: "assistant",
      });

      // If server flagged a lead, enqueue lead_detected and include returned lead details
      if (data?.isLead) {
        enqueueEvent({
          type: "lead_detected",
          content: userMessage.content,
          lead: data.lead || null,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble responding right now. Please try again or contact us directly.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerStyle: React.CSSProperties | undefined = mountInside
    ? { position: "relative" }
    : undefined;
  const widgetPositionClass =
    config?.position === "bottom-left" ? "left-4" : "right-4";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute bottom-4 ${widgetPositionClass} z-50 rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
        style={{ backgroundColor: primaryColor, color: "white" }}
        aria-label="Open chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`absolute bottom-4 ${widgetPositionClass} z-50`}
    >
      <div
        className={cn(
          "flex flex-col bg-white rounded-2xl shadow-2xl transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 rounded-t-2xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-white/20">
              <AvatarFallback className="text-white text-sm">
                {(companyName || "").charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{companyName}</h3>
              <p className="text-xs opacity-90">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <Avatar
                      className="h-8 w-8"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <AvatarFallback style={{ color: primaryColor }}>
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                      msg.role === "user"
                        ? "text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar
                    className="h-8 w-8"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <AvatarFallback style={{ color: primaryColor }}>
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
