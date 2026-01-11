"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type Step = {
  fromRef: React.RefObject<Element | null>;
  toRef: React.RefObject<Element | null>;
  curvature?: number;
  endYOffset?: number;
  duration?: number;
};

type Props = {
  containerRef: React.RefObject<Element | null>;
  steps: Step[];
  pause?: number;
  loop?: boolean;
};

export default function BeamTraveler({
  containerRef,
  steps,
  pause = 400,
  loop = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null
  );
  const pathsRef = useRef<
    {
      d: string;
      length: number;
      getPoint: (t: number) => { x: number; y: number };
      duration: number;
    }[]
  >([]);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function computePaths() {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const cRect = containerEl.getBoundingClientRect();

    const newBox = {
      width: Math.max(cRect.width, 1),
      height: Math.max(cRect.height, 1),
    };
    setBox(newBox);

    const newPaths = steps
      .map((s) => {
        const fromEl = s.fromRef.current;
        const toEl = s.toRef.current;
        if (!fromEl || !toEl) return null;

        const fRect = fromEl.getBoundingClientRect();
        const tRect = toEl.getBoundingClientRect();

        const start = {
          x: fRect.left + fRect.width / 2 - cRect.left,
          y: fRect.top + fRect.height / 2 - cRect.top,
        };
        const end = {
          x: tRect.left + tRect.width / 2 - cRect.left,
          y: tRect.top + tRect.height / 2 - cRect.top + (s.endYOffset ?? 0),
        };

        const curvature = s.curvature ?? 0;
        const cp1 = { x: start.x + curvature, y: start.y };
        const cp2 = { x: end.x - curvature, y: end.y };

        const d = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y}`;

        // create DOM path to sample points
        const pathEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        pathEl.setAttribute("d", d);
        const length = pathEl.getTotalLength();

        return {
          d,
          length,
          duration: s.duration ?? 1200,
          getPoint: (t: number) => {
            const pt = pathEl.getPointAtLength(
              Math.max(0, Math.min(1, t)) * length
            );
            return { x: pt.x, y: pt.y };
          },
        };
      })
      .filter(
        (
          p
        ): p is {
          d: string;
          length: number;
          getPoint: (t: number) => { x: number; y: number };
          duration: number;
        } => !!p
      );

    pathsRef.current = newPaths;
  }

  useLayoutEffect(() => {
    computePaths();

    const ro = new ResizeObserver(() => computePaths());
    if (containerRef.current) ro.observe(containerRef.current);
    steps.forEach((s) => {
      if (s.fromRef.current) ro.observe(s.fromRef.current);
      if (s.toRef.current) ro.observe(s.toRef.current);
    });

    window.addEventListener("resize", computePaths);
    window.addEventListener("scroll", computePaths, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computePaths);
      window.removeEventListener("scroll", computePaths, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  useEffect(() => {
    // start animation loop
    let cancelled = false;

    function step(now: number) {
      if (cancelled) return;
      const paths = pathsRef.current;
      if (!paths || paths.length === 0) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
        stepIndexRef.current = 0;
      }

      const idx = stepIndexRef.current % paths.length;
      const p = paths[idx];

      const elapsed = now - (startTimeRef.current ?? now);
      const t = elapsed / p.duration;

      if (t <= 1) {
        const point = p.getPoint(t);
        setPos({ x: point.x, y: point.y });
      } else if (t <= 1 + pause / 1000) {
        // pause at end
        const point = p.getPoint(1);
        setPos({ x: point.x, y: point.y });
      } else {
        // move to next
        stepIndexRef.current = stepIndexRef.current + 1;
        startTimeRef.current = now;
        if (!loop && stepIndexRef.current >= paths.length) {
          // stop
          cancelled = true;
          return;
        }
      }

      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      startTimeRef.current = null;
    };
  }, [pause, loop]);

  if (!box) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none overflow-visible z-10"
      width={box.width}
      height={box.height}
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="none"
    >
      {pos && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={7}
          fill="#fff"
          style={{ filter: "drop-shadow(0 6px 12px rgba(139,92,246,0.22))" }}
        />
      )}
    </svg>
  );
}
