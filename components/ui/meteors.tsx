"use client";

import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  // Generate random values once on mount and memoize them
  const meteorStyles = useMemo(() => {
    const windowWidth =
      typeof window !== "undefined" ? window.innerWidth : 1000;
    return [...new Array(number)].map(() => {
      // Generate random values at creation time, not render time
      const randomLeft = Math.floor(Math.random() * windowWidth);
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      const randomDuration = Math.floor(
        Math.random() * (maxDuration - minDuration) + minDuration
      );

      return {
        "--angle": -angle + "deg",
        top: "-5%",
        left: `calc(0% + ${randomLeft}px)`,
        animationDelay: randomDelay + "s",
        animationDuration: randomDuration + "s",
      };
    });
    // Only recreate when number changes, not when timing params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number, angle]);

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        // Meteor Head
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            "animate-meteor pointer-events-none absolute size-0.5 rotate-(--angle) rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]",
            className
          )}
        >
          {/* Meteor Tail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-linear-to-r from-zinc-500 to-transparent" />
        </span>
      ))}
    </>
  );
};
