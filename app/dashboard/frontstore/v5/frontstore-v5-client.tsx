"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Variant } from "@/lib/frontstore/v5-types";
import ChatPanel from "./chat-panel";
import VariantsPanel from "./variants-panel";
import LivePreviewPanel from "./live-preview";

type PageMeta = { id: string; title: string; slug?: string };

export default function FrontstoreV5Client({
  companyId,
  renderPageSelector,
  pageSelectorPortal,
}: {
  companyId: string;
  renderPageSelector?: (args: {
    pages: PageMeta[];
    activePageId: string | null;
    setActivePageId: (id: string | null) => void;
  }) => React.ReactNode;
  pageSelectorPortal?: (node: React.ReactNode) => void;
}) {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [queueMap, setQueueMap] = useState<Record<string, Variant[]>>({});
  const [generatedGroups, setGeneratedGroups] = useState<Variant[][]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Load current user from session (non-blocking)
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          setUserName(d?.user?.name || d?.user?.email || null);
        }
      } catch (err) {
        console.warn("Failed to load user", err);
      }
    })();

    // load initial pages for company (stub for now)
    (async () => {
      try {
        const res = await fetch(
          `/api/v5/frontstore/pages?companyId=${companyId}`
        );
        if (res.ok) {
          const json = await res.json();
          const normalized: PageMeta[] = (json.pages || []).map(
            (p: { id: string; title: string; slug?: string }) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
            })
          );
          setPages(normalized);
          if (normalized.length > 0) setActivePageId(normalized[0].id);
        }
      } catch (e) {
        console.warn("Failed to load pages", e);
      }
    })();
  }, [companyId]);

  const activeQueue = useMemo(() => {
    if (!activePageId) return [] as Variant[];
    return queueMap[activePageId] || [];
  }, [activePageId, queueMap]);

  function handleCreatePage(p: PageMeta) {
    setPages((s) => [...s, p]);
    setActivePageId(p.id);
    setQueueMap((prev) => ({ ...prev, [p.id]: prev[p.id] || [] }));
  }

  function addVariantToQueue(pageId: string, variant: Variant) {
    setQueueMap((prev) => {
      const next = { ...prev };
      next[pageId] = [...(next[pageId] || []), variant];
      return next;
    });
  }

  async function saveDraft(pageId: string) {
    const page = pages.find((p) => p.id === pageId);
    const variants = queueMap[pageId] || [];
    try {
      await fetch(`/api/v5/frontstore/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page?.title,
          slug: page?.slug,
          variants,
        }),
      });
      toast.success("Draft saved");
    } catch (e) {
      console.warn("Failed to save draft", e);
      toast.error("Save draft failed");
    }
  }

  const pageSelector = useMemo(() => {
    if (renderPageSelector) {
      return renderPageSelector({ pages, activePageId, setActivePageId });
    }

    return (
      <div className="flex w-full items-center gap-2 justify-end">
        <span className="text-sm dark:text-gray-200">Page</span>
        <select
          className="block w-full max-w-xs rounded border border-slate-200 px-3 py-2 text-sm"
          value={activePageId ?? ""}
          onChange={(e) => setActivePageId(e.target.value || null)}
        >
          <option value="" disabled>
            Select a page
          </option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
    );
  }, [renderPageSelector, pages, activePageId]);

  useEffect(() => {
    if (pageSelectorPortal) {
      pageSelectorPortal(pageSelector);
    }
    return () => {
      if (pageSelectorPortal) {
        pageSelectorPortal(null);
      }
    };
  }, [pageSelector, pageSelectorPortal]);

  const shouldRenderInline = !pageSelectorPortal;

  return (
    <div className="flex flex-col gap-8 space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          V5 Storefront Engine. Personas AI Agents.
        </h2>
        <p className="dark:text-gray-200">
          Welcome back, {userName || "Admin"}! Manage your company customers
          here.
        </p>
      </div>
      {shouldRenderInline ? pageSelector : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <ChatPanel
            pages={pages}
            activePage={activePageId}
            onChangeActivePage={(pageId) => setActivePageId(pageId)}
            onCreatePage={handleCreatePage}
            onGenerateVariants={async (pageId, kind, prompt, count = 4) => {
              // returns variants grouped by request (array of arrays)
              try {
                const promises = Array.from({ length: count }).map(async () => {
                  const resp = await fetch(
                    `/api/v5/frontstore/conductor/generate`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pageId, prompt, kind }),
                    }
                  );

                  if (!resp.ok) {
                    console.error(
                      "[v5 generate] failed",
                      resp.status,
                      resp.statusText
                    );
                    toast.error("Generation failed");
                    return [] as Variant[];
                  }
                  const text = await resp.text();
                  const m = text.match(/data: (\{[\s\S]*?\})/);
                  if (!m) return [] as Variant[];
                  try {
                    const payload = JSON.parse(m[1]);
                    const variants = payload?.variants || [];
                    return variants as Variant[];
                  } catch {
                    return [] as Variant[];
                  }
                });

                const resolved = await Promise.all(promises);
                // Update shared generated groups state so VariantsPanel can show them
                setGeneratedGroups(resolved);
                return resolved;
              } catch (err) {
                console.error("[v5 generate] error", err);
                toast.error("Generation failed");
                return [] as Variant[][];
              }
            }}
            onGenerated={(groups) => setGeneratedGroups(groups)}
          />
        </div>

        {/* Variants panel (shows generated variations) */}
        <div className="lg:col-span-4">
          <div className="sticky top-16">
            <VariantsPanel
              groups={generatedGroups}
              onLikeVariant={(v: Variant) => {
                if (!activePageId) return;
                addVariantToQueue(activePageId, v);
              }}
              onRegenerateVariant={async (kind: string, prompt: string) => {
                // re-run generation for the active page with same kind/prompt
                if (!activePageId) return;
                try {
                  const groups = await (async () => {
                    const promises = Array.from({ length: 4 }).map(async () => {
                      const resp = await fetch(
                        `/api/v5/frontstore/conductor/generate`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            pageId: activePageId,
                            prompt,
                            kind,
                          }),
                        }
                      );
                      if (!resp.ok) {
                        console.error(
                          "[v5 regenerate] failed",
                          resp.status,
                          resp.statusText
                        );
                        toast.error("Regeneration failed");
                        return [] as Variant[];
                      }
                      const text = await resp.text();
                      const m = text.match(/data: (\{[\s\S]*?\})/);
                      if (!m) return [] as Variant[];
                      try {
                        const payload = JSON.parse(m[1]);
                        return (payload?.variants || []) as Variant[];
                      } catch {
                        return [] as Variant[];
                      }
                    });
                    return Promise.all(promises);
                  })();

                  setGeneratedGroups(groups);
                } catch (err) {
                  console.error("[v5 regenerate] error", err);
                  toast.error("Regeneration failed");
                }
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <LivePreviewPanel
            pages={pages}
            activePageId={activePageId}
            queue={activeQueue}
            onSaveDraft={async (pageId) => {
              await saveDraft(pageId);
            }}
            onSavePublish={async (pageId) => {
              const res = await fetch(
                `/api/v5/frontstore/pages/${pageId}/publish`,
                { method: "POST" }
              );
              if (res.ok) {
                toast.success("Published!");
              } else {
                toast.error("Publish failed");
              }
            }}
            onUpdateQueue={(pageId, newQueue) =>
              setQueueMap((prev) => ({ ...prev, [pageId]: newQueue }))
            }
            // Drop handler from drag & drop
            onDropVariant={async (variant, targetIndex) => {
              if (!activePageId) return;
              setQueueMap((prev) => {
                const next = { ...prev };
                const arr = [...(next[activePageId] || [])];
                if (typeof targetIndex === "number")
                  arr.splice(targetIndex, 0, variant);
                else arr.push(variant);
                next[activePageId] = arr;
                return next;
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
