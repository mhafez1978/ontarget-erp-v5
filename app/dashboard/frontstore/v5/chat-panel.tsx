"use client";

import React, { useEffect, useState } from "react";
import type { Variant } from "@/lib/frontstore/v5-types";

export default function ChatPanel({
  pages,
  activePage,
  onCreatePage,
  onGenerateVariants,
  onGenerated,
  onChangeActivePage,
}: {
  pages: Array<{ id: string; title: string; slug?: string }>;
  activePage: string | null;
  onCreatePage: (p: { id: string; title: string; slug?: string }) => void;
  onGenerateVariants: (
    pageId: string,
    kind: string,
    prompt: string,
    count?: number
  ) => Promise<Variant[][]>;
  onGenerated?: (groups: Variant[][]) => void;
  onChangeActivePage: (pageId: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [pageName, setPageName] = useState("");

  // keep the page name input in sync with the selected page title so it reflects renames
  useEffect(() => {
    const current = pages.find((p) => p.id === activePage);
    if (current) {
      setPageName(current.title || "");
    }
  }, [activePage, pages]);

  const sectionKinds: Array<{ value: string; label: string }> = [
    { value: "auto", label: "Auto (let AI choose)" },
    { value: "hero", label: "Hero" },
    { value: "about", label: "About" },
    { value: "social-proof", label: "Social Proof" },
    { value: "services", label: "Services" },
    { value: "product", label: "Product" },
    { value: "testimonials", label: "Testimonials" },
    { value: "menu-nav", label: "Top navigation (navbar)" },
    { value: "menu-food", label: "Food menu (restaurant)" },
    { value: "food-menu", label: "Food Menu (restaurant)" },
    { value: "logged-in-top-navbar", label: "Top Navbar — Logged In" },
    { value: "logged-out-top-navbar", label: "Top Navbar — Logged Out" },
    { value: "logged-in-side-navbar", label: "Side Navbar — Logged In" },
    { value: "logged-out-side-navbar", label: "Side Navbar — Logged Out" },
    { value: "logged-in-mobile-navbar", label: "Mobile Navbar — Logged In" },
    { value: "logged-out-mobile-navbar", label: "Mobile Navbar — Logged Out" },
    { value: "catering", label: "Catering" },
    { value: "featured", label: "Featured" },
    { value: "portfolio", label: "Portfolio" },
    { value: "case-studies", label: "Case Studies" },
    { value: "cta", label: "Call to Action" },
    { value: "faq", label: "FAQs" },
    { value: "contact", label: "Contact" },
    { value: "contact-map", label: "Contact + Map" },
    { value: "pricing", label: "Pricing / Plans" },
    { value: "footer", label: "Footer" },
  ];

  async function generate() {
    if (!activePage) {
      alert("Select or create a page first");
      return;
    }
    setGenerating(true);
    try {
      const groups = await onGenerateVariants(activePage, kind, prompt, 4);
      onGenerated?.(groups);
    } catch (e) {
      console.error(e);
      alert("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="mt-2">
        <label className="block text-sm">Page name</label>
        <input
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="e.g. Home"
          className="mt-1 block w-full p-2 border rounded"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used for title; slug will be auto-generated.
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm">Section Type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="mt-1 block w-full p-2 border rounded"
        >
          {sectionKinds.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a section or leave on Auto to let the conductor pick based on
          the company persona.
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 block w-full p-2 border rounded"
          rows={4}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Tip: For restaurants, simply chat in natural language — describe your
          menu items, ingredients, prices, and photos — and the AI will generate
          a fully-functional online ordering storefront (payments, analytics,
          and delivery integration).
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            const slugify = (val: string) =>
              val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            const title =
              (pageName || prompt || "New Page").trim() || "New Page";
            const slug = slugify(title) || String(Math.random()).slice(2);
            const newPage = { id: slug, title, slug };
            onCreatePage(newPage);
            onChangeActivePage(newPage.id);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
        >
          Create Page
        </button>
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={generating}
        >
          {generating ? "Generating…" : "Generate 4 Variants"}
        </button>
      </div>
    </div>
  );
}
