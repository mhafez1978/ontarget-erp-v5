"use client";

import React, { useState, useCallback } from "react";
import VariantCard from "./variant-card";
import ViewEditModal from "./view-edit-modal";
import SectionToolbar from "./section-toolbar";
import SeoModal from "./seo-modal";
import { toast } from "sonner";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

export default function VariantsPanel({
  sectionId,
  refreshSignal,
}: { sectionId?: string; refreshSignal?: number } = {}) {
  type Variant = {
    id: string;
    title: string;
    type: "video" | "image" | string;
    assets?: { url: string }[];
    hidden: boolean;
    seo?: Record<string, string> | null;
  };

  const [items, setItems] = useState<Variant[]>([
    { id: "v1", title: "Cinematic", type: "video", hidden: false },
    { id: "v2", title: "Split", type: "video", hidden: false },
    { id: "v3", title: "Editorial", type: "image", hidden: false },
    { id: "v4", title: "Minimal", type: "image", hidden: false },
  ]);

  // Video job statuses for variants
  type Job = {
    id: string;
    variantId: string;
    status: string;
    createdAt: string;
    provider?: string;
    resultUrl?: string;
  };
  const [jobs, setJobs] = useState<Job[]>([]);

  // When a real sectionId is provided, load variants from server
  React.useEffect(() => {
    async function load() {
      if (!sectionId) return;
      try {
        const res = await fetch(`/api/frontstore/v6/sections/${sectionId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch section");
        const json = await res.json();
        if (json?.success && Array.isArray(json.section?.variants)) {
          setItems(json.section.variants as Variant[]);
        }
      } catch (err) {
        console.warn("Failed to load section variants:", err);
      }
    }
    load();
  }, [sectionId, refreshSignal]);
  const [modalOpen, setModalOpen] = useState(false);

  const [selected, setSelected] = useState<null | Variant>(null);
  const [seoOpenFor, setSeoOpenFor] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<
    Array<{ action: string; item: Variant }>
  >([]);

  // Poll jobs when sectionId present
  React.useEffect(() => {
    let mounted = true;
    let timer: number | undefined = undefined;

    async function loadJobs() {
      if (!sectionId) return;
      try {
        const res = await fetch(
          `/api/frontstore/v6/sections/${sectionId}/video-jobs`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const json = await res.json();
        if (mounted && Array.isArray(json.jobs)) {
          setJobs(json.jobs as Job[]);
        }
      } catch (err) {
        console.warn("Failed to load video jobs:", err);
      } finally {
        timer = window.setTimeout(loadJobs, 4000);
      }
    }

    loadJobs();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [sectionId, refreshSignal]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  // Action helpers
  const undoLastDelete = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    if (last.action === "delete") {
      setItems((prev) => [last.item, ...prev]);
      setUndoStack((prev) => prev.slice(0, -1));
      toast.success("Restore successful");
    }
  }, [undoStack]);

  const duplicateItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      // If we have a sectionId, persist the duplicate to server
      if (sectionId) {
        try {
          const res = await fetch(
            `/api/frontstore/v6/sections/${sectionId}/variants/${id}/duplicate`,
            { method: "POST" }
          );
          if (!res.ok) throw new Error("Failed to duplicate");
          const json = await res.json();
          const newVariant = json.variant as Variant;
          setItems((prev) => [newVariant, ...prev]);
          toast.success("Variant duplicated");
          return;
        } catch (err) {
          console.error("Duplicate failed:", err);
          toast.error("Failed to duplicate variant, try again");
          return;
        }
      }

      const copy: Variant = {
        ...item,
        id: `v${Date.now()}`,
        title: `${item.title} (copy)`,
      };
      setItems((prev) => [copy, ...prev]);
      toast.success("Variant duplicated");
    },
    [items, sectionId]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      if (sectionId) {
        try {
          const res = await fetch(
            `/api/frontstore/v6/sections/${sectionId}/variants/${id}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error("Failed to delete");
          const json = await res.json();
          const removed = json.variant as Variant;
          setItems((prev) => prev.filter((i) => i.id !== id));
          setUndoStack((u) => [...u, { action: "delete", item: removed }]);
          toast.success("Variant deleted — undo?", {
            action: { label: "Undo", onClick: () => undoLastDelete() },
          });
          return;
        } catch (err) {
          console.error("Delete failed:", err);
          toast.error("Failed to delete variant, try again");
          return;
        }
      }

      setItems((prev) => prev.filter((i) => i.id !== id));
      setUndoStack((u) => [...u, { action: "delete", item }]);
      toast.success("Variant deleted — undo?", {
        action: { label: "Undo", onClick: () => undoLastDelete() },
      });
    },
    [items, sectionId, undoLastDelete]
  );

  async function toggleHide(id: string) {
    if (sectionId) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      try {
        const res = await fetch(
          `/api/frontstore/v6/sections/${sectionId}/variants/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hidden: !item.hidden }),
          }
        );
        if (!res.ok) throw new Error("Failed to toggle");
        const json = await res.json();
        const updated = json.variant;
        setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
        toast.success("Visibility toggled");
        return;
      } catch (err) {
        console.error("Toggle hide failed:", err);
        toast.error("Failed to toggle visibility");
        return;
      }
    }

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hidden: !it.hidden } : it))
    );
    toast.success("Visibility toggled");
  }
  return (
    <aside className="v6-left">
      <h3>Variants</h3>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="variant-grid" role="list">
            {items.map((d) => (
              <div key={d.id} role="listitem">
                <VariantCard
                  id={d.id}
                  title={d.title}
                  type={d.type as "video" | "image"}
                  status={
                    jobs.find(
                      (j: { variantId: string; status?: string }) =>
                        j.variantId === d.id
                    )?.status || null
                  }
                  jobId={
                    jobs.find((j: any) => j.variantId === d.id)?.id || null
                  }
                  selected={selected?.id === d.id}
                  onSelect={() => setSelected(d)}
                  toolbar={
                    <SectionToolbar
                      isHidden={!!d.hidden}
                      onDuplicate={() => duplicateItem(d.id)}
                      onDelete={() => deleteItem(d.id)}
                      onToggleHide={() => toggleHide(d.id)}
                      onOpenSEO={() => setSeoOpenFor(d.id)}
                    />
                  }
                  onView={() => {
                    // pass sectionId into modal via selected metadata
                    setSelected({ ...d, __sectionId: sectionId } as any);
                    setModalOpen(true);
                  }}
                />
              </div>
            ))}
          </div>
          {/* SEO Modal */}
          {seoOpenFor && (
            <SeoModal
              open={!!seoOpenFor}
              onOpenChange={(o) => setSeoOpenFor(o ? seoOpenFor : null)}
              initial={
                (items.find((i) => i.id === seoOpenFor) as Variant | undefined)
                  ?.seo || null
              }
              onSave={async (payload) => {
                // Persist SEO change if sectionId is present
                if (sectionId && seoOpenFor) {
                  try {
                    const res = await fetch(
                      `/api/frontstore/v6/sections/${sectionId}/variants/${seoOpenFor}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ seo: payload }),
                      }
                    );
                    if (!res.ok) throw new Error("Failed to update SEO");
                    const json = await res.json();
                    const updated = json.variant;
                    setItems((prev) =>
                      prev.map((it) => (it.id === seoOpenFor ? updated : it))
                    );
                    setSeoOpenFor(null);
                    return;
                  } catch (err) {
                    console.error("SEO save failed:", err);
                    toast.error("Failed to save SEO");
                    return;
                  }
                }

                setItems((prev) =>
                  prev.map((it) =>
                    it.id === seoOpenFor ? { ...it, seo: payload } : it
                  )
                );
                setSeoOpenFor(null);
              }}
            />
          )}{" "}
        </SortableContext>
      </DndContext>

      {/* View & Edit Modal */}
      {typeof window !== "undefined" && (
        <React.Suspense>
          <ViewEditModal
            open={modalOpen}
            onOpenChange={(open) => setModalOpen(open)}
            variant={selected}
            onSave={(payload) => {
              setItems((prev) =>
                prev.map((it) =>
                  it.id === payload.id
                    ? { ...it, title: payload.title, assets: payload.assets }
                    : it
                )
              );
              setSelected(null);
            }}
          />
        </React.Suspense>
      )}

      {/* Undo / toast for delete */}
      <div id="v6-undo-placeholder" />
    </aside>
  );
}
