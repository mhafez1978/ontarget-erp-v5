"use client";

import React from "react";

export default function SectionToolbar({
  onDuplicate,
  onDelete,
  onToggleHide,
  onOpenSEO,
  isHidden,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleHide: () => void;
  onOpenSEO: () => void;
  isHidden?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        className="button small"
        title="Duplicate (Ctrl/Cmd+D)"
        onClick={onDuplicate}
      >
        ✂️ Duplicate
      </button>
      <button className="button small" title="SEO" onClick={onOpenSEO}>
        🔍 SEO
      </button>
      <button className="button small" title="Hide/Show" onClick={onToggleHide}>
        {isHidden ? "👁️ Show" : "🙈 Hide"}
      </button>
      <button className="button small" title="Delete (Del)" onClick={onDelete}>
        🗑️ Delete
      </button>
    </div>
  );
}
