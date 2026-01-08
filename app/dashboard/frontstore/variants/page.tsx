import React from "react";
import FrontstoreVariantsClient from "./client";

export default function Page() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Frontstore — Variant Gallery</h1>
      <p style={{ color: "#666" }}>
        Streamed generation from the Conductor and quick Accept actions.
      </p>
      <FrontstoreVariantsClient />
    </div>
  );
}
