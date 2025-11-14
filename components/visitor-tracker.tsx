"use client";

import { useEffect, useState } from "react";
import { trackVisitor } from "@/lib/geo-tracking";

export function VisitorTracker() {
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Only track once per session
    if (hasTracked) return;

    const track = async () => {
      try {
        await trackVisitor();
        setHasTracked(true);
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    // Track after a short delay to avoid blocking page load
    const timeout = setTimeout(track, 1000);

    return () => clearTimeout(timeout);
  }, [hasTracked]);

  return null; // This component doesn't render anything
}
