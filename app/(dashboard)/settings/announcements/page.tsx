"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiGet, apiPut } from "@/lib/api";

type AnnouncementMessage = {
  id: string;
  text: string;
  isActive: boolean;
  sortOrder: number;
};

type AnnouncementSettings = {
  announcementBarEnabled: boolean;
  announcementMessages: AnnouncementMessage[];
};

function createMessage(text = ""): AnnouncementMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    isActive: true,
    sortOrder: 0,
  };
}

export default function AnnouncementsSettingsPage() {
  const [settings, setSettings] = useState<AnnouncementSettings>({
    announcementBarEnabled: true,
    announcementMessages: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<AnnouncementSettings>("/settings/announcements")
      .then((data) => {
        setSettings({
          announcementBarEnabled: data.announcementBarEnabled !== false,
          announcementMessages: Array.isArray(data.announcementMessages)
            ? data.announcementMessages
            : [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const updateMessages = (next: AnnouncementMessage[]) => {
    setSettings((prev) => ({
      ...prev,
      announcementMessages: next.map((item, index) => ({ ...item, sortOrder: index })),
    }));
  };

  const handleAdd = () => {
    updateMessages([...settings.announcementMessages, createMessage("")]);
  };

  const handleRemove = (id: string) => {
    updateMessages(settings.announcementMessages.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= settings.announcementMessages.length) return;
    const items = [...settings.announcementMessages];
    const [moved] = items.splice(index, 1);
    items.splice(nextIndex, 0, moved);
    updateMessages(items);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError(false);

    const payload = {
      announcementBarEnabled: settings.announcementBarEnabled,
      announcementMessages: settings.announcementMessages
        .map((item, index) => ({
          ...item,
          text: item.text.trim(),
          sortOrder: index,
        }))
        .filter((item) => item.text.length > 0),
    };

    try {
      const updated = await apiPut<AnnouncementSettings>("/settings/announcements", payload);
      setSettings({
        announcementBarEnabled: updated.announcementBarEnabled !== false,
        announcementMessages: updated.announcementMessages ?? [],
      });
      setMessage("Announcement bar saved. Changes appear on the storefront immediately.");
    } catch {
      setMessage("Could not save announcements. Please try again.");
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcement Bar"
        description="Manage rotating messages shown above the website navbar"
      />

      <div className="admin-content">
        <Card className="shadow-sm">
          <CardHeader className="admin-card-header gap-4 space-y-0 border-b border-border/60 pb-6">
            <div>
              <CardTitle>Top announcement messages</CardTitle>
              <CardDescription className="mt-1">
                Messages rotate every 2 seconds on the storefront. Use emojis and short uppercase
                text for best results.
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto shrink-0">
              {saving ? "Saving…" : "Save Announcements"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading announcements…</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <Label htmlFor="announcement-enabled">Show announcement bar</Label>
                    <p className="text-xs text-muted-foreground">
                      Turn off to hide the bar on the website.
                    </p>
                  </div>
                  <Switch
                    id="announcement-enabled"
                    checked={settings.announcementBarEnabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, announcementBarEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Messages</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
                      <Plus className="h-4 w-4" />
                      Add message
                    </Button>
                  </div>

                  {settings.announcementMessages.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No messages yet. Add your first announcement above.
                    </p>
                  ) : (
                    settings.announcementMessages.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border bg-background p-4 space-y-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`announcement-${item.id}`}>Message {index + 1}</Label>
                            <Input
                              id={`announcement-${item.id}`}
                              value={item.text}
                              onChange={(e) => {
                                const next = [...settings.announcementMessages];
                                next[index] = { ...next[index], text: e.target.value };
                                updateMessages(next);
                              }}
                              placeholder="💵 CASH ON DELIVERY — PAY AT YOUR DOORSTEP, ZERO RISK"
                            />
                          </div>

                          <div className="flex items-center gap-2 sm:pt-7">
                            <Switch
                              checked={item.isActive}
                              onCheckedChange={(checked) => {
                                const next = [...settings.announcementMessages];
                                next[index] = { ...next[index], isActive: checked };
                                updateMessages(next);
                              }}
                            />
                            <span className="text-xs text-muted-foreground min-w-[3rem]">
                              {item.isActive ? "Active" : "Hidden"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                            Move up
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleMove(index, 1)}
                            disabled={index === settings.announcementMessages.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                            Move down
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-xl border border-border bg-[#006400] px-4 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5c842]">
                    Preview
                  </p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-wide text-[#f5c842]">
                    {settings.announcementMessages.find((item) => item.isActive && item.text.trim())
                      ?.text || "Your announcement will appear here"}
                  </p>
                </div>

                {message ? (
                  <p className={`text-sm ${error ? "text-destructive" : "text-primary"}`}>{message}</p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
