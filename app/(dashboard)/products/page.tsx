"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { formatCurrency, parsePrice, resolveMediaUrl } from "@/lib/utils";
import {
  NO_SALE_BADGE,
  SALE_BADGE_OPTIONS,
  computeDiscountFromPrices,
  computeSalePriceFromDiscount,
  fromDatetimeLocalValue,
  getOfferStatus,
  saleBadgeFromApi,
  saleBadgeToApi,
  toDatetimeLocalValue,
} from "@/lib/product-offer";
import { MediaImagePicker } from "@/components/shared/media-image-picker";
import { DateTimePicker } from "@/components/shared/datetime-picker";

type Category = { _id?: string; id?: string; name: string };

const emptyForm = {
  name: "",
  slug: "",
  categoryId: "",
  stock: "0",
  regularPrice: "",
  salePrice: "",
  status: "published",
  shortDescription: "",
  imageUrls: [] as string[],
  featured: false,
  mostLoved: false,
  onSale: false,
  saleBadge: "SALE",
  discountPercent: "",
  offerStartDate: "",
  offerEndDate: "",
};

function slugPreview(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ProductPrice({ row }: { row: Record<string, unknown> }) {
  const regular = parsePrice(row.regularPrice);
  const sale = parsePrice(row.salePrice);
  const onSale = Boolean(row.onSale) && sale != null;
  const offerStatus = getOfferStatus(row);

  if (onSale && regular != null) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-primary">{formatCurrency(sale)}</span>
        <span className="text-xs text-muted-foreground line-through">{formatCurrency(regular)}</span>
        {Boolean(row.saleBadge) ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
            {String(row.saleBadge)}
          </span>
        ) : null}
        {offerStatus === "expired" && (
          <span className="text-[10px] text-destructive">Expired</span>
        )}
        {offerStatus === "scheduled" && (
          <span className="text-[10px] font-medium text-amber-600">
            Scheduled — hidden on storefront
          </span>
        )}
        {offerStatus === "active" && (
          <span className="text-[10px] font-medium text-emerald-600">
            Live on storefront{row.saleBadge ? "" : " (no badge)"}
          </span>
        )}
      </div>
    );
  }

  return <span>{formatCurrency(regular ?? sale)}</span>;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: Record<string, unknown>[] }>("/products");
      setProducts(res.items ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiGet<{ items: Category[] } | Category[]>("/categories")
      .then((res) => setCategories(Array.isArray(res) ? res : (res.items ?? [])))
      .catch(() => setCategories([]));
    loadProducts();
  }, [loadProducts]);

  const categoryName = useCallback(
    (row: Record<string, unknown>) => {
      if (row.categoryName) return String(row.categoryName);
      const catId = String(row.categoryId ?? row.category ?? "");
      const cat = categories.find((c) => String(c._id ?? c.id) === catId);
      return cat?.name ?? "—";
    },
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((row) => String(row.name ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const openAddPanel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openEditPanel = useCallback((product: Record<string, unknown>) => {
    const imageUrls = Array.isArray(product.images)
      ? (product.images as { url?: string }[] | string[])
          .map((i) => (typeof i === "string" ? i : i.url ?? ""))
          .filter(Boolean)
      : [];
    const category = product.category as { id?: string; _id?: string } | string | undefined;
    const categoryId = String(
      product.categoryId ??
        (typeof category === "object" && category
          ? (category.id ?? category._id ?? "")
          : category ?? ""),
    );

    setForm({
      name: String(product.name ?? ""),
      slug: String(product.slug ?? ""),
      categoryId,
      stock: String(product.stock ?? 0),
      regularPrice:
        parsePrice(product.regularPrice) != null ? String(parsePrice(product.regularPrice)) : "",
      salePrice:
        product.onSale && parsePrice(product.salePrice) != null
          ? String(parsePrice(product.salePrice))
          : "",
      status: String(product.status ?? "published"),
      shortDescription: String(product.shortDescription ?? ""),
      imageUrls,
      featured: Boolean(product.isFeatured ?? product.featured),
      mostLoved: Boolean(product.isMostLoved ?? product.mostLoved),
      onSale: Boolean(product.onSale),
      saleBadge: product.onSale ? saleBadgeFromApi(product.saleBadge) : "SALE",
      discountPercent:
        product.onSale && product.discountPercent != null
          ? String(product.discountPercent)
          : "",
      offerStartDate: product.onSale ? toDatetimeLocalValue(product.offerStartDate) : "",
      offerEndDate: product.onSale ? toDatetimeLocalValue(product.offerEndDate) : "",
    });
    setEditingId(String(product._id ?? product.id));
    setFormError(null);
    setPanelOpen(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    if (form.onSale) {
      const regular = Number(form.regularPrice);
      const sale = Number(form.salePrice);
      if (!form.regularPrice || !Number.isFinite(regular) || regular <= 0) {
        setFormError("Enter a valid regular price greater than 0.");
        setSaving(false);
        return;
      }
      if (regular > 9999999999.99) {
        setFormError("Regular price is too large. Maximum allowed is 9,999,999,999.99 PKR.");
        setSaving(false);
        return;
      }
      if (!form.salePrice || !Number.isFinite(sale) || sale <= 0) {
        setFormError("Sale price is required when the sale is enabled.");
        setSaving(false);
        return;
      }
      if (sale > 9999999999.99) {
        setFormError("Sale price is too large. Maximum allowed is 9,999,999,999.99 PKR.");
        setSaving(false);
        return;
      }
      if (!Number.isFinite(regular) || sale >= regular) {
        setFormError("Sale price must be lower than the regular price.");
        setSaving(false);
        return;
      }
    } else if (!form.regularPrice || !Number.isFinite(Number(form.regularPrice)) || Number(form.regularPrice) <= 0) {
      setFormError("Enter a valid regular price greater than 0.");
      setSaving(false);
      return;
    } else if (Number(form.regularPrice) > 9999999999.99) {
      setFormError("Regular price is too large. Maximum allowed is 9,999,999,999.99 PKR.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      categoryId: form.categoryId,
      stock: Number(form.stock),
      regularPrice: Number(form.regularPrice),
      salePrice: form.onSale && form.salePrice ? Number(form.salePrice) : undefined,
      status: form.status,
      shortDescription: form.shortDescription,
      images: form.imageUrls.filter(Boolean),
      isFeatured: form.featured,
      isMostLoved: form.mostLoved,
      onSale: form.onSale,
      saleBadge: form.onSale ? saleBadgeToApi(form.saleBadge) : undefined,
      discountPercent:
        form.onSale && form.discountPercent ? Number(form.discountPercent) : undefined,
      offerStartDate: form.onSale ? fromDatetimeLocalValue(form.offerStartDate) : undefined,
      offerEndDate: form.onSale ? fromDatetimeLocalValue(form.offerEndDate) : undefined,
    };

    try {
      if (editingId) {
        await apiPut(`/products/${editingId}`, payload);
        setSuccessMessage("Product updated successfully.");
      } else {
        await apiPost("/products", payload);
        setSuccessMessage("Product added successfully.");
      }
      closePanel();
      await loadProducts();
      window.setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not save product. Please check the form and try again.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await apiDelete(`/products/${id}`);
    setSuccessMessage("Product deleted.");
    await loadProducts();
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Add, edit, and manage your mango catalog"
      />

      <div className="admin-content space-y-4">
        {successMessage && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Products</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Click Edit on any row, or use Add Product to open the quick form.
              </p>
            </div>
            <Button type="button" onClick={openAddPanel}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading products…</p>
            ) : filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No products match your search." : "No products yet. Add your first product."}
              </p>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Image</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((row) => {
                      const id = String(row._id ?? row.id);
                      const images = Array.isArray(row.images) ? row.images : [];
                      const firstImage =
                        typeof images[0] === "string"
                          ? images[0]
                          : (images[0] as { url?: string } | undefined)?.url;

                      return (
                        <tr
                          key={id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3">
                            {firstImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolveMediaUrl(firstImage)}
                                alt=""
                                className="h-11 w-11 rounded-md border border-border object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">{String(row.name ?? "-")}</td>
                          <td className="px-4 py-3 text-muted-foreground">{categoryName(row)}</td>
                          <td className="px-4 py-3">{String(row.stock ?? 0)}</td>
                          <td className="px-4 py-3">
                            <ProductPrice row={row} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={row.status === "published" ? "default" : "secondary"}>
                              {String(row.status ?? "-")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openEditPanel(row)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(id, String(row.name ?? "product"))}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close panel"
            onClick={closePanel}
          />
          <div className="admin-slide-panel max-w-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
                <p className="text-sm text-muted-foreground max-sm:hidden">
                  Fill in the basics, upload a photo, then save.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-md p-2 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Basic info
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Chaunsa Mango 5kg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <select
                      id="categoryId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={String(cat._id ?? cat.id)} value={String(cat._id ?? cat.id)}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="regularPrice">Price (PKR) *</Label>
                      <Input
                        id="regularPrice"
                        type="number"
                        min="1"
                        max="9999999999"
                        step="1"
                        value={form.regularPrice}
                        onChange={(e) => {
                          const regularPrice = e.target.value;
                          setForm((f) => {
                            const next = { ...f, regularPrice };
                            if (f.onSale && f.discountPercent) {
                              const regular = Number(regularPrice);
                              const discount = Number(f.discountPercent);
                              const computed = computeSalePriceFromDiscount(regular, discount);
                              if (computed != null) next.salePrice = String(computed);
                            }
                            return next;
                          });
                        }}
                        placeholder="2500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Short description</Label>
                    <Textarea
                      id="shortDescription"
                      value={form.shortDescription}
                      onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                      placeholder="Brief text shown on product cards"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL slug (optional)</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                    />
                    {form.name && !form.slug && (
                      <p className="text-xs text-muted-foreground">
                        Auto slug: {slugPreview(form.name)}
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <MediaImagePicker
                    value={form.imageUrls}
                    onChange={(imageUrls) => setForm((f) => ({ ...f, imageUrls }))}
                  />
                </section>

                <section className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.mostLoved}
                      onChange={(e) => setForm((f) => ({ ...f, mostLoved: e.target.checked }))}
                    />
                    Most Loved
                  </label>
                </section>

                <section className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Sale / Offer
                    </h3>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.onSale}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            onSale: e.target.checked,
                            ...(e.target.checked
                              ? {
                                  saleBadge:
                                    f.saleBadge && f.saleBadge !== NO_SALE_BADGE
                                      ? f.saleBadge
                                      : "SALE",
                                }
                              : {
                                  salePrice: "",
                                  discountPercent: "",
                                  offerStartDate: "",
                                  offerEndDate: "",
                                }),
                          }))
                        }
                      />
                      Enable sale
                    </label>
                  </div>

                  {form.onSale && (
                    <>
                      {(() => {
                        const preview = {
                          onSale: form.onSale,
                          salePrice: form.salePrice ? Number(form.salePrice) : null,
                          regularPrice: form.regularPrice ? Number(form.regularPrice) : null,
                          offerStartDate: fromDatetimeLocalValue(form.offerStartDate),
                          offerEndDate: fromDatetimeLocalValue(form.offerEndDate),
                        };
                        const status = getOfferStatus(preview);
                        const startLabel = form.offerStartDate
                          ? new Date(form.offerStartDate).toLocaleString()
                          : null;
                        const endLabel = form.offerEndDate
                          ? new Date(form.offerEndDate).toLocaleString()
                          : null;
                        return (
                          <div
                            className={`rounded-md border px-3 py-2 text-xs ${
                              status === "active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : status === "scheduled"
                                  ? "border-amber-200 bg-amber-50 text-amber-900"
                                  : status === "expired"
                                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                                    : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            <p className="font-medium">
                              Storefront status:{" "}
                              {status === "active"
                                ? "Active now — badge and sale price will show"
                                : status === "scheduled"
                                  ? "Scheduled — hidden until start date"
                                  : status === "expired"
                                    ? "Expired — hidden on storefront"
                                    : "Sale disabled"}
                            </p>
                            {status === "scheduled" && startLabel && (
                              <p className="mt-1">
                                Starts: {startLabel}. Clear the start date to show the deal immediately.
                              </p>
                            )}
                            {status === "expired" && endLabel && (
                              <p className="mt-1">Ended: {endLabel}. Update or clear the end date to reactivate.</p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="saleBadge">Sale badge</Label>
                          <select
                            id="saleBadge"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={
                              form.saleBadge === NO_SALE_BADGE
                                ? NO_SALE_BADGE
                                : SALE_BADGE_OPTIONS.includes(
                                      form.saleBadge as (typeof SALE_BADGE_OPTIONS)[number],
                                    )
                                  ? form.saleBadge
                                  : "__custom"
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              setForm((f) => ({
                                ...f,
                                saleBadge:
                                  value === "__custom"
                                    ? ""
                                    : value === NO_SALE_BADGE
                                      ? NO_SALE_BADGE
                                      : value,
                              }));
                            }}
                          >
                            <option value={NO_SALE_BADGE}>No badge (sale price only)</option>
                            {SALE_BADGE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                            <option value="__custom">Custom…</option>
                          </select>
                          {form.saleBadge !== NO_SALE_BADGE &&
                            !SALE_BADGE_OPTIONS.includes(
                              form.saleBadge as (typeof SALE_BADGE_OPTIONS)[number],
                            ) && (
                            <Input
                              value={form.saleBadge}
                              onChange={(e) => setForm((f) => ({ ...f, saleBadge: e.target.value }))}
                              placeholder="Custom badge text"
                              maxLength={40}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discountPercent">Discount %</Label>
                          <Input
                            id="discountPercent"
                            type="number"
                            min="1"
                            max="99"
                            step="1"
                            value={form.discountPercent}
                            onChange={(e) => {
                              const discountPercent = e.target.value;
                              setForm((f) => {
                                const next = { ...f, discountPercent };
                                const regular = Number(f.regularPrice);
                                const discount = Number(discountPercent);
                                const computed = computeSalePriceFromDiscount(regular, discount);
                                if (computed != null) next.salePrice = String(computed);
                                return next;
                              });
                            }}
                            placeholder="e.g. 20"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="salePrice">Sale price (PKR) *</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            min="1"
                            max="9999999999"
                            step="1"
                            value={form.salePrice}
                            required={form.onSale}
                            onChange={(e) => {
                              const salePrice = e.target.value;
                              setForm((f) => {
                                const next = { ...f, salePrice };
                                const regular = Number(f.regularPrice);
                                const sale = Number(salePrice);
                                const computed = computeDiscountFromPrices(regular, sale);
                                if (computed != null) next.discountPercent = String(computed);
                                return next;
                              });
                            }}
                            placeholder="1999"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                            {form.regularPrice && form.salePrice ? (
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-muted-foreground line-through">
                                  {formatCurrency(Number(form.regularPrice))}
                                </span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(Number(form.salePrice))}
                                </span>
                                {form.discountPercent && (
                                  <span className="text-xs text-muted-foreground">
                                    ({form.discountPercent}% off)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Set regular and sale price</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="offerStartDate">Offer start (optional)</Label>
                          <DateTimePicker
                            id="offerStartDate"
                            value={form.offerStartDate}
                            onChange={(offerStartDate) => setForm((f) => ({ ...f, offerStartDate }))}
                            placeholder="Select offer start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="offerEndDate">Offer end (optional)</Label>
                          <DateTimePicker
                            id="offerEndDate"
                            value={form.offerEndDate}
                            onChange={(offerEndDate) => setForm((f) => ({ ...f, offerEndDate }))}
                            placeholder="Select offer end"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave dates empty for an always-on sale. Expired offers are hidden automatically
                        on the storefront.
                      </p>
                    </>
                  )}
                </section>

                {formError && <p className="text-sm text-destructive">{formError}</p>}
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:px-5">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Add Product"}
                </Button>
                <Button type="button" variant="outline" onClick={closePanel}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
