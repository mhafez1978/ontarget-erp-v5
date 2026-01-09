"use client";

import React from "react";
import VariantCard from "./variant-card";

export default function VariantsPanel() {
  const demo = [
    { id: "v1", title: "Cinematic", type: "video" },
    { id: "v2", title: "Split", type: "video" },
    { id: "v3", title: "Editorial", type: "image" },
    { id: "v4", title: "Minimal", type: "image" },
  ];

  return (
    <aside className="v6-left">
      <h3>Variants</h3>
      <div className="variant-grid" role="list">
        {demo.map((d) => (
          <div key={d.id} role="listitem">
            <VariantCard
              title={d.title}
              type={d.type as any}
              onView={() => alert(`${d.title} — View (modal placeholder)`)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
