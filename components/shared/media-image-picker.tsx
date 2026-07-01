"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Trash2, Upload, X } from "lucide-react";
import { apiGet, apiUploadFile, getApiErrorMessage } from "@/lib/api";
import {
  CAROUSEL_BANNER_SIZE_LABEL,
  normalizeCarouselBannerFile,
  resolveCarouselBannerUrl,
} from "@/lib/carousel-banner";
import { resolveMediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MediaItem {
  _id?: string;
  id?: string;
  url: string;
  fileName?: string;
  fileType?: string;
}

interface MediaImagePickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  /** When 1, only one image is kept (replace on upload/select). */
  maxImages?: number;
  helpText?: string;
  /** Normalize uploads to exact carousel banner dimensions (1024×320). */
  carouselBanner?: boolean;
  /** Allow pasting a direct image URL instead of uploading a file. */
  allowImageUrl?: boolean;
  /** Unique id for the URL input (required when multiple pickers are on one page). */
  imageUrlInputId?: string;
}

export function MediaImagePicker({
  value,
  onChange,
  label = "Product Images",
  maxImages,
  helpText,
  carouselBanner = false,
  allowImageUrl = false,
  imageUrlInputId = "image-url-input",
}: MediaImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlApplying, setUrlApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const singleImage = maxImages === 1;

  useEffect(() => {
    if (singleImage && value[0]) {
      setUrlDraft(value[0]);
    } else if (!value.length) {
      setUrlDraft("");
    }
  }, [value, singleImage]);

  useEffect(() => {
    if (!libraryOpen) return;

    setLibraryLoading(true);
    apiGet<{ items: MediaItem[] }>("/media", { limit: 60 })
      .then((res) => setLibraryItems(res.items ?? []))
      .catch(() => {
        setLibraryItems([]);
        setError("Could not load media library.");
      })
      .finally(() => setLibraryLoading(false));
  }, [libraryOpen]);

  const applyUrls = (urls: string[]) => {
    const next = singleImage ? urls.slice(-1) : urls;
    onChange(next);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setError(null);
    setInfo(null);

    try {
      const uploaded: string[] = [];
      let adjustedCount = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed.");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Image must be 10MB or smaller.");
          continue;
        }
        let uploadFile = file;
        if (carouselBanner) {
          const normalized = await normalizeCarouselBannerFile(file);
          uploadFile = normalized.file;
          if (normalized.adjusted) adjustedCount += 1;
        }
        const media = await apiUploadFile(uploadFile);
        if (media.url) uploaded.push(media.url);
      }
      if (uploaded.length) {
        applyUrls(singleImage ? uploaded : [...value, ...uploaded]);
        if (carouselBanner && adjustedCount > 0) {
          setInfo(
            `${adjustedCount} image${adjustedCount === 1 ? "" : "s"} resized to 1024×320 px for perfect carousel display.`,
          );
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addFromLibrary = (url: string) => {
    if (singleImage) {
      onChange([url]);
      setUrlDraft(url);
      setLibraryOpen(false);
      return;
    }
    if (!value.includes(url)) {
      onChange([...value, url]);
    }
  };

  const applyImageUrl = async () => {
    if (!urlDraft.trim()) {
      setError("Enter an image URL first.");
      setInfo(null);
      return;
    }

    setUrlApplying(true);
    setError(null);
    setInfo(null);

    try {
      const storedUrl = await resolveCarouselBannerUrl(urlDraft);
      applyUrls([storedUrl]);
      setUrlDraft(storedUrl);
      setError(null);
      if (carouselBanner) {
        setInfo(
          storedUrl.startsWith("/uploads/")
            ? `Banner image imported and ready (${CAROUSEL_BANNER_SIZE_LABEL} recommended).`
            : `Image URL applied (${CAROUSEL_BANNER_SIZE_LABEL} recommended).`,
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not import image from URL."));
    } finally {
      setUrlApplying(false);
    }
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <Label>{label}</Label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(url)}
                alt={`Selected image ${index + 1}`}
                referrerPolicy="no-referrer"
                className="h-28 w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white/80">
                {singleImage || index === 0 ? "Primary" : `Gallery ${index + 1}`}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={!singleImage}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload Images"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
          <ImagePlus className="h-4 w-4" />
          Media Library
        </Button>
      </div>

      {allowImageUrl && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <Label htmlFor={imageUrlInputId} className="text-sm font-medium">
            Or paste image URL
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={imageUrlInputId}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://example.com/banner.jpg or /uploads/banner.jpg"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyImageUrl();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={urlApplying || !urlDraft.trim()}
              onClick={() => void applyImageUrl()}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {urlApplying ? "Importing…" : "Use URL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a direct link to a JPG, PNG, or WebP image. Recommended:{" "}
            {CAROUSEL_BANNER_SIZE_LABEL}.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {helpText ??
          (singleImage
            ? allowImageUrl
              ? "Upload an image, pick from the media library, or paste a direct image URL."
              : "Upload JPG, PNG, or WebP (max 10MB) or pick from the media library."
            : "First image is used as the main photo. Upload JPG, PNG, or WebP (max 10MB).")}
      </p>

      {info && <p className="text-sm text-primary">{info}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {libraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-semibold">Select from Media Library</h3>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-56px)] overflow-y-auto p-4">
              {libraryLoading ? (
                <p className="text-sm text-muted-foreground">Loading media…</p>
              ) : libraryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No media yet. Upload images using the Upload Images button first.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {libraryItems
                    .filter((item) => !item.fileType || item.fileType.startsWith("image"))
                    .map((item) => {
                      const selected = value.includes(item.url);
                      return (
                        <button
                          key={String(item._id ?? item.id ?? item.url)}
                          type="button"
                          onClick={() => addFromLibrary(item.url)}
                          className={`overflow-hidden rounded-lg border text-left transition-colors ${
                            selected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(item.url)}
                            alt={item.fileName ?? "Media"}
                            className="h-28 w-full object-cover"
                          />
                          <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                            {item.fileName ?? "Image"}
                          </p>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3 text-right">
              <Button type="button" size="sm" onClick={() => setLibraryOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
