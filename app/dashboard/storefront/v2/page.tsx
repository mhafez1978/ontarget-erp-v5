"use client";

import React, { useState } from "react";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import type {
  AiFrontstoreSpec,
  AiFrontstoreSection,
} from "@/lib/ai/ai-storefront-types";
import { ContentWizard } from "@/components/storefront/content-wizard";
import { defaultThemes, type ThemeSection } from "@/lib/storefront-themes";

export default function FrontstoreV2Page() {
  const [companyId, setCompanyId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content?: string }>
  >([]);
  const [previewSpec, setPreviewSpec] = useState<AiFrontstoreSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [themeSections, setThemeSections] = useState<ThemeSection[] | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const send = async () => {
    if (!companyId || !prompt) return;
    setLoading(true);
    try {
      // Use streaming endpoint for better UX
      const res = await fetch("/api/storefront/v2/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, message: prompt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "unknown" }));
        throw new Error(err.error || "Failed to stream chat");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            if (line.startsWith("event:")) event = line.replace("event:", "").trim();
            if (line.startsWith("data:")) data += line.replace("data:", "").trim();
          }

          try {
            const parsed = JSON.parse(data);
            if (event === "ai.chunk") {
              // Append AI chunk to messages
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "ai") {
                  const updated = [...prev.slice(0, -1), { role: "ai", content: parsed.text }];
                  return updated;
                }
                return [...prev, { role: "ai", content: parsed.text }];
              });
            } else if (event === "spec") {
              setPreviewSpec(parsed);
            } else if (event === "version") {
              if (parsed.versionId) alert("Preview saved as version " + parsed.versionId);
              if (parsed.conversationId) setConversationId(parsed.conversationId);
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
      alert("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const continueConversation = async (text: string) => {
    if (!conversationId) return alert("Start a conversation first");
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
      if (data.versionId) alert("New version: " + data.versionId);
    } catch (err) {
      console.error(err);
      alert("Failed to continue conversation");
    } finally {
      setLoading(false);
    }
  };

  // Minimal mapper: map AiFrontstoreSpec to ThemeSection[] (subset of full mapping from dashboard)
  const mapAiSpecToThemeSections = (
    spec: AiFrontstoreSpec,
    themeId: string
  ): ThemeSection[] | null => {
    const theme = defaultThemes.find((t) => t.id === themeId);
    if (!theme) return null;

    const cloneSections: ThemeSection[] = theme.sections.map((section) => ({
      ...section,
      content: { ...section.content },
    }));

    const findAiSection = (type: AiFrontstoreSection["type"]) =>
      spec.sections.find((s) => s.type === type);

    const aiHero = findAiSection("hero");
    if (aiHero) {
      const heroThemeSection = cloneSections.find((s) => s.type === "hero");
      if (heroThemeSection) {
        const heroContent = aiHero.content as Record<string, unknown>;
        heroThemeSection.content = {
          ...heroThemeSection.content,
          heading:
            (heroContent.title as string) ||
            (heroThemeSection.content.heading as string),
          subheading:
            (heroContent.subtitle as string) ||
            (heroThemeSection.content.subheading as string),
          description:
            (heroContent.description as string) ||
            (heroThemeSection.content.description as string),
        };
      }
    }

    const aiProducts = findAiSection("product-grid");
    if (aiProducts) {
      const productsThemeSection = cloneSections.find(
        (s) => s.type === "featured-products"
      );
      if (productsThemeSection) {
        const productContent = aiProducts.content as Record<string, unknown>;
        productsThemeSection.content = {
          ...productsThemeSection.content,
          heading:
            (productContent.heading as string) ||
            (productsThemeSection.content.heading as string),
          description:
            (productContent.subheading as string) ||
            (productsThemeSection.content.description as string),
        };
      }
    }

    const aiTestimonials = findAiSection("testimonials");
    if (aiTestimonials) {
      const socialProofSection = cloneSections.find(
        (s) => s.type === "social-proof"
      );
      if (socialProofSection) {
        const testimonialContent = aiTestimonials.content as Record<
          string,
          unknown
        >;
        socialProofSection.content = {
          ...socialProofSection.content,
          heading:
            (testimonialContent.heading as string) ||
            (socialProofSection.content.heading as string),
          description:
            (testimonialContent.subheading as string) ||
            (socialProofSection.content.description as string),
        };
      }
    }

    return cloneSections;
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Chat Builder (v2) - MVP</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm">Company ID</label>
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full border rounded p-2"
          />

          <label className="block text-sm mt-3">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full border rounded p-2"
          />

          <button
            disabled={loading}
            onClick={send}
            className="mt-3 px-4 py-2 bg-primary text-white rounded"
          >
            {loading ? "Generating..." : "Generate Preview"}
          </button>

          <div className="mt-4">
            <h3 className="font-medium">Messages</h3>
            <div className="space-y-2 mt-2">
              {messages.map((m, i) => (
                <div key={i} className="p-2 border rounded bg-white">
                  <strong className="capitalize">{m.role}</strong>
                  <div className="text-sm">{m.content}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-medium mb-2">Quick Prompts</h4>
              <div className="flex gap-2 flex-wrap">
                {[
                  "Make the hero bolder",
                  "Emphasize products",
                  "Show testimonials more prominently",
                  "Use a more playful tone",
                  "Make CTAs more prominent",
                ].map((t) => (
                  <button
                    key={t}
                    className="px-2 py-1 border rounded text-xs"
                    onClick={() => continueConversation(t)}
                    disabled={!conversationId}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <button
                className="px-3 py-2 border rounded text-sm"
                onClick={() => {
                  if (!previewSpec) return alert("Generate a preview first");
                  const mapped = mapAiSpecToThemeSections(
                    previewSpec,
                    "default"
                  );
                  if (!mapped)
                    return alert("Unable to map spec to theme sections");
                  setThemeSections(mapped);
                  alert(
                    "AI content exported to Content Wizard. Edit below and click Save Draft."
                  );
                }}
              >
                Export to Content Wizard
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <h3 className="font-medium">Live Preview</h3>
          <div className="border rounded p-3 mt-2 min-h-[400px] bg-muted/10">
            {previewSpec ? (
              <AiStorefrontRenderer
                spec={previewSpec as any}
                slug={companyId}
                companyName={companyId}
                enableCart={false}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No preview yet. Generate a preview to see live rendering here.
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
                    alert("Draft saved as version " + data.versionId);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to save draft");
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
