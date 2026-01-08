"use client";

import React, { useRef, useState } from "react";
import type {
  Variant as V5Variant,
  ConductorEventPayloads,
} from "@/lib/frontstore/v5-types";
import Image from "next/image";
type Variant = V5Variant;

export default function FrontstoreVariantsClient() {
  const [prompt, setPrompt] = useState<string>("");
  const [persona, setPersona] = useState<string>("");
  const [kind, setKind] = useState<string>("hero");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [personaSelected, setPersonaSelected] = useState<{
    persona: string;
    confidence: number;
  } | null>(null);
  const [status, setStatus] = useState<string>("idle");

  const abortRef = useRef<AbortController | null>(null);

  async function startGeneration() {
    setVariants([]);
    setSectionId(null);
    setJobId(null);
    setPersonaSelected(null);
    setStatus("starting");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/v5/frontstore/conductor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: null,
          prompt,
          kind,
          personaId: persona || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start generation");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported");

      const decoder = new TextDecoder();
      let buf = "";
      setStatus("in-progress");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const chunks = buf.split("\n\n");
        buf = chunks.pop() || "";

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          // parse SSE-like event: lines with `event: name` and `data: {...}`
          const lines = chunk.split("\n").map((l) => l.trim());
          let event = "message";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event:"))
              event = line.slice("event:".length).trim();
            if (line.startsWith("data:"))
              dataStr += line.slice("data:".length).trim();
          }

          try {
            const payload = dataStr ? JSON.parse(dataStr) : null;
            handleEvent(
              event as ConductorEventPayloads["event"],
              payload as unknown
            );
          } catch (err: unknown) {
            console.warn("Failed to parse SSE data", dataStr, err);
          }
        }
      }

      setStatus("done");
    } catch (err: unknown) {
      // Abort errors can be DOMException in the fetch/readable stream environment
      console.warn("Generation error:", err);
      if ((err as Error & { name?: string })?.name === "AbortError") {
        setStatus("aborted");
      } else {
        setStatus("error");
      }
    }
  }

  function handleEvent(
    event: ConductorEventPayloads["event"],
    payload: unknown
  ) {
    if (event === "personaSelected") {
      const p = payload as Extract<
        ConductorEventPayloads,
        { event: "personaSelected" }
      >["data"];
      setPersonaSelected(p);
    } else if (event === "variant") {
      const v = payload as Extract<
        ConductorEventPayloads,
        { event: "variant" }
      >["data"];
      setVariants((prev) => [...prev, v.variant]);
    } else if (event === "done") {
      const d = payload as Extract<
        ConductorEventPayloads,
        { event: "done" }
      >["data"];
      setSectionId(d.sectionId);
      setJobId(d.jobId);
    } else if (event === "error") {
      console.error("Error event from conductor:", payload);
      setStatus("error");
    }
  }

  async function acceptVariant(variant: Variant) {
    if (!sectionId) {
      alert(
        "Generation has not finished yet; wait for the final 'done' event to get a section id."
      );
      return;
    }

    try {
      const res = await fetch(
        `/api/v5/frontstore/sections/${sectionId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: variant.variantId }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      alert("Accepted into draft: " + json.draftId);
    } catch (err) {
      console.error("Accept failed:", err);
      alert("Accept failed: " + String(err));
    }
  }

  function abort() {
    if (abortRef.current) abortRef.current.abort();
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: "1px solid #e6e6e6",
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Frontstore Generator (SSE)</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the section to generate (e.g. describe your menu items, ingredients, prices, and photos)"
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">Auto-detect persona</option>
          <option value="restaurant">Restaurant</option>
          <option value="barber">Barber</option>
          <option value="legal">Legal</option>
          <option value="music">Music</option>
          <option value="retail">Retail</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="hero">hero</option>
          <option value="about">about</option>
          <option value="product">product</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={startGeneration}
          style={{ padding: "8px 12px" }}
          disabled={status === "in-progress"}
        >
          Start
        </button>
        <button
          onClick={abort}
          style={{ padding: "8px 12px" }}
          disabled={status !== "in-progress"}
        >
          Abort
        </button>
        <div style={{ marginLeft: "auto", color: "#666", alignSelf: "center" }}>
          Status: {status}
        </div>
      </div>

      {personaSelected && (
        <div style={{ marginBottom: 12 }}>
          <strong>Persona:</strong> {personaSelected.persona} (confidence{" "}
          {personaSelected.confidence})
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: 8 }}>Variants</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {variants.map((v, i) => (
            <div
              key={v.variantId || i}
              style={{ border: "1px solid #eee", padding: 12, borderRadius: 6 }}
            >
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {String(v.schema?.title) || "Variant"}
              </div>
              <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>
                {String(v.schema?.description)}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-sm">
                  {v.assets && v.assets.length > 0 ? (
                    (() => {
                      const a = v.assets![0];
                      const src = typeof a === "string" ? a : a.url || "";
                      const alt =
                        typeof a === "string" ? "asset" : a.alt || "asset";
                      return (
                        <Image
                          width={900}
                          height={600}
                          src={src}
                          alt={alt}
                          className="max-w-full max-h-full object-cover"
                        />
                      );
                    })()
                  ) : (
                    <div style={{ color: "#aaa" }}>{v.layout || "preview"}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>Layout: {v.layout}</div>
                  <div style={{ fontSize: 13 }}>
                    Score: {v.meta?.score ?? "-"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => acceptVariant(v)}
                  disabled={!sectionId}
                  style={{ padding: "6px 10px" }}
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(v, null, 2));
                    alert("Variant JSON copied to clipboard");
                  }}
                  style={{ padding: "6px 10px" }}
                >
                  Copy JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <small style={{ color: "#888" }}>
          SectionId: {sectionId ?? "(pending)"} • JobId: {jobId ?? "-"}
        </small>
      </div>
    </div>
  );
}
