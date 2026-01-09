"use client";

import React from "react";

export default function VariantCard({
  title = "Variant",
  type = "image",
  onView = () => {},
}: {
  title?: string;
  type?: "image" | "video";
  onView?: () => void;
}) {
  return (
    <div className="variant-card">
      <div className="variant-thumb">
        {type === "video" ? "📽️ Video" : "🖼️ Image"}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button small" onClick={onView}>
            View & Edit
          </button>
        </div>
      </div>
    </div>
  );
}
