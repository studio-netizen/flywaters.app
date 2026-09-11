import { supabase } from "@/integrations/supabase/client";

export type R2Folder = "posts" | "avatars" | "spots" | "blog" | "reports" | "reviews";

interface SignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
}

/**
 * Upload a (pre-compressed) file to Cloudflare R2 via a server-signed PUT URL.
 * Returns the public URL to store in the database.
 *
 * @param file       File to upload (compress before calling this).
 * @param folder     Logical folder: posts | avatars | spots | blog | reports | reviews.
 * @param opts.path  Optional stable filename (e.g. "avatar.webp") for upsert.
 * @param opts.adminToken Optional admin JWT for admin-only folders (e.g. blog).
 */
export async function uploadToR2(
  file: File,
  folder: R2Folder,
  opts: { path?: string; adminToken?: string; onProgress?: (pct: number) => void } = {},
): Promise<string> {
  const headers: Record<string, string> = {};
  if (opts.adminToken) headers["x-admin-token"] = opts.adminToken;

  let lastError: Error | null = null;

  // Retry the whole sign+PUT cycle: mobile networks drop connections often.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
    try {
      const { data, error } = await supabase.functions.invoke<SignResponse>("r2-sign-upload", {
        body: {
          folder,
          contentType: file.type || "application/octet-stream",
          filename: opts.path ? undefined : file.name,
          path: opts.path,
          size: file.size,
        },
        headers,
      });
      if (error || !data?.uploadUrl) {
        throw new Error(error?.message || "Failed to sign R2 upload");
      }

      // XHR-based PUT so we can report upload progress to the caller.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl);
        xhr.timeout = 120000;
        xhr.setRequestHeader("Content-Type", data.contentType);
        if (opts.onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              opts.onProgress!(Math.min(99, Math.round((e.loaded / e.total) * 100)));
            }
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            opts.onProgress?.(100);
            resolve();
          } else {
            reject(new Error(`R2 upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Connessione interrotta durante il caricamento"));
        xhr.ontimeout = () => reject(new Error("Caricamento troppo lento, riprova"));
        xhr.onabort = () => reject(new Error("Caricamento annullato"));
        xhr.send(file);
      });

      return data.publicUrl;
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error(String(e));
      opts.onProgress?.(0);
    }
  }

  throw lastError || new Error("Upload failed");
}



/**
 * Delete a file from R2 by its public URL. Server validates ownership
 * (key must be under the caller's user id) or admin token.
 */
export async function deleteFromR2(
  url: string,
  opts: { adminToken?: string } = {},
): Promise<void> {
  if (!url) return;
  const headers: Record<string, string> = {};
  if (opts.adminToken) headers["x-admin-token"] = opts.adminToken;

  const { error } = await supabase.functions.invoke("r2-delete", {
    body: { url },
    headers,
  });
  if (error) {
    // Don't throw — we don't want to block DB cleanup if the object is already gone.
    // eslint-disable-next-line no-console
    console.warn("R2 delete failed (ignored):", error.message);
  }
}

/** True if a URL is hosted on our R2 public bucket. */
export function isR2Url(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = (import.meta as any).env?.VITE_R2_PUBLIC_URL;
  if (base) return url.startsWith(base);
  // Heuristic fallback: r2.dev or r2.cloudflarestorage.com
  return /r2\.(dev|cloudflarestorage\.com)/.test(url);
}
