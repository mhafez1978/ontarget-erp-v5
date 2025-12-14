import { ThemeSection } from "@/lib/storefront-themes";

export type SectionChange = {
  action: "added" | "removed" | "modified";
  key: string;
  type: ThemeSection["type"];
  summary: string;
  oldSection?: ThemeSection | null;
  newSection?: ThemeSection | null;
};

function sectionKey(s: ThemeSection) {
  // Prefer a stable id when available; using titles can cause spurious
  // added/removed diffs if the title itself changed. Fall back to title or
  // order when no id is present.
  if (s.id) return `${s.type}:id:${s.id}`;
  const title =
    (s.content &&
      (s.content.title || s.content.heading || (s.content as any).id)) ||
    null;
  return `${s.type}:${title ?? s.order}`;
}

function shallowChanged(a: any, b: any) {
  if (a === b) return false;
  if (typeof a !== typeof b) return true;
  if (a && b && typeof a === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return true;
    }
    return false;
  }
  return a !== b;
}

function summarizeChange(oldS: ThemeSection | null, newS: ThemeSection | null) {
  if (!oldS && newS)
    return `Added ${newS.type} section${
      (newS.content as any).title ? `: ${(newS.content as any).title}` : ""
    }`;
  if (oldS && !newS)
    return `Removed ${oldS.type} section${
      (oldS.content as any).title ? `: ${(oldS.content as any).title}` : ""
    }`;
  if (oldS && newS) {
    // Build a short human readable summary by checking a few common keys
    const changes: string[] = [];
    const fields = [
      "title",
      "heading",
      "subtitle",
      "description",
      "primaryCTA",
      "ctaText",
      "layout",
    ];
    for (const f of fields) {
      const o = (oldS.content as any)[f];
      const n = (newS.content as any)[f];
      if (typeof o === "string" || typeof n === "string") {
        if ((o || "") !== (n || "")) {
          changes.push(
            `${f} changed${o ? `: "${o}"` : ""} → ${n ? `"${n}"` : ""}`
          );
        }
      }
    }
    if (changes.length === 0) {
      // Generic fallback: which top-level keys changed
      const oKeys = Object.keys(oldS.content || {});
      const nKeys = Object.keys(newS.content || {});
      const all = new Set([...oKeys, ...nKeys]);
      for (const k of all) {
        const ok = (oldS.content as any)[k];
        const nk = (newS.content as any)[k];
        if (JSON.stringify(ok) !== JSON.stringify(nk)) {
          changes.push(k);
        }
      }
    }
    const prefix = `Modified ${newS.type} section`;
    return `${prefix}${
      (newS.content as any).title ? `: ${(newS.content as any).title}` : ""
    } — ${changes.slice(0, 3).join(", ")}`;
  }
  return "Changed section";
}

export function computeSectionDiffs(
  oldSections: ThemeSection[] = [],
  newSections: ThemeSection[] = []
): SectionChange[] {
  const oldMap = new Map<string, ThemeSection>();
  const newMap = new Map<string, ThemeSection>();

  for (const s of oldSections) oldMap.set(sectionKey(s), s);
  for (const s of newSections) newMap.set(sectionKey(s), s);

  const changes: SectionChange[] = [];

  // Added & modified
  for (const [k, ns] of newMap.entries()) {
    const os = oldMap.get(k) || null;
    if (!os) {
      changes.push({
        action: "added",
        key: k,
        type: ns.type,
        summary: summarizeChange(null, ns),
        newSection: ns,
      });
    } else if (
      shallowChanged(os.content, ns.content) ||
      os.enabled !== ns.enabled
    ) {
      changes.push({
        action: "modified",
        key: k,
        type: ns.type,
        summary: summarizeChange(os, ns),
        oldSection: os,
        newSection: ns,
      });
    }
  }

  // Removed
  for (const [k, os] of oldMap.entries()) {
    if (!newMap.has(k)) {
      changes.push({
        action: "removed",
        key: k,
        type: os.type,
        summary: summarizeChange(os, null),
        oldSection: os,
      });
    }
  }

  // Sort for deterministic output: added, modified, removed, then by type
  changes.sort((a, b) => {
    const order = { added: 0, modified: 1, removed: 2 } as any;
    if (order[a.action] !== order[b.action])
      return order[a.action] - order[b.action];
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    return 0;
  });

  return changes;
}

export function humanReadableSummary(changes: SectionChange[]) {
  if (!changes || changes.length === 0) return "No changes detected";
  const parts = changes.map((c) => c.summary);
  return parts.join("; ");
}

export default {
  computeSectionDiffs,
  humanReadableSummary,
};
