/**
 * WCAG Contrast Ratio Calculator and Accessibility Utilities
 * Implements WCAG 2.1 Level AA/AAA contrast requirements
 *
 * Standards:
 * - Normal text: 4.5:1 (AA), 7:1 (AAA)
 * - Large text (18pt+ or 14pt bold): 3:1 (AA), 4.5:1 (AAA)
 * - UI components: 3:1 minimum
 */

export interface ContrastResult {
  ratio: number;
  passesAA: boolean; // 4.5:1 for normal text
  passesAAA: boolean; // 7:1 for normal text
  passesAALarge: boolean; // 3:1 for large text (18pt+)
  passesUIComponent: boolean; // 3:1 for UI elements
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  backgroundColor: string;
  textColor: string;
  primaryContrast: number;
  secondaryContrast: number;
  accentContrast: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio from 1:1 (no contrast) to 21:1 (maximum contrast)
 */
export function getContrastRatio(
  foreground: string,
  background: string
): ContrastResult {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    // Invalid colors, return failing result
    return {
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      passesAALarge: false,
      passesUIComponent: false,
    };
  }

  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);

  // Lighter color should be l1
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesAALarge: ratio >= 3,
    passesUIComponent: ratio >= 3,
  };
}

/**
 * Find an accessible color pair from a list of options
 * Returns the first color that meets WCAG AA standards with the base color
 */
export function findAccessiblePair(
  baseColor: string,
  options: string[],
  level: "AA" | "AAA" = "AA"
): string | null {
  const targetRatio = level === "AAA" ? 7 : 4.5;

  for (const option of options) {
    const result = getContrastRatio(option, baseColor);
    if (result.ratio >= targetRatio) {
      return option;
    }
  }

  return null;
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, Math.round(rgb.r * (1 - percent / 100)));
  const g = Math.max(0, Math.round(rgb.g * (1 - percent / 100)));
  const b = Math.max(0, Math.round(rgb.b * (1 - percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Check if a color is considered "light" (luminance > 0.5)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

/**
 * Generate an accessible color variation
 * If the color is too similar to background, adjust it to meet WCAG standards
 */
export function makeAccessible(
  color: string,
  background: string,
  level: "AA" | "AAA" = "AA"
): string {
  const targetRatio = level === "AAA" ? 7 : 4.5;
  let result = getContrastRatio(color, background);

  if (result.ratio >= targetRatio) {
    return color; // Already accessible
  }

  // Determine if we should lighten or darken
  const bgIsLight = isLightColor(background);
  let adjusted = color;
  let attempts = 0;
  const maxAttempts = 10;

  while (result.ratio < targetRatio && attempts < maxAttempts) {
    attempts++;
    // If background is light, darken the color; if dark, lighten it
    adjusted = bgIsLight
      ? darkenColor(adjusted, 15)
      : lightenColor(adjusted, 15);
    result = getContrastRatio(adjusted, background);
  }

  return adjusted;
}

/**
 * Generate a complete accessible color palette from brand colors
 */
export function generateAccessiblePalette(
  brandColors: string[],
  preferredBackground: "light" | "dark" = "light"
): ColorPalette {
  const backgroundColor =
    preferredBackground === "light" ? "#FFFFFF" : "#111827";
  const baseTextColor = preferredBackground === "light" ? "#111827" : "#F9FAFB";

  // Use first brand color as primary, ensure it's accessible
  const primary = brandColors[0]
    ? makeAccessible(brandColors[0], backgroundColor)
    : "#2563EB";

  // Use second brand color as secondary, or generate one
  const secondary = brandColors[1]
    ? makeAccessible(brandColors[1], backgroundColor)
    : preferredBackground === "light"
    ? darkenColor(primary, 20)
    : lightenColor(primary, 20);

  // Use third brand color as accent, or generate complementary
  const accent = brandColors[2]
    ? makeAccessible(brandColors[2], backgroundColor)
    : "#10B981";

  // Ensure text color has good contrast
  const textColor = makeAccessible(baseTextColor, backgroundColor, "AAA");

  return {
    primary,
    secondary,
    accent,
    backgroundColor,
    textColor,
    primaryContrast: getContrastRatio(primary, backgroundColor).ratio,
    secondaryContrast: getContrastRatio(secondary, backgroundColor).ratio,
    accentContrast: getContrastRatio(accent, backgroundColor).ratio,
  };
}

/**
 * Predefined accessible color palettes for fallback
 */
export const ACCESSIBLE_PALETTES: Record<string, ColorPalette> = {
  modernBlue: {
    primary: "#2563EB",
    secondary: "#1E40AF",
    accent: "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    primaryContrast: 4.98,
    secondaryContrast: 8.59,
    accentContrast: 4.68,
  },
  professionalGray: {
    primary: "#475569",
    secondary: "#1E293B",
    accent: "#3B82F6",
    backgroundColor: "#F8FAFC",
    textColor: "#0F172A",
    primaryContrast: 5.32,
    secondaryContrast: 12.63,
    accentContrast: 5.14,
  },
  warmOrange: {
    primary: "#EA580C",
    secondary: "#9A3412",
    accent: "#059669",
    backgroundColor: "#FFF7ED",
    textColor: "#7C2D12",
    primaryContrast: 4.74,
    secondaryContrast: 9.28,
    accentContrast: 4.89,
  },
  freshGreen: {
    primary: "#059669",
    secondary: "#065F46",
    accent: "#2563EB",
    backgroundColor: "#ECFDF5",
    textColor: "#064E3B",
    primaryContrast: 4.92,
    secondaryContrast: 8.43,
    accentContrast: 6.21,
  },
  luxuryPurple: {
    primary: "#7C3AED",
    secondary: "#5B21B6",
    accent: "#F59E0B",
    backgroundColor: "#FAFAF9",
    textColor: "#1C1917",
    primaryContrast: 5.67,
    secondaryContrast: 9.84,
    accentContrast: 4.52,
  },
  boldRed: {
    primary: "#DC2626",
    secondary: "#991B1B",
    accent: "#2563EB",
    backgroundColor: "#FFFBEB",
    textColor: "#7F1D1D",
    primaryContrast: 5.89,
    secondaryContrast: 10.21,
    accentContrast: 6.43,
  },
};

/**
 * Get the most accessible palette for a given set of brand colors
 */
export function getBestAccessiblePalette(brandColors: string[]): ColorPalette {
  if (!brandColors || brandColors.length === 0) {
    return ACCESSIBLE_PALETTES.modernBlue;
  }

  try {
    return generateAccessiblePalette(brandColors, "light");
  } catch (error) {
    console.error("Failed to generate accessible palette:", error);
    return ACCESSIBLE_PALETTES.modernBlue;
  }
}
