"use client";

import React, { useState } from "react";
import VariantCard from "./variant-card";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

export default function VariantsPanel() {
  const [items, setItems] = useState([
    { id: "v1", title: "Cinematic", type: "video" },
    { id: "v2", title: "Split", type: "video" },
    { id: "v3", title: "Editorial", type: "image" },
    { id: "v4", title: "Minimal", type: "image" },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<null | {
    id: string;
    title: string;
    type: string;
    assets?: any[];
  }>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
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
                  onView={() => {
                    setSelected(d);
                    setModalOpen(true);
                  }}
                />
              </div>
            ))}
          </div>
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
    </aside>
  );
}
