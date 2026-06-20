"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { apiGet, apiUploadFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload } from "lucide-react";

interface MediaItem {
  _id: string;
  url: string;
  fileName: string;
  fileType: string;
  size: number;
}

export default function MediaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = () => {
    setLoading(true);
    apiGet<{ items: MediaItem[] }>("/media", { search, limit: 60 })
      .then((res) => setItems(res.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMedia();
  }, [search]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await apiUploadFile(file);
      }
      loadMedia();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader title="Media Library" description="Upload product and website images" />
      <div className="admin-content space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload Images"}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {items.map((item) => (
              <Card key={item._id} className="overflow-hidden shadow-sm">
                {item.fileType?.startsWith("image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.fileName} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-muted text-sm text-muted-foreground">
                    {item.fileType}
                  </div>
                )}
                <CardHeader className="p-3">
                  <CardTitle className="truncate text-sm">{item.fileName}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                  {(item.size / 1024).toFixed(1)} KB
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
