export function extractBodyContent(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  // Prefer explicit <body> capture to avoid pulling in <head> or <html> attributes
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) return bodyMatch[1];

  // Remove doctype and html/head wrappers conservatively
  let s = raw.replace(/<!doctype html[^>]*>/i, "");
  s = s.replace(/<html[^>]*>/i, "").replace(/<\/html>/i, "");
  s = s.replace(/<head[^>]*>[\s\S]*?<\/head>/i, "");

  return s;
}
