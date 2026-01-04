"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  phase: string;
}

interface V4Conversation {
  id: string;
  companyId: string;
  userId: string;
  phase: string;
  messages: Message[];
  preferences: {
    heroStyle?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontPairing?: string;
    sections?: Record<string, boolean>;
  };
  isComplete: boolean;
}

interface V4ChatInterfaceProps {
  companyId: string;
  onComplete?: (conversation: V4Conversation) => void;
}

export function V4ChatInterface({
  companyId,
  onComplete,
}: V4ChatInterfaceProps) {
  const [conversation, setConversation] = useState<V4Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const startConversation = async () => {
    setIsStarting(true);
    try {
      const response = await fetch("/api/storefront/v4/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start conversation");
      }

      const data = await response.json();
      setConversation(data.conversation);
      toast.success("Conversation started! Let's design your website.");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start conversation"
      );
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversation) return;

    const userMessage = message;
    setMessage("");

    // Immediately add user message to conversation with unique temp ID
    const tempId = `temp-user-${Date.now()}-${Math.random()}`;
    const userMsg: Message = {
      id: tempId,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
      phase: conversation.phase,
    };

    setConversation({
      ...conversation,
      messages: [...conversation.messages, userMsg],
    });

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/storefront/v4/conversations/${conversation.id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();
      // API returns all messages, so replace entire conversation
      // Replace conversation with the updated version from server
      // Also detect if assistant signaled the start of the build (e.g., "Starting the build process")
      const updatedConversation = data.conversation;
      setConversation(updatedConversation);

      // Detect assistant message that indicates it's starting the build
      const lastAssistant = [...(updatedConversation.messages || [])]
        .reverse()
        .find((m) => m.role === "assistant");
      const buildSignal =
        lastAssistant &&
        /\b(start(ing)? the build|switching to build mode|build process)\b/i.test(
          lastAssistant.content
        );

      if ((data.isComplete || buildSignal) && onComplete) {
        // If assistant signaled build start but the server didn't mark complete, mark locally as complete for generation trigger
        const conversationToComplete =
          buildSignal && !data.isComplete
            ? { ...updatedConversation, isComplete: true }
            : updatedConversation;
        setConversation(conversationToComplete);
        onComplete(conversationToComplete as V4Conversation);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
      // On error, remove the temporary message
      setConversation({
        ...conversation,
        messages: conversation.messages.filter((m) => m.id !== tempId),
      });
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

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      greeting: "Getting Started",
      "understanding-business": "Understanding Business",
      "design-style": "Design Style",
      "hero-preferences": "Hero Section",
      "color-selection": "Colors",
      typography: "Typography",
      "layout-preferences": "Layout",
      "final-confirmation": "Confirmation",
      complete: "Complete",
    };
    return labels[phase] || phase;
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">AI Storefront V4</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Have a conversation with AI to design a unique website tailored
                to your company. The AI will guide you through choosing hero
                styles, colors, fonts, and layout preferences.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Interactive design conversation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Generates unique TSX components
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  WCAG AA accessible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  SEO optimized
                </li>
              </ul>
            </div>
            <Button
              onClick={startConversation}
              disabled={isStarting}
              size="lg"
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Conversation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] border rounded-lg">
      {/* Header */}
      <div className="border-b p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI Design Assistant</h3>
              <Badge variant="outline" className="text-xs">
                {getPhaseLabel(conversation.phase)}
              </Badge>
            </div>
          </div>
          {conversation.phase === "complete" && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready to Generate
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {msg.role === "user" ? "U" : "AI"}
              </AvatarFallback>
            </Avatar>
            <div
              className={`flex-1 max-w-[80%] ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="bg-muted p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation.phase !== "complete" && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !message.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
