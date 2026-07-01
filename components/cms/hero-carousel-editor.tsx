"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Link2, Plus, Trash2, Upload } from "lucide-react";
import { apiGet, apiPut, apiUploadFile, getApiErrorMessage } from "@/lib/api";
import {
  CAROUSEL_BANNER_ASPECT_RATIO,
  CAROUSEL_BANNER_SIZE_LABEL,
  normalizeCarouselBannerFile,
  normalizeStoredCarouselImageUrl,
  resolveCarouselBannerUrl,
} from "@/lib/carousel-banner";
import { resolveMediaUrl } from "@/lib/utils";
import { MediaImagePicker } from "@/components/shared/media-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type CarouselSlide = {
  id: string;
  image: string;
  alt: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
};

const BANNER_SIZE_HELP = `${CAROUSEL_BANNER_SIZE_LABEL} — upload a file or paste a direct image URL`;

function parseSlides(raw: unknown): CarouselSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? `slide-${index}`),
        image: String(row.image ?? ""),
        alt: String(row.alt ?? ""),
        link: String(row.link ?? "/products"),
        sortOrder: Number(row.sortOrder ?? index),
        isActive: row.isActive !== false,
      } satisfies CarouselSlide;
    })
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder)
    .map((slide, index) => ({ ...slide!, sortOrder: index })) as CarouselSlide[];
}

function reindexSlides(slides: CarouselSlide[]): CarouselSlide[] {
  return slides.map((slide, index) => ({ ...slide, sortOrder: index }));
}

function createSlide(sortOrder: number): CarouselSlide {
  return {
    id: crypto.randomUUID(),
    image: "",
    alt: "",
    link: "/products",
    sortOrder,
    isActive: true,
  };
}

