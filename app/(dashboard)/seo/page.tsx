"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { apiGet, apiPut } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const pages = ["homepage", "products", "about", "contact", "faq", "blogs"];

export default function SeoPage() {
  const [records, setRecords] = useState<Record<string, Record<string, string>>>({});
  const [active, setActive] = useState("homepage");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<Record<string, unknown>[]>("/seo").then((list) => {
      const map: Record<string, Record<string, string>> = {};
      (Array.isArray(list) ? list : []).forEach((r) => {
        const page = String(r.page);
        map[page] = {
          page,
          metaTitle: String(r.metaTitle ?? ""),
          metaDescription: String(r.metaDescription ?? ""),
          keywords: Array.isArray(r.keywords) ? (r.keywords as string[]).join(", ") : String(r.keywords ?? ""),
          ogImage: String(r.ogImage ?? ""),
        };
      });
      setRecords(map);
    });
  }, []);

  const current = records[active] ?? {
    page: active,
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    ogImage: "",
  };

  const update = (key: string, value: string) => {
    setRecords((prev) => ({ ...prev, [active]: { ...current, [key]: value, page: active } }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...records[active],
        keywords: (records[active]?.keywords ?? "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };
      await apiPut("/seo", payload);
      setMessage("SEO settings saved.");
    } catch {
      setMessage("Could not save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="SEO Management" description="Meta titles and descriptions for search engines" />
      <div className="admin-content grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pages</CardTitle>
            <CardDescription className="max-lg:hidden">Select a page to edit its SEO tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            <div className="admin-seo-tabs lg:space-y-1">
              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActive(p)}
                  className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm capitalize transition-colors lg:block lg:w-full ${
                    active === p
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm min-w-0">
          <CardHeader className="admin-card-header gap-4 space-y-0 border-b border-border/60 pb-6">
            <div className="min-w-0">
              <CardTitle className="capitalize">{active} SEO</CardTitle>
              <CardDescription>Title and description shown in Google search results.</CardDescription>
            </div>
            <Button onClick={save} disabled={saving} className="w-full sm:w-auto shrink-0">
              {saving ? "Saving…" : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={current.metaTitle ?? ""} onChange={(e) => update("metaTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                rows={3}
                value={current.metaDescription ?? ""}
                onChange={(e) => update("metaDescription", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Keywords</Label>
              <Input
                value={current.keywords ?? ""}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="mango, chaunsa, export quality"
              />
              <p className="text-xs text-muted-foreground">Separate keywords with commas.</p>
            </div>
            <div className="space-y-2">
              <Label>Social Share Image URL</Label>
              <Input value={current.ogImage ?? ""} onChange={(e) => update("ogImage", e.target.value)} />
            </div>
            {message && <p className="text-sm text-primary">{message}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
