"use client";

import React, { useState, useEffect } from "react";
import VariantsPanel from "./variants-panel";
import { toast } from "sonner";

export default function FrontstoreV6Client({
  sectionId,
  onRefresh,
  refreshSignal,
}: {
  sectionId?: string | null;
  onRefresh?: () => void;
  refreshSignal?: number;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Load current user from session
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setUserName(data?.user?.name || data?.user?.email || null);
      } catch (err) {
        // don't block UI on failure
        console.warn("Failed to load user", err);
      }
    })();
  }, []);

  async function handleGenerate() {
    if (!sectionId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(
        `/api/frontstore/v6/sections/${sectionId}/generate-hero-variants`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to generate variants");
      toast.success("Hero variants generation started");
      onRefresh?.();
    } catch (err) {
      console.error("Generation failed:", err);
      toast.error("Failed to generate hero variants");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="min-h-screen flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          V6 Storefront Engine with LX2 AI.
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-6 w-full h-full">
        <div className="col-span-3">
          <VariantsPanel
            sectionId={sectionId || undefined}
            refreshSignal={refreshSignal}
          />
        </div>

        <div className="col-span-6">
          <div className="rounded-2xl p-6 bg-linear-to-b from-[#061028] via-[#07122f] to-[#061025] shadow-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Live Preview
                </h2>
                <p className="text-sm dark:text-gray-200">
                  Inspect candidate variants and preview changes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="button small" disabled={!sectionId}>
                  Preview
                </button>
                <button className="button small" disabled={!sectionId}>
                  Publish
                </button>
                <button
                  className="button small"
                  onClick={handleGenerate}
                  disabled={!sectionId || isGenerating}
                >
                  {isGenerating ? "Generating…" : "Generate Hero Variants"}
                </button>
              </div>
            </div>

            <div className="mt-6 h-[420px] rounded-xl bg-black/30 flex items-center justify-center border border-white/3">
              <div className="dark:text-gray-200 text-center">
                Live preview placeholder — cinematic, dramatic visuals
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-3">
          <div className="rounded-xl p-4 bg-muted/30 border">
            <h3 className="text-lg font-semibold">Inspector</h3>
            <div className="mt-3 text-sm dark:text-gray-200">
              Properties, SEO, visibility, and quick actions.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
