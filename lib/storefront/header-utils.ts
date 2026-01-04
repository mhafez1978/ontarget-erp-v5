export function isHexColorLight(hex?: string): boolean {
  if (!hex) return false;
  // Normalize
  const h = hex.replace(/^#/, "").trim();
  if (![3, 6].includes(h.length)) return false;
  // Expand short form
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  // Perceived luminance (sRGB)
  const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return lum > 0.7; // consider very light backgrounds
}

export function computeHeaderStyle(aiMeta?: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}): React.CSSProperties {
  if (!aiMeta) return {};

  // Prefer an explicit background color unless it is very light (e.g., white)
  const bg = aiMeta.backgroundColor || aiMeta.primaryColor || undefined;
  if (bg && isHexColorLight(bg)) {
    // If bg is light, use primaryColor for header background if available
    const primary = aiMeta.primaryColor || bg;
    return {
      backgroundColor: primary,
      color: aiMeta.textColor || "#ffffff",
      borderColor: aiMeta.accentColor || aiMeta.secondaryColor || undefined,
    };
  }

  return {
    backgroundColor: bg,
    color: aiMeta.textColor || "var(--color-text, inherit)",
    borderColor: aiMeta.accentColor || aiMeta.secondaryColor || undefined,
  };
}

export function computeHeaderLinks(slug: string, postsCount = 0) {
  // canonical nav: Home, Services, Blog, Contact
  const links = [
    { label: "Home", href: `/store/${slug}` },
    { label: "Services", href: `/store/${slug}/services` },
    { label: "Blog", href: `/store/${slug}/posts` },
    { label: "Contact", href: `/store/${slug}/contact` },
  ];

  // Future: we may hide Blog when postsCount === 0, but keep visible per UX
  return links;
}
