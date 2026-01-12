"use client";

import {
  Sparkles,
  Send,
  Loader2,
  Smartphone,
  Monitor,
  Save,
  Wand2,
  MessageSquare,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AiStorefrontRendererV2 } from "@/components/storefront/v2/ai-storefront-renderer-v2";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import { ContentWizard } from "@/components/storefront/content-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { mapAiSpecToThemeSections as mapAiSpecToThemeSectionsShared } from "@/lib/storefront/ai-spec-mapper";

import type { AiFrontstoreSpec } from "@/lib/ai/ai-storefront-types";
import type { ThemeSection } from "@/lib/storefront-themes";

export default function FrontstoreV2Page() {
  const [companyId, setCompanyId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content?: string }>
  >([]);
  const [previewSpec, setPreviewSpec] = useState<AiFrontstoreSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<boolean | null>(null);
  const [modelUsed, setModelUsed] = useState<boolean | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [diffs, setDiffs] = useState<Array<{
    action: string;
    summary: string;
  }> | null>(null);
  const [diffSummary, setDiffSummary] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"preview" | "diffs">(
    "preview"
  );
  const [themeSections, setThemeSections] = useState<ThemeSection[] | null>(
    null
  );

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
    if (!companyId) return toast.error("Please enter company ID");
    if (!prompt.trim()) return toast.error("Please enter a prompt");
    setLoading(true);
    try {
      const res = await fetch("/api/storefront/v2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Append user's message locally so chat shows immediate feedback
      setMessages((prev) => [...prev, { role: "user", content: prompt }]);
      setPrompt("");

      // Helper to parse SSE-style chunks
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
              // Replace AI chunk content (backend already accumulates)
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "ai") {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    content: parsed.text || "",
                  };
                  return updated;
                }
                return [...prev, { role: "ai", content: parsed.text }];
              });
            } else if (event === "assistant") {
              // Assistant clarifying question (non-spec)
              setMessages((prev) => [
                ...prev,
                { role: "ai", content: parsed.text },
              ]);
            } else if (event === "spec") {
              setPreviewSpec(parsed);
            } else if (event === "version") {
              if (parsed.versionId) {
                setVersionId(parsed.versionId);

                // fetch diffs for preview
                fetch("/api/storefront/v2/diffs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    companyId,
                    versionId: parsed.versionId,
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success) {
                      setDiffs(
                        (d.changes || []).map(
                          (c: { action: string; summary: string }) => ({
                            action: c.action,
                            summary: c.summary,
                          })
                        )
                      );
                      setDiffSummary(d.summary || null);
                      setPreviewMode("diffs");
                    }
                  })
                  .catch((e) => console.warn("Failed to fetch diffs", e));
              }
              if (parsed.conversationId)
                setConversationId(parsed.conversationId);
              if (typeof parsed.providerUsed === "boolean")
                setProviderUsed(Boolean(parsed.providerUsed));
              if (typeof parsed.modelUsed === "boolean")
                setModelUsed(Boolean(parsed.modelUsed));
            } else if (event === "done") {
              // noop
            }
          } catch (e) {
            // ignore parse errors
            console.warn("Failed to parse SSE data", e);
          }
        }
        buffer = parts[0] || "";
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        processChunk(chunk);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const continueConversation = async (text: string) => {
    if (!conversationId) return toast.error("Start a conversation first");
    setLoading(true);
    try {
      const res = await fetch("/api/storefront/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, conversationId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to chat");
      setMessages((prev) => [...prev, ...(data.messages || [])]);
      setPreviewSpec(data.previewSpec || null);
      if (data.versionId) {
        toast.success("New version: " + data.versionId);
        if (data.providerUsed === false) {
          toast.warning(
            "No global AI provider configured; using fallback spec."
          );
        } else if (data.providerUsed && data.modelUsed === false) {
          toast.warning(
            "AI provider present but model output invalid; using fallback spec."
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to continue conversation");
    } finally {
      setLoading(false);
    }
  };

  const runDryRunApply = async () => {
    if (!companyId || !versionId)
      return toast.error("No version available to apply");
    setLoading(true);
    try {
      const res = await fetch("/api/storefront/v2/apply-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, versionId, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dry-run failed");
      if (data.validation && !data.validation.valid) {
        toast.error("Validation failed: check console for details");
        console.warn("Validation errors:", data.validation.errors);
      }
      setDiffs(
        (data.changes || []).map((c: { action: string; summary: string }) => ({
          action: c.action,
          summary: c.summary,
        }))
      );
      setDiffSummary(data.summary || null);
      setPreviewMode("diffs");
      toast.success(
        "Dry-run complete. Review changes before confirming Apply."
      );
    } catch (e) {
      console.error(e);
      toast.error("Dry-run failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmApply = async () => {
    if (!companyId || !versionId)
      return toast.error("No version available to apply");

    const doApply = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/storefront/v2/apply-version", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, versionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Apply failed");
        toast.success("Version applied successfully");
      } catch (e) {
        console.error(e);
        toast.error("Apply failed");
      } finally {
        setLoading(false);
      }
    };

    toast("Confirm apply this version to the live storefront?", {
      action: { label: "Apply", onClick: () => doApply() },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const exportAndSaveDraft = async () => {
    if (!companyId) return toast.error("No companyId");
    if (!versionId) return toast.error("No version to export");

    const doExport = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/storefront/v2/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, versionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Export failed");
        toast.success("Exported and saved draft to company store metadata");
      } catch (e) {
        console.error(e);
        toast.error("Export failed");
      } finally {
        setLoading(false);
      }
    };

    toast(
      "Export AI-generated sections to Content Wizard and save as draft? This will update company store metadata.",
      {
        action: { label: "Export", onClick: () => doExport() },
        cancel: { label: "Cancel", onClick: () => {} },
      }
    );
  };

  const mapAiSpecToThemeSections = mapAiSpecToThemeSectionsShared;

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Chat Builder (v2) - MVP
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Company</label>
            {companies.length > 0 ? (
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full border rounded p-2"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Enter company ID"
              />
            )}

            <Separator className="my-4" />
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Describe your ideal storefront design..."
              className="w-full border rounded p-2"
            />

            <Button disabled={loading} onClick={send} className="mt-3 w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Preview
                </>
              )}
            </Button>

            <div className="mt-4">
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </h3>
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-3 mt-2">
                  {messages.length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center dark:text-gray-200">
                      <p className="text-sm">
                        👋 Start by entering your Company ID and describing what
                        kind of design you&apos;d like!
                      </p>
                      <p className="text-xs mt-1">
                        The AI will ask clarifying questions and help you create
                        the perfect storefront.
                      </p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        m.role === "user"
                          ? "bg-blue-50 border border-blue-200 ml-8"
                          : "bg-purple-50 border border-purple-200 mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {m.role === "user" ? "👤" : "🤖"}
                        </span>
                        <strong className="text-sm font-semibold capitalize">
                          {m.role === "user" ? "You" : "AI Designer"}
                        </strong>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-amber-900 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Quick Suggestions
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "Make it more bold and dramatic",
                    "Switch to a minimal luxury style",
                    "Emphasize our products more",
                    "Add more testimonials",
                    "Use warmer, friendlier colors",
                  ].map((t) => (
                    <button
                      key={t}
                      className="px-3 py-1 bg-white border border-amber-300 hover:border-amber-400 rounded-md text-xs transition-colors"
                      onClick={() => continueConversation(t)}
                      disabled={!conversationId || loading}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="mt-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!previewSpec)
                      return toast.error("Generate a preview first");
                    const mapped = mapAiSpecToThemeSections(
                      previewSpec,
                      "default"
                    );
                    if (!mapped)
                      return toast.error(
                        "Unable to map spec to theme sections"
                      );
                    setThemeSections(mapped);
                    toast(
                      "Also persist these sections to company store metadata now?",
                      {
                        action: {
                          label: "Persist",
                          onClick: () => {
                            // attempt server-side save (best-effort)
                            fetch("/api/storefront/v2/export", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                companyId,
                                sections: mapped,
                              }),
                            })
                              .then((r) => r.json())
                              .then((d) => {
                                if (d.success)
                                  toast.success(
                                    "Exported to company store metadata"
                                  );
                                else
                                  toast.success(
                                    "Export succeeded (client-side only)"
                                  );
                              })
                              .catch((e) => {
                                console.warn("Export failed", e);
                                toast.error(
                                  "Export failed; content is available locally in Content Wizard"
                                );
                              });
                          },
                        },
                        cancel: {
                          label: "Skip",
                          onClick: () =>
                            toast(
                              "AI content exported to Content Wizard. Edit below and click Save Draft."
                            ),
                        },
                      }
                    );
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Export to Content Wizard
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Live Preview</h3>
              <div className="flex gap-2">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              className={`border rounded p-3 mt-2 min-h-[400px] bg-muted/10 transition-all ${
                previewDevice === "mobile" ? "max-w-md mx-auto" : ""
              }`}
            >
              {previewSpec ? (
                previewMode === "preview" ? (
                  <AiStorefrontRendererV2
                    spec={previewSpec}
                    slug={companyId}
                    companyName={companyId}
                  />
                ) : (
                  <AiStorefrontRenderer
                    spec={previewSpec}
                    slug={companyId}
                    companyName={companyId}
                    enableCart={false}
                  />
                )
              ) : (
                <div className="text-sm dark:text-gray-200">
                  No preview yet. Generate a preview to see live rendering here.
                </div>
              )}
              {/* Diffs & apply controls */}
              {diffSummary && (
                <div className="mt-4 border rounded p-3 bg-white">
                  <h3 className="font-medium mb-2">Proposed changes</h3>
                  <div className="text-sm dark:text-gray-200 mb-2">
                    {diffSummary}
                  </div>
                  <div className="text-xs dark:text-gray-200 mb-2">
                    {providerUsed !== null && (
                      <span className="mr-3">
                        Provider config used: {providerUsed ? "yes" : "no"}
                      </span>
                    )}
                    {modelUsed !== null && (
                      <span>Remote model used: {modelUsed ? "yes" : "no"}</span>
                    )}
                  </div>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    {diffs?.map((d, i) => (
                      <li key={i} className="text-sm">
                        {d.summary}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={runDryRunApply}
                      disabled={loading}
                    >
                      Apply (dry-run)
                    </Button>
                    <Button onClick={confirmApply} disabled={loading}>
                      Confirm Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportAndSaveDraft}
                      disabled={loading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Export & Save Draft
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {themeSections && (
              <div className="mt-4 border rounded p-3 bg-white">
                <h3 className="font-medium mb-2">
                  Content Wizard (Edit AI output)
                </h3>
                <ContentWizard
                  themeId="default"
                  initialSections={themeSections}
                  onContentChange={(sections) => setThemeSections(sections)}
                  onSave={async () => {
                    if (!companyId || !themeSections) return;
                    try {
                      const response = await fetch("/api/storefront/v2/specs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          companyId,
                          spec: {
                            version: 1,
                            meta: previewSpec?.meta || {},
                            sections: themeSections,
                          },
                          title: "AI Draft",
                          apply: false,
                        }),
                      });
                      const data = await response.json();
                      if (!response.ok)
                        throw new Error(data.error || "Failed to save draft");
                      toast.success("Draft saved as version " + data.versionId);
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to save draft");
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
