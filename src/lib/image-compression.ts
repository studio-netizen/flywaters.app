import imageCompression from 'browser-image-compression';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Absolute cap accepted by the signed-upload endpoint. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Cap for the file the user can pick (source, before compression). */
export const MAX_SOURCE_BYTES = 60 * 1024 * 1024;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

type Preset = 'default' | 'avatar' | 'blog';

const presets: Record<Preset, { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }> = {
  default: { maxSizeMB: 1.5, maxWidthOrHeight: 1920, initialQuality: 0.82 },
  avatar: { maxSizeMB: 0.3, maxWidthOrHeight: 400, initialQuality: 0.85 },
  blog: { maxSizeMB: 1.0, maxWidthOrHeight: 1200, initialQuality: 0.85 },
};

export function validateImageFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  if (!ACCEPTED_TYPES.includes(type) && !validExt.includes(ext)) {
    return 'Formato non supportato. Usa JPG, PNG, WebP o HEIC.';
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `Immagine troppo grande (${formatFileSize(file.size)}). Massimo ${formatFileSize(MAX_SOURCE_BYTES)}.`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renameTo(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, '') + '.' + ext;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decoding (Safari HEIC path) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Canvas fallback: always produces a JPEG/WebP under `targetBytes`, degrading
 * quality then dimensions. Works for HEIC on browsers that decode it natively.
 */
async function canvasCompress(
  file: File,
  maxWidthOrHeight: number,
  targetBytes: number,
): Promise<File | null> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    return null;
  }
  const sw = (source as ImageBitmap).width || (source as HTMLImageElement).naturalWidth;
  const sh = (source as ImageBitmap).height || (source as HTMLImageElement).naturalHeight;
  if (!sw || !sh) return null;

  const mime = 'image/webp';
  let dimension = maxWidthOrHeight;

  for (let pass = 0; pass < 4; pass++) {
    const scale = Math.min(1, dimension / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);

    for (const quality of [0.82, 0.7, 0.6, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, quality),
      );
      if (!blob) break;
      if (blob.size <= targetBytes) {
        return new File([blob], renameTo(file.name, 'webp'), { type: blob.type || mime });
      }
    }
    dimension = Math.round(dimension * 0.7);
  }
  return null;
}

/**
 * Compress an image before upload. Never throws: if every strategy fails it
 * returns the original file, but it guarantees the returned file is under the
 * upload hard cap whenever compression succeeded.
 */
export async function compressImage(
  file: File,
  type: Preset = 'default',
): Promise<CompressionResult> {
  const originalSize = file.size;
  const preset = presets[type];
  const targetBytes = preset.maxSizeMB * 1024 * 1024;
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

  // 1) Library path (skipped for HEIC — it cannot decode it in most browsers).
  if (!isHeic) {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: preset.maxSizeMB,
        maxWidthOrHeight: preset.maxWidthOrHeight,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: preset.initialQuality,
      });
      if (compressed.size <= MAX_UPLOAD_BYTES) {
        return {
          file: new File([compressed], renameTo(file.name, 'webp'), { type: 'image/webp' }),
          originalSize,
          compressedSize: compressed.size,
          wasCompressed: true,
        };
      }
    } catch {
      /* fall through to canvas */
    }
  }

  // 2) Canvas fallback (HEIC, huge files, worker failures).
  const viaCanvas =
    (await canvasCompress(file, preset.maxWidthOrHeight, targetBytes)) ??
    (await canvasCompress(file, preset.maxWidthOrHeight, MAX_UPLOAD_BYTES * 0.9));
  if (viaCanvas) {
    return {
      file: viaCanvas,
      originalSize,
      compressedSize: viaCanvas.size,
      wasCompressed: true,
    };
  }

  // 3) Give up on compression: only allow the original through if it fits.
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      'Non riesco a comprimere questa immagine ed è troppo grande. Prova a ridurne le dimensioni o a scattare/esportare in JPG.',
    );
  }
  return { file, originalSize, compressedSize: file.size, wasCompressed: false };
}