export function HeroCarouselEditor() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickUrlDraft, setQuickUrlDraft] = useState("");
  const [quickUrlApplying, setQuickUrlApplying] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Record<string, unknown>>("/cms/hero");
      setSlides(parseSlides(data.slides));
    } catch {
      setSlides([]);
      setMessage("Could not load carousel banners.");
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const updateSlide = (id: string, patch: Partial<CarouselSlide>) => {
    setSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    );
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    setSlides((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return reindexSlides(next);
    });
  };

  const persistSlides = useCallback(
    async (nextSlides: CarouselSlide[], successMessage: string) => {
      const readySlides = reindexSlides(
        nextSlides
          .filter((slide) => slide.image.trim())
          .map((slide) => ({
            ...slide,
            image: normalizeStoredCarouselImageUrl(slide.image),
          })),
      );
      const drafts = nextSlides.filter((slide) => !slide.image.trim());

      setSaving(true);
      setMessage("");
      setError(false);

      try {
        const updated = await apiPut<Record<string, unknown>>("/cms/hero", {
          slides: readySlides,
        });
        const saved = parseSlides(updated.slides);
        setSlides(reindexSlides([...saved, ...drafts]));
        setMessage(successMessage);
      } catch (err) {
        setMessage(getApiErrorMessage(err, "Could not save carousel banners."));
        setError(true);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const removeSlide = async (id: string) => {
    const target = slides.find((slide) => slide.id === id);
    if (!target) return;

    if (!window.confirm(`Delete "${target.alt || `Banner ${slides.indexOf(target) + 1}`}" permanently?`)) {
      return;
    }

    const nextSlides = reindexSlides(slides.filter((slide) => slide.id !== id));
    if (expandedId === id) setExpandedId(null);
    setSlides(nextSlides);

    try {
      await persistSlides(
        nextSlides,
        nextSlides.some((slide) => slide.image.trim())
          ? "Banner deleted. Refresh the storefront homepage to see the update."
          : "All banners removed. The storefront carousel will be empty until you add new ones.",
      );
    } catch {
      await loadSlides();
    }
  };

  const addSlide = () => {
    const slide = createSlide(slides.length);
    setSlides((current) => reindexSlides([...current, slide]));
    setExpandedId(slide.id);
  };

  const addSlidesFromUrls = (urls: string[]) => {
    if (!urls.length) return;
    setSlides((current) => {
      const next = [...current];
      urls.forEach((url, offset) => {
        next.push({
          id: crypto.randomUUID(),
          image: url,
          alt: "",
          link: "/products",
          sortOrder: current.length + offset,
          isActive: true,
        });
      });
      return reindexSlides(next);
    });
  };

  const handleAddFromUrl = async () => {
    if (!quickUrlDraft.trim()) {
      setMessage("Enter an image URL first.");
      setError(true);
      return;
    }

    setQuickUrlApplying(true);
    setMessage("");
    setError(false);

    try {
      const storedUrl = await resolveCarouselBannerUrl(quickUrlDraft);
      const slide = createSlide(slides.length);
      slide.image = storedUrl;
      const nextSlides = reindexSlides([...slides, slide]);
      setSlides(nextSlides);
      setExpandedId(slide.id);
      setQuickUrlDraft("");

      await persistSlides(
        nextSlides,
        storedUrl.startsWith("/uploads/")
          ? "Banner imported and saved. Refresh the storefront homepage to see it."
          : "Banner added and saved. Refresh the storefront homepage to see it.",
      );
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not import image from URL."));
      setError(true);
    } finally {
      setQuickUrlApplying(false);
    }
  };

  const handleBulkUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setBulkUploading(true);
    setMessage("");
    setError(false);

    try {
      const uploaded: string[] = [];
      let adjustedCount = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        const normalized = await normalizeCarouselBannerFile(file);
        if (normalized.adjusted) adjustedCount += 1;
        const media = await apiUploadFile(normalized.file);
        if (media.url) uploaded.push(normalizeStoredCarouselImageUrl(media.url));
      }

      if (!uploaded.length) {
        setMessage("No valid images were uploaded. Use JPG, PNG, or WebP under 10MB.");
        setError(true);
        return;
      }

      addSlidesFromUrls(uploaded);
      setMessage(
        adjustedCount > 0
          ? `${uploaded.length} banner${uploaded.length === 1 ? "" : "s"} added at ${CAROUSEL_BANNER_SIZE_LABEL.replace(" aspect ratio", "")} (${adjustedCount} resized). Click Save Carousel to publish.`
          : `${uploaded.length} banner${uploaded.length === 1 ? "" : "s"} added. Click Save Carousel to publish.`,
      );
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Bulk upload failed."));
      setError(true);
    } finally {
      setBulkUploading(false);
      if (bulkInputRef.current) bulkInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const readySlides = reindexSlides(slides.filter((slide) => slide.image.trim()));
    const skipped = slides.length - readySlides.length;

    if (!readySlides.length && skipped === 0) {
      setMessage("No banners to save.");
      setError(true);
      return;
    }

    if (!readySlides.length) {
      try {
        await persistSlides(
          slides,
          "All empty drafts cleared. Add a banner image, then save again.",
        );
      } catch {
        /* persistSlides already surfaced the error */
      }
      return;
    }

    try {
      await persistSlides(
        slides,
        skipped > 0
          ? `Saved ${readySlides.length} banner${readySlides.length === 1 ? "" : "s"}. ${skipped} empty draft(s) kept — add images and save again.`
          : `Saved ${readySlides.length} carousel banner${readySlides.length === 1 ? "" : "s"} successfully.`,
      );
    } catch {
      /* persistSlides already surfaced the error */
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Loading carousel…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="admin-card-header gap-4 space-y-0 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <CardTitle>Homepage Carousel</CardTitle>
            <CardDescription>
              Add banners by <strong>uploading a file</strong> or <strong>pasting a direct image URL</strong>.
              Recommended size: <strong>{CAROUSEL_BANNER_SIZE_LABEL}</strong>. File uploads are
              automatically resized; URL images are used as provided.
            </CardDescription>
            {slides.length > 0 && (
              <Badge variant="secondary" className="w-fit">
                {slides.filter((s) => s.image.trim()).length} ready · {slides.length} total
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={bulkInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleBulkUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={bulkUploading}
              onClick={() => bulkInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {bulkUploading ? "Uploading…" : "Bulk Upload"}
            </Button>
            <Button type="button" variant="outline" onClick={addSlide}>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Carousel"}
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={quickUrlDraft}
              onChange={(e) => setQuickUrlDraft(e.target.value)}
              placeholder="https://example.com/banner.jpg or /uploads/banner.jpg"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddFromUrl();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={quickUrlApplying || !quickUrlDraft.trim()}
              onClick={() => void handleAddFromUrl()}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {quickUrlApplying ? "Importing…" : "Add from URL"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {slides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No carousel banners yet. Add your first banner to get started.
              </p>
              <Button type="button" className="mt-4" onClick={addSlide}>
                <Plus className="mr-2 h-4 w-4" />
                Add Banner
              </Button>
            </div>
          ) : (
            slides.map((slide, index) => {
              const expanded = expandedId === slide.id;
              return (
                <div
                  key={slide.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                        style={{ width: 204, aspectRatio: CAROUSEL_BANNER_ASPECT_RATIO }}
                      >
                        {slide.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(slide.image)}
                            alt={slide.alt || `Banner ${index + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">Banner {index + 1}</p>
                          <Badge variant={slide.isActive ? "default" : "secondary"}>
                            {slide.isActive ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {slide.alt || slide.image || "No alt text yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Move banner up"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Move banner down"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(index, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExpandedId(expanded ? null : slide.id)}
                      >
                        {expanded ? "Close" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Delete banner"
                        disabled={saving}
                        onClick={() => void removeSlide(slide.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-5 border-t border-border bg-muted/15 p-4 sm:p-6">
                      <MediaImagePicker
                        label="Banner Image"
                        maxImages={1}
                        carouselBanner
                        allowImageUrl
                        imageUrlInputId={`banner-image-url-${slide.id}`}
                        value={slide.image ? [slide.image] : []}
                        onChange={(urls) => updateSlide(slide.id, { image: urls[0] ?? "" })}
                        helpText={BANNER_SIZE_HELP}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`alt-${slide.id}`}>Alt Text</Label>
                          <Input
                            id={`alt-${slide.id}`}
                            value={slide.alt}
                            onChange={(e) => updateSlide(slide.id, { alt: e.target.value })}
                            placeholder="Describe the banner for accessibility"
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`link-${slide.id}`}>Click Link</Label>
                          <Input
                            id={`link-${slide.id}`}
                            type="url"
                            value={slide.link}
                            onChange={(e) => updateSlide(slide.id, { link: e.target.value })}
                            placeholder="/products"
                          />
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 sm:col-span-2">
                          <Switch
                            id={`active-${slide.id}`}
                            checked={slide.isActive}
                            onCheckedChange={(checked) =>
                              updateSlide(slide.id, { isActive: checked })
                            }
                          />
                          <Label htmlFor={`active-${slide.id}`} className="cursor-pointer">
                            Show this banner on the website
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {message && (
            <p className={`text-sm ${error ? "text-destructive" : "text-primary"}`}>{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
