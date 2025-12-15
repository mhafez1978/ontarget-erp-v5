"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AiStorefrontRendererV2 } from "@/components/storefront/v2/ai-storefront-renderer-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Loader2,
  Smartphone,
  Monitor,
  Save,
  Wand2,
  MessageSquare,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  Palette,
  Type,
  Layout,
  Zap,
  Download,
  RefreshCw,
  Star,
  TrendingUp,
  Edit,
  FileEdit,
} from "lucide-react";
import type { AiFrontstoreSpec } from "@/lib/ai/ai-storefront-types";
import { motion, AnimatePresence } from "framer-motion";

const STARTER_PROMPTS = [
  {
    icon: Zap,
    label: "Bold Tech Startup",
    prompt:
      "Create a bold, modern tech startup website with vibrant gradients, video background in hero, and dynamic animations",
  },
  {
    icon: Palette,
    label: "Minimalist Portfolio",
    prompt:
      "Design a clean, minimalist portfolio site with elegant typography, generous whitespace, and subtle hover effects",
  },
  {
    icon: TrendingUp,
    label: "SaaS Product",
    prompt:
      "Build a professional SaaS product landing page with bento grid features, glassmorphism cards, and trust badges",
  },
  {
    icon: Star,
    label: "Creative Agency",
    prompt:
      "Make a creative agency website with bold colors, playful animations, brutalist design elements, and portfolio showcase",
  },
];

