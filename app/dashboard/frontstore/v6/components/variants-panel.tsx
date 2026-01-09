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
                  onView={() => alert(`${d.title} — View (modal placeholder)`)}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  );
}
