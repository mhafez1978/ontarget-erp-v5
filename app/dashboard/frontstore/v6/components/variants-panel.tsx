"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function VariantsPanel() {
  const [items, setItems] = useState([
    { id: "v1", title: "Cinematic", type: "video", hidden: false },
    { id: "v2", title: "Split", type: "video", hidden: false },
    { id: "v3", title: "Editorial", type: "image", hidden: false },
    { id: "v4", title: "Minimal", type: "image", hidden: false },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<null | {
    id: string;
    title: string;
    type: string;
    assets?: any[];
  }>(null);
  const [seoOpenFor, setSeoOpenFor] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  // Keyboard shortcuts: Cmd/Ctrl+D duplicate selected, Del delete, M for move mode
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selected) duplicateItem(selected.id);
      }

      if (e.key === "Delete" && selected) {
        e.preventDefault();
        deleteItem(selected.id);
      }

      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        // Focus hint for moving
        if (selected) toast("Move mode: drag the selected variant");
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, items]);

  // Action helpers
  function duplicateItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const copy = {
      ...item,
      id: `v${Date.now()}`,
      title: `${item.title} (copy)`,
    };
    setItems((prev) => [copy, ...prev]);
    toast.success("Variant duplicated");
  }

  function deleteItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setUndoStack((u) => [...u, { action: "delete", item }]);
    toast.success("Variant deleted — undo?", {
      action: { label: "Undo", onClick: () => undoDelete() },
    });
  }

  function undoDelete() {
    const last = undoStack.pop();
    if (!last) return;
    if (last.action === "delete") {
      setItems((prev) => [last.item, ...prev]);
      setUndoStack([...undoStack]);
      toast.success("Restore successful");
    }
  }

  function toggleHide(id: string) {
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
                  type={d.type as any}
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
                    setSelected(d);
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
              initial={items.find((i) => i.id === seoOpenFor)?.seo || null}
              onSave={(payload) => {
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