export default function FrontstoreV2Page() {
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content?: string }>
  >([]);
  const [previewSpec, setPreviewSpec] = useState<AiFrontstoreSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokensRemaining, setTokensRemaining] = useState(1000000);
  const [tokenLimit] = useState(1000000);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication and V2 access
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.authenticated || !data.user) {
          window.location.href = "/login";
          return;
        }

        // Check V2 access: Growth, Enterprise, or SUPER_ADMIN
        const allowedPlans = ["GROWTH", "ENTERPRISE", "SUPER_USER"];
        const isSuperAdmin = data.user.role === "SUPER_ADMIN";
        const hasV2Access =
          isSuperAdmin || allowedPlans.includes(data.user.plan);

        if (!hasV2Access) {
          setAuthError(
            "AI Storefront V2 is only available for Growth, Enterprise, or Super Admin plans. Please upgrade your plan or use V1."
          );
        }

        setAuthChecking(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user's companies
  useEffect(() => {
    fetch("/api/companies/my-owned")
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies);
          if (data.companies.length > 0 && !companyId) {
            setCompanyId(data.companies[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load companies:", err));
  }, [companyId]);

  const send = async () => {
    if (!companyId || !prompt.trim()) {
      toast.error("Please select a company and enter a message");
      return;
    }

    setLoading(true);
    setGenerationProgress(0);
    const userMessage = prompt.trim();
    setPrompt("");

    try {
      const res = await fetch("/api/storefront/v2/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          message: userMessage,
          conversationId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "unknown" }));
        throw new Error(err.error || "Failed to stream chat");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Estimate tokens for this request (rough: 1 token ≈ 4 characters)
      const estimatedInputTokens = Math.ceil(userMessage.length / 4);
      let estimatedOutputTokens = 0;

      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      const processChunk = (chunk: string) => {
        buffer += chunk;
        const parts = buffer.split("\n\n");

        while (parts.length > 1) {
          const rawEvent = parts.shift();
          if (!rawEvent) continue;

          const lines = rawEvent.split("\n");
          let event = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:"))
              event = line.replace("event:", "").trim();
            if (line.startsWith("data:"))
              data += line.replace("data:", "").trim();
          }

          try {
            const parsed = JSON.parse(data);

            if (event === "ai.chunk") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "ai") {
                  // Estimate output tokens as text streams in
                  const newContent = parsed.text || "";
                  estimatedOutputTokens += Math.ceil(newContent.length / 4);

                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    content: newContent,
                  };
                  return updated;
                }
                return [...prev, { role: "ai", content: parsed.text }];
              });
              // Update progress as text streams in
              setGenerationProgress((prev) => Math.min(prev + 5, 60));
            } else if (event === "spec") {
              setPreviewSpec(parsed);
              setGenerationProgress(100);

              // Final token count update when generation completes
              const totalTokens = estimatedInputTokens + estimatedOutputTokens;
              setTokensUsed((prev) => {
                const newUsed = prev + totalTokens;
                setTokensRemaining(tokenLimit - newUsed);
                return newUsed;
              });
            } else if (event === "version") {
              if (parsed.versionId) setVersionId(parsed.versionId);
              if (parsed.conversationId)
                setConversationId(parsed.conversationId);
              if (parsed.providerUsed)
                setProviderUsed(String(parsed.providerUsed));
              if (parsed.modelUsed) setModelUsed(String(parsed.modelUsed));
            }
          } catch (e) {
            console.warn("Failed to parse SSE data", e);
          }
        }
        buffer = parts[0] || "";
      };

      // Read stream chunks
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          processChunk(chunk);
        }
      } catch (streamErr) {
        console.error("Stream reading error:", streamErr);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate preview");
    } finally {
      setLoading(false);
      setGenerationProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleStarterPrompt = (promptText: string) => {
    setPrompt(promptText);
    // Auto-send after a short delay to show the prompt was set
    setTimeout(() => {
      if (companyId) {
        send();
      }
    }, 100);
  };

  const handleReset = () => {
    if (
      confirm("Start a new conversation? This will clear the current design.")
    ) {
      setMessages([]);
      setPreviewSpec(null);
      setConversationId(null);
      setVersionId(null);
      setPrompt("");
      toast.success("Ready for a new design");
    }
  };

  const handleExportToContentWizard = async () => {
    if (!previewSpec || !companyId) {
      toast.error("No design to export");
      return;
    }

    try {
      // Save the spec to company's AI storefront config
      const response = await fetch("/api/ai-storefront/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          spec: previewSpec,
          enabled: false, // Don't auto-enable, just save for editing
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save design");
      }

      toast.success("Design exported! Opening Content Wizard...");

      // Navigate to storefront page with content tab active
      window.location.href = `/dashboard/storefront?tab=content&company=${companyId}`;
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export design");
    }
  };

  return (
    <div className="w-full h-screen">
      {authChecking ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </div>
      ) : authError ? (
        <div className="h-full flex items-center justify-center">
          <Card className="max-w-md p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground mb-4">{authError}</p>
              <Button
                onClick={() => (window.location.href = "/dashboard/storefront")}
              >
                Go to V1 Storefront
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b bg-gradient-to-r from-card/80 via-card/50 to-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    AI Storefront Builder V2
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Create stunning websites with conversational AI
                    {providerUsed && ` • ${providerUsed}`}
                    {modelUsed && ` • ${modelUsed}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Token Counter */}
                <Card className="px-4 py-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Tokens
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-bold text-foreground">
                          {tokensRemaining.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          left
                        </span>
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">
                        Used
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {tokensUsed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(tokensUsed / tokenLimit) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </Card>

                {conversationId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Design
                  </Button>
                )}
                {providerUsed && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <Wand2 className="w-3.5 h-3.5" />
                    {providerUsed}
                  </Badge>
                )}
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors font-medium"
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Content - Split Screen */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Chat */}
            <div
              className={`${
                fullscreen ? "w-0 opacity-0" : "w-[420px]"
              } border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
            >
              {!fullscreen && (
                <>
                  <div className="p-5 border-b bg-gradient-to-br from-muted/50 to-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Design Chat</h2>
                      </div>
                      {messages.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {messages.length} messages
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe your vision, iterate on designs
                    </p>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="space-y-4">
                          <Card className="p-8 text-center border-dashed">
                            <div className="relative mb-4">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
                              </div>
                              <Sparkles className="w-12 h-12 mx-auto text-primary relative" />
                            </div>
                            <h3 className="font-semibold mb-2 text-lg">
                              Let's Build Something Amazing
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                              Choose a starter template or describe your vision
                            </p>
                          </Card>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground px-2">
                              QUICK START
                            </p>
                            {STARTER_PROMPTS.map((starter, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-3 px-4 hover:bg-accent/50 hover:border-primary/20 transition-all group"
                                onClick={() =>
                                  handleStarterPrompt(starter.prompt)
                                }
                                disabled={!companyId}
                              >
                                <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                  <starter.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-sm">
                                    {starter.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {starter.prompt}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay: i * 0.05,
                            ease: "easeOut",
                          }}
                          className={`flex ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted border"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          </motion.div>
                        </motion.div>
                      ))}

                      <AnimatePresence>
                        {loading &&
                          messages[messages.length - 1]?.role === "user" && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex justify-start"
                            >
                              <div className="bg-muted border rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <svg
                                      className="w-8 h-8"
                                      viewBox="0 0 36 36"
                                    >
                                      <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        className="stroke-muted"
                                        strokeWidth="2"
                                      />
                                      <motion.circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="none"
                                        className="stroke-primary"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{
                                          pathLength: generationProgress / 100,
                                        }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                          strokeDasharray: "100 100",
                                          rotate: -90,
                                          transformOrigin: "center",
                                        }}
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                                      {generationProgress}%
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                      <span className="text-sm font-medium">
                                        Creating your design
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      <motion.span
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          delay: 0,
                                        }}
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                      />
                                      <motion.span
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          delay: 0.2,
                                        }}
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                      />
                                      <motion.span
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          delay: 0.4,
                                        }}
                                        className="w-1.5 h-1.5 rounded-full bg-primary"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                      </AnimatePresence>

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex gap-2">
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        placeholder={
                          messages.length === 0
                            ? "Describe your ideal website..."
                            : "Ask for changes or iterations..."
                        }
                        disabled={loading}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={send}
                        disabled={loading || !companyId || !prompt.trim()}
                        className="h-[44px] px-4 shadow-lg shadow-primary/20"
                        size="lg"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    {versionId && (
                      <div className="flex items-center gap-2 mt-3 px-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>Design generated</span>
                        </div>
                        <div className="text-xs text-muted-foreground">•</div>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {versionId.slice(0, 8)}
                        </code>
                      </div>
                    )}
                    {!companyId && (
                      <div className="flex items-center gap-2 mt-3 px-1">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground">
                          Select a company to get started
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-muted/5 via-background to-muted/5">
              <div className="flex items-center justify-between px-6 py-3.5 border-b bg-card/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary" />
                    Live Preview
                  </h3>
                  {previewSpec && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 animate-in fade-in"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Ready
                    </Badge>
                  )}
                  {loading && (
                    <Badge variant="outline" className="gap-1.5 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Rendering
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {previewSpec && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToContentWizard}
                        className="gap-2"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          Edit in Content Wizard
                        </span>
                      </Button>

                      <Separator orientation="vertical" className="h-6" />
                    </>
                  )}

                  <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-background/50">
                    <Button
                      variant={
                        previewDevice === "desktop" ? "secondary" : "ghost"
                      }
                      size="sm"
                      onClick={() => setPreviewDevice("desktop")}
                      className="gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="text-xs font-medium">Desktop</span>
                    </Button>
                    <Button
                      variant={
                        previewDevice === "mobile" ? "secondary" : "ghost"
                      }
                      size="sm"
                      onClick={() => setPreviewDevice("mobile")}
                      className="gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-xs font-medium">Mobile</span>
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFullscreen(!fullscreen)}
                    className="gap-2"
                  >
                    {fullscreen ? (
                      <>
                        <Minimize2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Exit</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Focus</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="min-h-full flex items-center justify-center p-8">
                  {!previewSpec ? (
                    <Card className="p-16 text-center max-w-lg border-dashed">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 bg-muted rounded-full blur-3xl opacity-50" />
                        </div>
                        <AlertCircle className="w-20 h-20 mx-auto text-muted-foreground/50 relative" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Ready to Create
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        Start a conversation in the chat panel to generate your
                        AI-powered storefront. Choose a quick start template or
                        describe your vision.
                      </p>
                      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Custom Typography
                        </div>
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Rich Colors
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Animations
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div
                      className={`transition-all duration-500 ease-out ${
                        previewDevice === "mobile"
                          ? "max-w-[375px]"
                          : "w-full max-w-[1440px]"
                      }`}
                    >
                      <div
                        className={`bg-white shadow-2xl rounded-lg overflow-hidden border transition-all duration-500 ${
                          previewDevice === "mobile"
                            ? "shadow-xl"
                            : "shadow-2xl"
                        }`}
                        style={{
                          transform:
                            previewDevice === "mobile"
                              ? "scale(0.95)"
                              : "scale(1)",
                        }}
                      >
                        <AiStorefrontRendererV2
                          spec={previewSpec}
                          slug="preview"
                          companyName={
                            companies.find((c) => c.id === companyId)?.name ||
                            "Company"
                          }
                          companyId={companyId}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
