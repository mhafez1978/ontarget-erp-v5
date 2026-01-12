"use client";

import React from "react";
import { Save, Rocket } from "lucide-react";
import { toast } from "sonner";
import type { Variant, Asset } from "@/lib/frontstore/v5-types";

// Use the canonical Asset type defined in lib/frontstore/v5-types.ts
// (Asset is string | { url, alt?, provider?, attribution?: { userName?, userUrl?, imagePage? } | null })

export default function LivePreviewPanel({
  pages,
  activePageId,
  queue,
  onSaveDraft,
  onSavePublish,
  onUpdateQueue,
  onDropVariant,
}: {
  pages: Array<{ id: string; title: string }>;
  activePageId: string | null;
  queue: Variant[];
  onSaveDraft: (pageId: string) => Promise<void>;
  onSavePublish: (pageId: string) => Promise<void>;
  onUpdateQueue: (pageId: string, queue: Variant[]) => void;
  // optional drop handler for variants dragged from VariantsPanel
  onDropVariant?: (variant: Variant, targetIndex?: number) => void;
}) {
  const activePage = pages.find((p) => p.id === activePageId);

  function updateVariantSchema(
    variantId: Variant["variantId"],
    updates: Partial<Variant["schema"]>
  ) {
    if (!activePageId) return;
    onUpdateQueue(
      activePageId,
      queue.map((v) =>
        v.variantId === variantId
          ? { ...v, schema: { ...(v.schema || {}), ...updates } }
          : v
      )
    );
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!activePageId) return;
    try {
      const txt = e.dataTransfer?.getData("application/json");
      if (!txt) return;
      const variant = JSON.parse(txt) as Variant;
      // default append
      onDropVariant?.(variant);
      // feedback for the user
      console.debug("Dropped variant:", variant);
      toast.success("Variant added to page");
    } catch (err) {
      console.error("Failed to drop variant", err);
      toast.error("Failed to drop variant");
    }
  }

  function onDropAtIndex(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!activePageId) return;
    try {
      const txt = e.dataTransfer?.getData("application/json");
      if (!txt) return;
      const variant = JSON.parse(txt) as Variant;
      onDropVariant?.(variant, idx);
    } catch (err) {
      console.error("Failed to drop variant", err);
      toast.error("Failed to drop variant");
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="text-sm dark:text-gray-200">
            {activePage
              ? `Editing page: ${activePage.title}`
              : "Select or create a page to start editing"}
          </div>
        </div>
        <div className="flex gap-2">
          {activePageId && (
            <button
              onClick={() => onSaveDraft(activePageId)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
              aria-label="Save draft"
            >
              <Save className="h-4 w-4" />
            </button>
          )}
          {activePageId && (
            <button
              onClick={() => onSavePublish(activePageId)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              aria-label="Publish"
            >
              <Rocket className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-2 bg-slate-50 rounded">
        {!activePageId && (
          <div className="absolute inset-0 flex items-center justify-center text-sm dark:text-gray-200 bg-white/70 rounded">
            Select or create a page to start assembling sections.
          </div>
        )}

        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          {activePage ? (
            <div className="mb-2 text-sm dark:text-gray-200">
              Page: <span className="font-semibold">{activePage.title}</span>
            </div>
          ) : null}
          {queue.length === 0 ? (
            <div className="text-sm dark:text-gray-200">
              No sections queued yet. Accept variants from the left panel.
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((s, idx) => (
                <div
                  key={s.variantId || idx}
                  className="p-4 border rounded bg-white"
                >
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropAtIndex(e, idx)}
                    className="border-b pb-2 mb-2"
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="font-semibold"
                      onBlur={(ev) =>
                        updateVariantSchema(s.variantId, {
                          title: ev.currentTarget.innerText,
                        })
                      }
                    >
                      {String(s.schema?.title)}
                    </div>
                    <div className="text-sm dark:text-gray-200">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(ev) =>
                          updateVariantSchema(s.variantId, {
                            description: ev.currentTarget.innerText,
                          })
                        }
                      >
                        {String(s.schema?.description)}
                      </div>
                    </div>
                    {/* Hidden attribution metadata for automation or compliance */}

                    {s.assets && s.assets.length > 0
                      ? (() => {
                          const a = s.assets![0] as Asset;
                          if (a && typeof a !== "string") {
                            const provider = a.provider || undefined;
                            const attr = a.attribution ?? null;
                            return (
                              <div
                                className="sr-only"
                                aria-hidden
                                data-asset-provider={provider}
                                data-asset-user={attr?.userName || undefined}
                                data-asset-imagepage={
                                  attr?.imagePage || undefined
                                }
                              >
                                {attr?.userName
                                  ? `Photo by ${attr.userName} on ${provider}`
                                  : `Image from ${provider}`}
                              </div>
                            );
                          }
                          return null;
                        })()
                      : null}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        // remove
                        if (!activePageId) return;
                        onUpdateQueue(
                          activePageId,
                          queue.filter((q) => q.variantId !== s.variantId)
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
                      disabled={!activePageId}
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => alert("Open inline editor (todo)")}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {/* drop at end */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropAtIndex(e, queue.length)}
                className="p-4 border border-dashed rounded text-center text-sm dark:text-gray-200"
              >
                Drop here to append
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
