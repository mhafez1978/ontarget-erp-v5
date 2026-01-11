"use client";

import React, { useEffect, useState } from "react";
import LocalAnimatedBeam from "./AnimatedBeam";

// Lightweight wrapper that will try to use the official Magic UI AnimatedBeam when available,
// and fallback to our local implementation when not.

type Props = React.ComponentProps<typeof LocalAnimatedBeam>;

export default function AnimatedBeamMagic(props: Props) {
  const [MagicComp, setMagicComp] =
    useState<React.ComponentType<unknown> | null>(null);

  useEffect(() => {
    let mounted = true;
    // Dynamically import the package at runtime using a non-literal specifier
    // so static bundlers won't try to resolve it at build time when it's not installed.
    const pkg = "@" + "magicui" + "/animated-beam";
    import(pkg)
      .then((mod: unknown) => {
        const modObj = mod as
          | {
              AnimatedBeam?: React.ComponentType<unknown>;
              default?: React.ComponentType<unknown>;
            }
          | undefined;
        const Comp = modObj?.AnimatedBeam ?? modObj?.default;
        if (mounted && Comp)
          setMagicComp(() => Comp as React.ComponentType<unknown>);
      })
      .catch(() => {
        // package not installed or load failed — we'll fall back to local component
        if (mounted) setMagicComp(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (MagicComp) {
    // Render package component — cast to unknown to bypass strict typing (we can't type the external lib reliably)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.createElement(MagicComp as any, props as any);
  }

  // Fallback to local implementation
  return <LocalAnimatedBeam {...props} />;
}
