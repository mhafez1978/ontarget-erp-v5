"use client";

import React from "react";
import VariantsPanel from "./variants-panel";

export default function FrontstoreV6Client() {
  return (
    <div className="grid grid-cols-12 gap-6 w-full">
      <div className="col-span-3">
        <VariantsPanel />
      </div>

      <div className="col-span-6">
        <div className="rounded-2xl p-6 bg-gradient-to-b from-[#061028] via-[#07122f] to-[#061025] shadow-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Live Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                Inspect candidate variants on the right and drag your favorite
                to the page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="button small">Preview</button>
              <button className="button small">Publish</button>
            </div>
          </div>

          <div className="mt-6 h-[420px] rounded-xl bg-black/30 flex items-center justify-center border border-white/3">
            <div className="text-muted-foreground text-center">
              Live preview placeholder — cinematic, dramatic visuals
            </div>
          </div>
        </div>
      </div>

      <aside className="col-span-3">
        <div className="rounded-xl p-4 bg-muted/30 border">
          <h3 className="text-lg font-semibold">Inspector</h3>
          <div className="mt-3 text-sm text-muted-foreground">
            Properties, SEO, visibility, and quick actions.
          </div>
        </div>
      </aside>
    </div>
  );
}
