/**
 * Color Extraction Utility
 * Extracts dominant colors from company logos
 * Supports both base64 data URLs and file paths
 */

import sharp from "sharp";

export interface ExtractedColors {
  dominantColors: string[]; // Top 5-10 colors from logo
  primarySuggestion: string; // Best color for primary brand
  secondarySuggestion: string; // Best color for secondary
  accentSuggestions: string[]; // Complementary accent colors
  isDarkLogo: boolean; // Whether logo is predominantly dark
  isLightLogo: boolean; // Whether logo is predominantly light
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Check if color is grayscale (low saturation)
 */
function isGrayscale(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  return diff < 30; // Low color variation = grayscale
}

/**
 * Calculate perceived brightness (0-255)
 */
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Extract dominant colors from image buffer
 */
async function extractColorsFromBuffer(buffer: Buffer): Promise<string[]> {
  // Resize image for faster processing
  const resized = await sharp(buffer)
    .resize(100, 100, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels: RGB[] = [];

  // Sample pixels (every 4th pixel for speed)
  for (let i = 0; i < data.length; i += info.channels * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = info.channels === 4 ? data[i + 3] : 255;

    // Skip transparent or near-transparent pixels
    if (a < 50) continue;

    // Skip pure white and near-white
    if (r > 240 && g > 240 && b > 240) continue;

    // Skip pure black (often logo outlines)
    if (r < 15 && g < 15 && b < 15) continue;

    pixels.push({ r, g, b });
  }

  if (pixels.length === 0) {
    return ["#2563EB", "#1E40AF", "#10B981"]; // Fallback
  }

  // K-means clustering to find dominant colors
  const numClusters = Math.min(8, pixels.length);
  const clusters = kMeansClustering(pixels, numClusters);

  // Convert to hex and sort by cluster size (most dominant first)
  const colors = clusters
    .sort((a, b) => b.count - a.count)
    .filter(
      (cluster) =>
        !isGrayscale(cluster.center.r, cluster.center.g, cluster.center.b)
    )
    .map((cluster) =>
      rgbToHex(
        Math.round(cluster.center.r),
        Math.round(cluster.center.g),
        Math.round(cluster.center.b)
      )
    )
    .slice(0, 6);

  return colors.length > 0 ? colors : ["#2563EB", "#1E40AF", "#10B981"];
}

/**
 * Simple K-means clustering for color quantization
 */
function kMeansClustering(
  pixels: RGB[],
  k: number,
  maxIterations: number = 10
): Array<{ center: RGB; count: number }> {
  // Initialize centroids randomly
  const centroids: RGB[] = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({ ...randomPixel });
  }

  let iterations = 0;
  let changed = true;
  const clusters: RGB[][] = Array.from({ length: k }, () => []);

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Clear clusters
    for (let i = 0; i < k; i++) {
      clusters[i] = [];
    }

    // Assign pixels to nearest centroid

    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestIndex = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }

      clusters[closestIndex].push(pixel);
    }

    // Update centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;

      const avgR =
        clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length;
      const avgG =
        clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length;
      const avgB =
        clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length;

      if (
        Math.abs(centroids[i].r - avgR) > 1 ||
        Math.abs(centroids[i].g - avgG) > 1 ||
        Math.abs(centroids[i].b - avgB) > 1
      ) {
        changed = true;
      }

      centroids[i] = { r: avgR, g: avgG, b: avgB };
    }
  }

  // Return centroids with their cluster sizes
  const result = centroids.map((center, i) => ({
    center,
    count: clusters[i]?.length || 0,
  }));

  return result.filter((c) => c.count > 0);
}

/**
 * Generate complementary color (opposite on color wheel)
 */
function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Simple complement: invert RGB
  const compR = 255 - rgb.r;
  const compG = 255 - rgb.g;
  const compB = 255 - rgb.b;

  return rgbToHex(compR, compG, compB);
}

/**
 * Generate analogous colors (adjacent on color wheel)
 */
function getAnalogousColors(hex: string): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex];

  // Convert to HSL for easier manipulation
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Shift hue by ±30 degrees
  const analogous1 = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
  const analogous2 = hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);

  return [
    rgbToHex(analogous1.r, analogous1.g, analogous1.b),
    rgbToHex(analogous2.r, analogous2.g, analogous2.b),
  ];
}

/**
 * Helper: hex to RGB
 */
function hexToRgb(hex: string): RGB | null {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return null;

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Main extraction function
 * Supports base64 data URLs and file paths
 */
export async function extractColorsFromLogo(
  logoDataOrPath: string
): Promise<ExtractedColors> {
  try {
    let buffer: Buffer;

    // Check if it's a base64 data URL
    if (logoDataOrPath.startsWith("data:image/")) {
      const base64Data = logoDataOrPath.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // Assume it's a file path - would need to load from storage
      // For now, return fallback
      throw new Error("File path loading not yet implemented");
    }

    const dominantColors = await extractColorsFromBuffer(buffer);

    if (dominantColors.length === 0) {
      // Fallback if extraction fails
      return {
        dominantColors: ["#2563EB", "#1E40AF", "#10B981"],
        primarySuggestion: "#2563EB",
        secondarySuggestion: "#1E40AF",
        accentSuggestions: ["#10B981", "#F59E0B"],
        isDarkLogo: false,
        isLightLogo: false,
      };
    }

    // Determine if logo is dark or light
    const primaryRgb = hexToRgb(dominantColors[0]);
    const isDark = primaryRgb
      ? getBrightness(primaryRgb.r, primaryRgb.g, primaryRgb.b) < 128
      : false;
    const isLight = primaryRgb
      ? getBrightness(primaryRgb.r, primaryRgb.g, primaryRgb.b) > 180
      : false;

    // Generate accent suggestions using color theory
    const accentSuggestions = [
      ...getAnalogousColors(dominantColors[0]),
      getComplementaryColor(dominantColors[0]),
    ].filter(Boolean);

    return {
      dominantColors,
      primarySuggestion: dominantColors[0],
      secondarySuggestion: dominantColors[1] || dominantColors[0],
      accentSuggestions,
      isDarkLogo: isDark,
      isLightLogo: isLight,
    };
  } catch (error) {
    console.error("Color extraction failed:", error);

    // Return fallback colors
    return {
      dominantColors: ["#2563EB", "#1E40AF", "#10B981"],
      primarySuggestion: "#2563EB",
      secondarySuggestion: "#1E40AF",
      accentSuggestions: ["#10B981", "#F59E0B"],
      isDarkLogo: false,
      isLightLogo: false,
    };
  }
}

/**
 * Quick check if logo extraction is possible
 */
export function canExtractColors(
  logoDataOrPath: string | null | undefined
): boolean {
  if (!logoDataOrPath) return false;

  // Check if it's a base64 data URL
  if (logoDataOrPath.startsWith("data:image/")) {
    return true;
  }

  // File paths need storage integration
  return false;
}
