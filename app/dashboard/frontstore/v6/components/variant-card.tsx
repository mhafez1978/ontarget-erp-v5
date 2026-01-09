"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function VariantCard({
  id,
  title = "Variant",
  type = "image",
  onView = () => {},
}: {
  id: string;
  title?: string;
  type?: "image" | "video";
  onView?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={`variant-card ${isDragging ? "dragging" : ""}`}
      style={style}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
        >
          ☰
        </div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button small" onClick={onView}>
            View & Edit
          </button>
        </div>
      </div>
      <div className="variant-thumb">
        {type === "video" ? "📽️ Video" : "🖼️ Image"}
      </div>
    </div>
  );
}
