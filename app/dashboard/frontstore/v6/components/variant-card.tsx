"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function VariantCard({
  id,
  title = "Variant",
  type = "image",
  onView = () => {},
  selected = false,
  onSelect = () => {},
  toolbar,
}: {
  id: string;
  title?: string;
  type?: "image" | "video";
  status?: string | null;
  jobId?: string | null;
  onView?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  toolbar?: React.ReactNode;
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
      className={`variant-card ${isDragging ? "dragging" : ""} ${
        selected ? "ring-2 ring-accent" : ""
      }`}
      style={style}
      onClick={onSelect}
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {toolbar}
          {status && (
            <div
              className={`job-badge job-${status.toLowerCase()}`}
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12 }}
            >
              {status}
            </div>
          )}
          <button
            className="button small"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
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
