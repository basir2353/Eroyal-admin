import { apiImportImageUrl } from "./api";

export const CAROUSEL_BANNER_WIDTH = 1024;
export const CAROUSEL_BANNER_HEIGHT = 320;
export const CAROUSEL_BANNER_ASPECT_RATIO = CAROUSEL_BANNER_WIDTH / CAROUSEL_BANNER_HEIGHT;
export const CAROUSEL_BANNER_SIZE_LABEL = `${CAROUSEL_BANNER_WIDTH} × ${CAROUSEL_BANNER_HEIGHT} px (3.2:1 aspect ratio)`;

/** Normalize and validate a carousel banner image URL or path. */
export function normalizeCarouselImageUrl(raw: string): string {
  let trimmed = raw.trim().replace(/^['"`]+|['"`]+$/g, "");
  trimmed = trimmed.replace(/[)\]}>,.;]+$/g, "");
  if (!trimmed) return "";

  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed)) {
      trimmed = `http://${trimmed}`;
    } else if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname) return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }

  if (trimmed.startsWith("/")) {
    return trimmed.split(/\s/)[0] ?? "";
  }

  return "";
}

/** Best-effort preview check — many hosts block admin previews even when the URL works on the storefront. */
export function verifyCarouselImageUrl(
  displayUrl: string,
  timeoutMs = 8000,
): Promise<boolean> {
  const trimmed = displayUrl.trim();
  if (!trimmed) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.referrerPolicy = "no-referrer";
    img.src = trimmed;
  });
}

function extractUploadPath(url: string): string | null {
  if (url.startsWith("/uploads/")) return url.split("?")[0] ?? url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname.split("?")[0] ?? parsed.pathname;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Normalize slide image paths before saving to CMS. */
export function normalizeStoredCarouselImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/images/")) {
    return trimmed.split("?")[0] ?? trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/uploads/") || parsed.pathname.startsWith("/images/")) {
        return parsed.pathname.split("?")[0] ?? parsed.pathname;
      }
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/** Resolve a pasted banner URL to a stored path, importing external links via the backend. */
export async function resolveCarouselBannerUrl(raw: string): Promise<string> {
  const normalized = normalizeCarouselImageUrl(raw);
  if (!normalized) {
    throw new Error("Enter a valid image URL (https://…, /uploads/…, or /images/…).");
  }

  if (normalized.startsWith("/images/")) {
    return normalized.split("?")[0] ?? normalized;
  }

  const existingUpload = extractUploadPath(normalized);
  if (existingUpload) {
    return existingUpload;
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error("Enter a valid image URL.");
  }

  try {
    const imported = await apiImportImageUrl(normalized);
    const stored = extractUploadPath(imported.url) ?? imported.url;
    return normalizeStoredCarouselImageUrl(stored);
  } catch (err) {
    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }
    throw err;
  }
}

/** Center-crop and scale to the exact carousel banner size when needed. */
export async function normalizeCarouselBannerFile(
  file: File,
): Promise<{ file: File; adjusted: boolean; fromSize?: string }> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (width === CAROUSEL_BANNER_WIDTH && height === CAROUSEL_BANNER_HEIGHT) {
    bitmap.close();
    return { file, adjusted: false };
  }

  const targetAspect = CAROUSEL_BANNER_ASPECT_RATIO;
  const sourceAspect = width / height;

  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (sourceAspect > targetAspect) {
    sw = height * targetAspect;
    sx = (width - sw) / 2;
  } else if (sourceAspect < targetAspect) {
    sh = width / targetAspect;
    sy = (height - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CAROUSEL_BANNER_WIDTH;
  canvas.height = CAROUSEL_BANNER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not prepare banner image.");
  }

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, CAROUSEL_BANNER_WIDTH, CAROUSEL_BANNER_HEIGHT);
  bitmap.close();

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = mimeType === "image/jpeg" ? 0.92 : undefined;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not encode banner image."))),
      mimeType,
      quality,
    );
  });

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "carousel-banner";
  const normalized = new File([blob], `${baseName}-${CAROUSEL_BANNER_WIDTH}x${CAROUSEL_BANNER_HEIGHT}.${extension}`, {
    type: mimeType,
  });

  return {
    file: normalized,
    adjusted: true,
    fromSize: `${width} × ${height}`,
  };
}
