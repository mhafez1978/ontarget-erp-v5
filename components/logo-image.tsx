"use client";

import Image from "next/image";
import { ImgHTMLAttributes } from "react";

/**
 * Logo Image Component
 *
 * Handles both base64 data URLs and regular image paths.
 * Base64 images (stored before cold storage setup) need unoptimized prop.
 * File paths (stored after cold storage setup) use Next.js optimization.
 */
interface LogoImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
}

export function LogoImage({
  src,
  alt,
  fill,
  width,
  height,
  priority,
  className,
  style,
  sizes,
}: LogoImageProps) {
  const isBase64 = src?.startsWith("data:image/");

  if (isBase64) {
    // For base64 data URLs, use unoptimized to bypass Next.js image optimization
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          className={className}
          style={style}
          sizes={sizes}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width || 100}
        height={height || 100}
        unoptimized
        priority={priority}
        className={className}
        style={style}
        sizes={sizes}
      />
    );
  }

  // For regular paths, use optimized Next.js Image
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={className}
        style={style}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      priority={priority}
      className={className}
      style={style}
      sizes={sizes}
    />
  );
}
