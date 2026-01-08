"use client";

import Image from "next/image";
import type { Variant, Asset } from "@/lib/frontstore/v5-types";
import { toast } from "sonner";

export default function VariantsPanel({
  groups,
  onLikeVariant,
  onRegenerateVariant,
}: {
  groups: Variant[][];
  onLikeVariant: (v: Variant) => void;
  onRegenerateVariant: (kind: string, prompt: string) => void;
}) {
  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h4 className="text-md font-semibold">Generated Sections & Variations</h4>
      <p className="text-sm text-muted-foreground">
        Drag a variant into the canvas to add it to the page.
      </p>

      <div className="mt-4 space-y-4">
        {groups.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No generated sections yet.
          </div>
        )}

        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="mb-2 text-sm font-medium">Section {gi + 1}</div>
            <div className="grid grid-cols-2 gap-3">
              {group.map((v) => (
                <div
                  key={v.variantId}
                  className="border rounded p-2 bg-gray-50"
                  draggable
                  onDragStart={(e) => {
                    try {
                      // support copy semantics and set structured data for drop
                      if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify(v)
                        );
                      }
                    } catch (err) {
                      console.error(
                        "Failed to serialize variant for drag",
                        err
                      );
                      toast.error("Failed to drag variant");
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {v.assets && v.assets.length > 0 ? (
                        (() => {
                          const a = v.assets![0] as Asset;
                          const src = typeof a === "string" ? a : a.url || "";
                          const provider =
                            typeof a === "string" ? null : a.provider || null;
                          const attribution =
                            typeof a === "string"
                              ? null
                              : a.attribution || null;
                          if (src) {
                            return (
                              <div
                                data-asset-provider={provider || undefined}
                                data-asset-user={
                                  attribution?.userName || undefined
                                }
                                data-asset-imagepage={
                                  attribution?.imagePage || undefined
                                }
                              >
                                <Image
                                  width={900}
                                  height={600}
                                  src={src}
                                  alt={
                                    typeof a === "string"
                                      ? String(v.schema?.title || "")
                                      : a.alt || "asset"
                                  }
                                  className="w-full h-full object-cover"
                                />
                                {/* Hidden attribution for provider (screen-reader only) */}
                                {provider ? (
                                  <div className="sr-only" aria-hidden>
                                    {attribution?.userName
                                      ? `Photo by ${attribution.userName} on ${provider}`
                                      : `Image from ${provider}`}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }
                          // fallback to placeholder when asset src is empty
                          return (
                            <div className="text-xs text-muted-foreground">
                              {v.schema?.title
                                ? String(v.schema.title).slice(0, 12)
                                : v.layout}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {v.layout}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {String(v.schema?.title) || "Variant"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {String(v.schema?.description)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Score: {String(v.meta?.score ?? "-")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onLikeVariant(v)}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    >
                      Like
                    </button>
                    <button
                      onClick={() =>
                        onRegenerateVariant(
                          String(v.layout || "section"),
                          String(v.schema?.title || "")
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          JSON.stringify(v, null, 2)
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
