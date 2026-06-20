"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "boolean" | "json";
  hint?: string;
}

interface CmsEditorProps {
  section: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export function CmsEditor({ section, title, description, fields }: CmsEditorProps) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<Record<string, unknown>>(`/cms/${section}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [section]);

  const updateField = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError(false);
    try {
      const updated = await apiPut<Record<string, unknown>>(`/cms/${section}`, data);
      setData(updated);
      setMessage("Changes saved successfully.");
    } catch {
      setMessage("Could not save changes. Please try again.");
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="admin-card-header gap-4 space-y-0 border-b border-border/60 pb-6">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto shrink-0">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.key}
            className={
              field.type === "textarea" || field.type === "json" || field.type === "boolean"
                ? "space-y-2 sm:col-span-2"
                : "space-y-2"
            }
          >
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "boolean" ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Switch
                  id={field.key}
                  checked={Boolean(data[field.key])}
                  onCheckedChange={(v) => updateField(field.key, v)}
                />
                <span className="text-sm text-muted-foreground">
                  {data[field.key] ? "Visible on website" : "Hidden from website"}
                </span>
              </div>
            ) : field.type === "textarea" ? (
              <Textarea
                id={field.key}
                rows={4}
                value={String(data[field.key] ?? "")}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            ) : field.type === "json" ? (
              <Textarea
                id={field.key}
                className="min-h-[220px] font-mono text-xs"
                value={JSON.stringify(
                  data[field.key] ?? (field.key === "cards" || field.key === "items" ? [] : {}),
                  null,
                  2,
                )}
                onChange={(e) => {
                  try {
                    updateField(field.key, JSON.parse(e.target.value));
                  } catch {
                    /* allow typing */
                  }
                }}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type === "url" ? "url" : "text"}
                value={String(data[field.key] ?? "")}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            )}
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
        ))}
        {message && (
          <p className={`sm:col-span-2 text-sm ${error ? "text-destructive" : "text-primary"}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
