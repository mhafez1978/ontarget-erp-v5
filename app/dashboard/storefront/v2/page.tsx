"use client";

import React, { useState } from "react";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import type { AiFrontstoreSpec } from "@/lib/ai/ai-storefront-types";

export default function FrontstoreV2Page() {
  const [companyId, setCompanyId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content?: string }>
  >([]);
  const [previewSpec, setPreviewSpec] = useState<AiFrontstoreSpec | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!companyId || !prompt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/storefront/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, message: prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to chat");
      setMessages(data.messages || []);
      setPreviewSpec(data.previewSpec || null);
    } catch (err) {
      console.error(err);
      alert("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Chat Builder (v2) - MVP</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm">Company ID</label>
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full border rounded p-2"
          />

          <label className="block text-sm mt-3">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full border rounded p-2"
          />

          <button
            disabled={loading}
            onClick={send}
            className="mt-3 px-4 py-2 bg-primary text-white rounded"
          >
            {loading ? "Generating..." : "Generate Preview"}
          </button>

          <div className="mt-4">
            <h3 className="font-medium">Messages</h3>
            <div className="space-y-2 mt-2">
              {messages.map((m, i) => (
                <div key={i} className="p-2 border rounded bg-white">
                  <strong className="capitalize">{m.role}</strong>
                  <div className="text-sm">{m.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <h3 className="font-medium">Live Preview</h3>
          <div className="border rounded p-3 mt-2 min-h-[400px] bg-muted/10">
            {previewSpec ? (
              <AiStorefrontRenderer
                spec={previewSpec as any}
                slug={companyId}
                companyName={companyId}
                enableCart={false}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No preview yet. Generate a preview to see live rendering here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
