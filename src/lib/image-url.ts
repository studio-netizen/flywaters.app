/**
 * Build optimized image URLs and responsive srcset.
 * - For Supabase Storage public URLs, rewrites to the image-transform
 *   endpoint (`/render/image/public/`) and appends width/quality.
 * - For other hosts (e.g. Cloudflare R2), returns the URL unchanged
 *   (srcset still emitted so the browser can pick the smallest).
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  width = 800,
  quality = 75,
): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.pathname.includes('/storage/v1/object/public/')) {
      u.pathname = u.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/',
      );
    }
    if (u.pathname.includes('/storage/v1/render/image/public/')) {
      u.searchParams.set('width', String(width));
      u.searchParams.set('quality', String(quality));
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function getImageSrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 800, 1200],
  quality = 75,
): string {
  if (!url) return '';
  return widths
    .map((w) => `${getOptimizedImageUrl(url, w, quality)} ${w}w`)
    .join(', ');
}
