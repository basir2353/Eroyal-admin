"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { apiGet, apiUploadFile, getApiErrorMessage } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
}

export function MediaImagePicker({
  value,
  onChange,
  label = "Product Images",
  maxImages,
  helpText,
}: MediaImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const singleImage = maxImages === 1;

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

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed.");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Image must be 10MB or smaller.");
          continue;
        }
        const media = await apiUploadFile(file);
        if (media.url) uploaded.push(media.url);
      }
      if (uploaded.length) {
        applyUrls(singleImage ? uploaded : [...value, ...uploaded]);
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
      setLibraryOpen(false);
      return;
    }
    if (!value.includes(url)) {
      onChange([...value, url]);
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

      <p className="text-xs text-muted-foreground">
        {helpText ??
          (singleImage
            ? "Upload JPG, PNG, or WebP (max 10MB) or pick from the media library."
            : "First image is used as the main photo. Upload JPG, PNG, or WebP (max 10MB).")}
      </p>

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
