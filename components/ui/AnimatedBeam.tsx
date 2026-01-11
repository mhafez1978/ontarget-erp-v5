"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";

type BeamProps = {
  containerRef: React.RefObject<Element | null>;
  fromRef: React.RefObject<Element | null>;
  toRef: React.RefObject<Element | null>;
  curvature?: number;
  endYOffset?: number;
  showDot?: boolean;
  duration?: number; // seconds for per-beam animation (if used)
  delay?: number;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string; // light: purple-500
  gradientStopColor?: string; // dark: var(--text-primary)
  bidirectional?: boolean;
};

export default function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  endYOffset = 0,
  showDot = true,
  duration = 5,
  delay = 0,
  pathWidth = 6,
  pathOpacity = 1,
  gradientStartColor = "#7c3aed",
  gradientStopColor = "#7c3aed",
  bidirectional = true,
}: BeamProps) {
  const id = useId();
  const pathId = `beam-path-${id}`;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [d, setD] = useState<string | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null
  );

  useLayoutEffect(() => {
    function update() {
      const fromEl = fromRef.current;
      const toEl = toRef.current;
      const containerEl = containerRef.current;
      if (!fromEl || !toEl || !containerEl) return;

      const cRect = containerEl.getBoundingClientRect();
      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      const start = {
        x: fRect.left + fRect.width / 2 - cRect.left,
        y: fRect.top + fRect.height / 2 - cRect.top,
      };
      const end = {
        x: tRect.left + tRect.width / 2 - cRect.left,
        y: tRect.top + tRect.height / 2 - cRect.top + endYOffset,
      };

      const cp1 = { x: start.x + curvature, y: start.y };
      const cp2 = { x: end.x - curvature, y: end.y };

      const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y}`;

      setBox({
        width: Math.max(cRect.width, 1),
        height: Math.max(cRect.height, 1),
      });
      setD(path);
    }

    update();

    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    if (fromRef.current) ro.observe(fromRef.current);
    if (toRef.current) ro.observe(toRef.current);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [containerRef, fromRef, toRef, curvature, endYOffset]);

  if (!d || !box) return null;

  const anim = `dash-${id} ${duration}s linear ${delay}s infinite`;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none overflow-visible z-10"
      width={box.width}
      height={box.height}
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" x2="1">
          <stop
            offset="0%"
            className={`g-start-${id}`}
            stopColor={gradientStartColor}
          />
          <stop
            offset="100%"
            className={`g-end-${id}`}
            stopColor={gradientStopColor}
          />
        </linearGradient>
        <style>{`
          .g-start-${id}{ stop-color: ${gradientStartColor}; }
          .g-end-${id}{ stop-color: ${gradientStopColor}; }
          @media (prefers-color-scheme: dark) {
            .g-start-${id}{ stop-color: var(--text-primary); }
            .g-end-${id}{ stop-color: var(--text-primary); }
          }

          @keyframes dash-${id} {
            to { stroke-dashoffset: -2000; }
          }
        `}</style>
      </defs>

      {/* subtle glow behind the beam for visibility */}
      <path
        d={d}
        fill="none"
        stroke="rgba(139,92,246,0.18)"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(6px)", opacity: 0.9 }}
      />

      <path
        id={pathId}
        d={d}
        fill="none"
        stroke={`url(#g-${id})`}
        strokeWidth={pathWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-100"
        style={{
          filter: "drop-shadow(0 6px 18px rgba(139,92,246,0.22))",
          opacity: pathOpacity,
        }}
      />

      {/* animated pulse overlay */}
      <path
        d={d}
        fill="none"
        stroke={`url(#g-${id})`}
        strokeWidth={Math.max(2, pathWidth - 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={Math.min(1, pathOpacity)}
        style={{
          strokeDasharray: "20 120",
          strokeDashoffset: 0,
          animation: `dash-${id} ${duration}s linear ${delay}s infinite`,
        }}
      />

      {/* reverse pulse for bi-directional look, same animation reversed */}
      {bidirectional && (
        <path
          d={d}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={Math.max(2, pathWidth - 2)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={Math.min(1, pathOpacity * 0.8)}
          style={{
            strokeDasharray: "20 120",
            strokeDashoffset: 0,
            animation: anim,
            animationDirection: "reverse",
          }}
        />
      )}

      {/* small glow/particle moving along the path (optional) */}
      {showDot && (
        <circle r={6} fill="#fff" className="drop-shadow-lg">
          <animateMotion dur="1.6s" repeatCount="indefinite">
            <mpath xlinkHref={`#${pathId}`} />
          </animateMotion>
        </circle>
      )}
    </svg>
  );
}
