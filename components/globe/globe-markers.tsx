"use client";

import { useEffect, useState, useMemo, memo } from "react";
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

function GlobeMarkersComponent({ className }: { className?: string }) {
  const [markers, setMarkers] = useState<ClientMarker[] | null>(null);

  useEffect(() => {
    const mounted = true;

    const fetchMarkers = async () => {
      try {
        const response = await fetch("/api/globe/markers");
        const data: Marker[] = await response.json();

        if (!mounted) return;

        console.log("Raw marker data from API:", data);
        const m = data
          .filter(
            (d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude)
          )
          .map((d) => ({
            location: [d.latitude, d.longitude] as [number, number],
            size: d.size ?? 0.03,
            color: hexToRgbNormalized(d.color ?? "#fb6421"),
            isRoot: d.isRoot === true,
          }));
        console.log("Transformed markers for Globe:", m);
        setMarkers(m);
      } catch (err) {
        console.error("Failed to fetch globe markers:", err);
        // Still show globe even if fetch fails
        if (mounted) {
          setMarkers([]);
        }
      }
    };

    // Fetch markers once on mount
    fetchMarkers();
  }, []);

  // Memoize marker color to prevent unnecessary config object recreation
  const markerColorNormalized = useMemo(
    () =>
      markers && markers.length > 0 && markers[0].color
        ? markers[0].color
        : undefined,
    [markers]
  );

  // Memoize config to prevent Globe from reinitializing on every render
  const config = useMemo(
    () => ({
      ...GLOBE_CONFIG,
      markers: markers ?? [],
      ...(markerColorNormalized ? { markerColor: markerColorNormalized } : {}),
    }),
    [markers, markerColorNormalized]
  );

  if (markers === null) {
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

  return (
    <div
      className={`relative w-full h-[360px] md:h-[480px] lg:h-[560px] shadow-none ${
        className ?? ""
      }`}
    >
      <Globe config={config} />
    </div>
  );
}

export const GlobeMarkers = memo(GlobeMarkersComponent);
