"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

interface AvatarImageProps
  extends Omit<
    React.ComponentProps<typeof AvatarPrimitive.Image>,
    "asChild" | "src"
  > {
  alt: string;
  src?: string;
}

function AvatarImage({ className, src, alt, ...props }: AvatarImageProps) {
  if (!src) {
    console.log("⚠️ AvatarImage: No src provided");
    return null;
  }

  console.log("🖼️ AvatarImage rendering with src:", src);

  // Use img tag instead of Next Image to debug
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={src}
      alt={alt}
      onError={(e) => {
        console.error("❌ Radix Image failed to load:", src, e);
      }}
      onLoad={() => {
        console.log("✅ Radix Image loaded successfully:", src);
      }}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
