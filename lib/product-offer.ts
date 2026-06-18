export const SALE_BADGE_OPTIONS = [
  "SALE",
  "HOT DEAL",
  "LIMITED OFFER",
  "BEST PRICE",
  "NEW DEAL",
] as const;

export type SaleBadgeOption = (typeof SALE_BADGE_OPTIONS)[number];

/** Form sentinel: sale pricing without a storefront badge label. */
export const NO_SALE_BADGE = "__none__";

export function saleBadgeFromApi(value: unknown): string {
  const badge = String(value ?? "").trim();
  return badge || NO_SALE_BADGE;
}

export function saleBadgeToApi(formValue: string): string | null {
  if (formValue === NO_SALE_BADGE) return null;
  const badge = formValue.trim();
  return badge || null;
}

export function toDatetimeLocalValue(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function isOfferExpired(row: Record<string, unknown>) {
  const end = row.offerEndDate ? new Date(String(row.offerEndDate)) : null;
  return Boolean(end && !Number.isNaN(end.getTime()) && end.getTime() < Date.now());
}

export function isOfferScheduled(row: Record<string, unknown>) {
  const start = row.offerStartDate ? new Date(String(row.offerStartDate)) : null;
  return Boolean(start && !Number.isNaN(start.getTime()) && start.getTime() > Date.now());
}

export function getOfferStatus(
  row: Record<string, unknown>,
): "active" | "scheduled" | "expired" | "disabled" {
  if (!row.onSale) return "disabled";

  const regular = Number(row.regularPrice);
  const sale = Number(row.salePrice);
  if (!Number.isFinite(sale) || !Number.isFinite(regular) || sale >= regular) {
    return "disabled";
  }

  if (isOfferExpired(row)) return "expired";
  if (isOfferScheduled(row)) return "scheduled";
  return "active";
}

export function computeSalePriceFromDiscount(regularPrice: number, discountPercent: number) {
  if (regularPrice <= 0 || discountPercent <= 0 || discountPercent >= 100) return null;
  return Math.round(regularPrice * (1 - discountPercent / 100));
}

export function computeDiscountFromPrices(regularPrice: number, salePrice: number) {
  if (regularPrice <= 0 || salePrice >= regularPrice) return null;
  return Math.round((1 - salePrice / regularPrice) * 100);
}
