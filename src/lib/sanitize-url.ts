/**
 * Returns the URL if it is a safe http(s) URL, otherwise null.
 * Prevents javascript:, data:, vbscript: and other dangerous schemes.
 */
export function sanitizeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
