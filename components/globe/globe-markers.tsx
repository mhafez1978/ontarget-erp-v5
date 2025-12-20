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

export function GlobeMarkers({ className }: { className?: string }) {
  const [markers, setMarkers] = useState<
    | {
        location: [number, number];
        size: number;
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

  return (
    <div
      className={`relative w-full h-[360px] md:h-[480px] lg:h-[560px] ${
        className ?? ""
      }`}
    >
      <Globe config={{ ...GLOBE_CONFIG, markers }} />
    </div>
  );
}
