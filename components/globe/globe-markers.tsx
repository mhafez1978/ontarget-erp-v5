"use client";

import { useEffect, useState } from "react";
import { Globe, GLOBE_CONFIG } from "@/components/ui/globe";

type Marker = {
  id?: string;
  name?: string;
  latitude: number;
  longitude: number;
  size?: number;
  color?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 0.4, 0.13]; // fallback to orange
}

function hexToRgbNormalized(
  input?: string
): [number, number, number] | undefined {
  if (!input) return undefined;
  const s = input.trim();
  const rgbMatch = s.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) {
      return [r / 255, g / 255, b / 255];
    }
    return undefined;
  }

  const h = s.replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r / 255, g / 255, b / 255];
  }

  if (h.length === 6) {
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return [r / 255, g / 255, b / 255];
  }

  return undefined;
}

export function GlobeMarkers({ className }: { className?: string }) {
  const [markers, setMarkers] = useState<
    | {
        location: [number, number];
        size: number;
        color?: string;
      }[]
    | null
  >(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/globe/markers")
      .then((r) => r.json())
      .then((data: Marker[]) => {
        if (!mounted) return;
        const m = data
          .filter((d) => d.latitude && d.longitude)
          .map((d) => ({
            location: [d.latitude, d.longitude] as [number, number],
            size: d.size ?? 0.06,
            color: d.color ?? "#fb6421",
          }));
        setMarkers(m);
      })
      .catch((err) => {
        console.error("Failed to fetch globe markers:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!markers) {
    return (
      <div
        className={`relative w-full h-[360px] md:h-[480px] lg:h-[560px] ${
          className ?? ""
        }`}
      >
        {/* Placeholder while loading */}
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading map…
        </div>
      </div>
    );
  }

  const markerColorNormalized =
    markers && markers.length > 0 && markers[0].color
      ? hexToRgbNormalized(markers[0].color)
      : undefined;

  return (
    <div
      className={`relative w-full h-[360px] md:h-[480px] lg:h-[560px] ${
        className ?? ""
      }`}
    >
      <Globe
        config={{
          ...GLOBE_CONFIG,
          markers,
          ...(markerColorNormalized
            ? { markerColor: markerColorNormalized }
            : {}),
        }}
      />
    </div>
  );
}
