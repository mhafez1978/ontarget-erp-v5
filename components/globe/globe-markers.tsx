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
  isRoot?: boolean;
};

// Client-side marker shape used by the Globe renderer
type ClientMarker = {
  location: [number, number];
  size: number;
  color?: [number, number, number];
  isRoot?: boolean;
};

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
  const [markers, setMarkers] = useState<ClientMarker[] | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMarkers = () => {
      fetch("/api/globe/markers")
        .then((r) => r.json())
        .then((data: Marker[]) => {
          if (!mounted) return;
          console.log("Raw marker data from API:", data);
          const m = data
            .filter(
              (d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude)
            )
            .map((d) => ({
              location: [d.latitude, d.longitude] as [number, number],
              size: d.size ?? 0.06,
              color: hexToRgbNormalized(d.color ?? "#fb6421"),
              isRoot: d.isRoot === true,
            }));
          console.log("Transformed markers for Globe:", m);
          setMarkers(m);
        })
        .catch((err) => {
          console.error("Failed to fetch globe markers:", err);
        });
    };

    // Initial fetch
    fetchMarkers();

    // Poll for updates every 30 seconds to reflect new subscriptions/locations dynamically
    const interval = setInterval(fetchMarkers, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
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
      ? markers[0].color
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
