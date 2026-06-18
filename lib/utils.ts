import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: unknown, currency = "PKR") {
  const value = parsePrice(amount);
  if (value == null) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Parse API prices (number, string, or Prisma Decimal shape). */
export function parsePrice(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    const decimal = value as { toNumber?: () => number; s?: number; e?: number; d?: number[] };
    if (typeof decimal.toNumber === "function") return decimal.toNumber();
    if (Array.isArray(decimal.d)) {
      const digits = decimal.d.join("");
      if (!digits) return 0;
      const exponent = (decimal.e ?? 0) - digits.length + 1;
      const num = Number(digits) * 10 ** exponent;
      return (decimal.s ?? 1) < 0 ? -num : num;
    }
  }
  return null;
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
  /\/api\/?$/,
  "",
);
export const STOREFRONT_ORIGIN =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

/** Same catalog paths as the storefront — served from adminpanel/public/images. */
const CATALOG_IMAGE_FALLBACKS: Record<string, string> = {
  "chaunsa-premium-variety.png": "/images/chaunsa-premium-variety.png",
  "chaunsa-premium-variety.jpg": "/images/chaunsa-premium-variety.jpg",
  "chaunsa-mango-premium.png": "/images/chaunsa-mango-premium.png",
  "chaunsa-mango-premium.jpg": "/images/chaunsa-mango-premium.jpg",
  "dasheri-mango.png": "/images/dasheri-mango.png",
  "dasheri-mango.jpg": "/images/dasheri-mango.jpg",
  "anwar-ratol-mango.png": "/images/anwar-ratol-mango.png",
  "anwar-ratol-mango.jpg": "/images/anwar-ratol-mango.jpg",
  "chaunsa-hand-picked.png": "/images/chaunsa-hand-picked.png",
  "chaunsa-hand-picked.jpg": "/images/chaunsa-hand-picked.jpg",
  "e-royal-mango-logo.png": "/images/e-royal-mango-logo.png",
};

/** Turn stored media paths into browser-loadable URLs. */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
  if (url.startsWith("/images/")) {
    const file = url.split("/").pop() ?? "";
    return CATALOG_IMAGE_FALLBACKS[file] ?? url;
  }
  if (url.startsWith("/")) return `${STOREFRONT_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}

/** Blog featured images — use admin-local catalog paths and API uploads. */
export function resolveBlogMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";

  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${API_ORIGIN}${parsed.pathname}`;
      }
      if (parsed.pathname.startsWith("/images/")) {
        const file = parsed.pathname.split("/").pop() ?? "";
        return CATALOG_IMAGE_FALLBACKS[file] ?? parsed.pathname;
      }
    } catch {
      /* keep full URL */
    }
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) return `${API_ORIGIN}${trimmed}`;
  if (trimmed.startsWith("/images/")) {
    const file = trimmed.split("/").pop() ?? "";
    return CATALOG_IMAGE_FALLBACKS[file] ?? trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;

  return trimmed;
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
