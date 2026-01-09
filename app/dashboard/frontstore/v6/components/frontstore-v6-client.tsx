"use client";

import React from "react";
import VariantsPanel from "./variants-panel";

export default function FrontstoreV6Client() {
  return (
    <div style={{ display: "flex", gap: 12, width: "100%" }}>
      <VariantsPanel />

      <section className="v6-center">
        <h3>Live Preview</h3>
        <div
          style={{
            height: 420,
            background: "rgba(255,255,255,0.01)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--v6-muted)" }}>
            Live preview placeholder
          </div>
        </div>
      </section>

      <aside className="v6-right">
        <h3>Inspector</h3>
        <div style={{ color: "var(--v6-muted)" }}>
          Placeholder for properties and tools
        </div>
      </aside>
    </div>
  );
}
