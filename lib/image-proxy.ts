/**
 * Image Proxy Utilities
 *
 * Helps prevent rate limiting from external CDNs (like Google's lh3.googleusercontent.com)
 * by proxying images through our own server with caching.
 */

const EXTERNAL_IMAGE_DOMAINS = [
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "platform-lookaside.fbsbx.com",
  "graph.facebook.com",
  "pbs.twimg.com",
  "media.licdn.com",
];

/**
 * Wraps an external image URL with our proxy to avoid rate limiting.
 * Only proxies images from known external domains.
 *
 * @param imageUrl - The original image URL
 * @returns The proxied URL or original URL if not from an external domain
 */
export function getProxiedImageUrl(
  imageUrl: string | null | undefined
): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  try {
    const url = new URL(imageUrl);

    // Check if the image is from an external domain we want to proxy
    const shouldProxy = EXTERNAL_IMAGE_DOMAINS.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );

    if (shouldProxy) {
      // Return proxied URL
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    }

    // Return original URL for internal images
    return imageUrl;
  } catch {
    // If URL parsing fails, return original
    return imageUrl;
  }
}

/**
 * Check if an image URL is from an external domain that should be proxied
 */
export function isExternalImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) {
    return false;
  }

  try {
    const url = new URL(imageUrl);
    return EXTERNAL_IMAGE_DOMAINS.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
