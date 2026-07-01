"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, apiPut, getApiErrorMessage } from "@/lib/api";

type SmsStatus = {
  configured: boolean;
  smsReady: boolean;
  whatsAppReady: boolean;
  accountSid: string | null;
  phoneNumber: string | null;
  whatsAppFrom: string | null;
  error: string | null;
};

type SmsSettings = {
  enabled: boolean;
  channel: "sms" | "whatsapp" | "auto";
  orderPlacedEnabled: boolean;
  orderPlacedTemplate: string;
  smsStatus?: SmsStatus;
};

const PLACEHOLDERS = [
  "{customerName}",
  "{orderNumber}",
  "{total}",
  "{phone}",
  "{paymentMethod}",
  "{siteName}",
];

const DEFAULT_TEMPLATE =
  "Thank you for your order, {customerName}! Your order {orderNumber} for Rs{total} has been received. - E Royal Mango";

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings>({
    enabled: false,
    channel: "auto",
    orderPlacedEnabled: true,
    orderPlacedTemplate: DEFAULT_TEMPLATE,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [testPhone, setTestPhone] = useState("03073970850");
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<SmsSettings>("/settings/sms");
      setSettings({
        enabled: Boolean(data.enabled),
        channel: (data.channel as SmsSettings["channel"]) ?? "auto",
        orderPlacedEnabled: data.orderPlacedEnabled !== false,
        orderPlacedTemplate: data.orderPlacedTemplate?.trim() || DEFAULT_TEMPLATE,
        smsStatus: data.smsStatus,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const preview = useMemo(() => {
    return settings.orderPlacedTemplate
      .replace(/\{customerName\}/g, "Ali Khan")
      .replace(/\{orderNumber\}/g, "ERM-ABC123")
      .replace(/\{total\}/g, "2,500")
      .replace(/\{phone\}/g, testPhone || "03001234567")
      .replace(/\{paymentMethod\}/g, "Cash on delivery")
      .replace(/\{siteName\}/g, "E Royal Mango");
  }, [settings.orderPlacedTemplate, testPhone]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError(false);
    try {
      const updated = await apiPut<SmsSettings>("/settings/sms", settings);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        orderPlacedTemplate: updated.orderPlacedTemplate?.trim() || DEFAULT_TEMPLATE,
      }));
      setMessage("SMS template saved. New orders will use this message.");
    } catch {
      setMessage("Could not save SMS settings.");
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setSendingTest(true);
    setTestMessage(null);
    setTestError(null);
    try {
      await apiPost("/settings/sms/test", { to: testPhone.trim() });
      setTestMessage(`Test message sent to ${testPhone.trim()}`);
      await loadSettings();
    } catch (err) {
      setTestError(getApiErrorMessage(err, "Failed to send test message"));
    } finally {
      setSendingTest(false);
    }
  };

  const smsStatus = settings.smsStatus;

  return (
    <div>
      <PageHeader
        title="SMS / WhatsApp Template"
        description="Customize the message sent to customers after they place an order"
      />

      <div className="admin-content space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Twilio connection
              </CardTitle>
              <CardDescription className="mt-1">
                Add Twilio credentials in <code className="text-xs">backend/.env</code>
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <p className="text-muted-foreground">Checking SMS service…</p>
            ) : smsStatus?.configured && !smsStatus.error ? (
              <>
                <p className="text-emerald-600">Twilio is configured.</p>
                <p className="text-muted-foreground">Account: {smsStatus.accountSid ?? "—"}</p>
                <p className="text-muted-foreground">
                  SMS: {smsStatus.smsReady ? smsStatus.phoneNumber : "Not configured"}
                </p>
                <p className="text-muted-foreground">
                  WhatsApp: {smsStatus.whatsAppReady ? smsStatus.whatsAppFrom : "Not configured"}
                </p>
              </>
            ) : (
              <p className="text-destructive">
                {smsStatus?.error ??
                  "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in backend/.env"}
              </p>
            )}
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Required .env variables</p>
              <p>TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER</p>
              <p className="mt-2">Optional for WhatsApp: TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="admin-card-header gap-4 space-y-0 border-b border-border/60 pb-6">
            <div>
              <CardTitle>Order placed message</CardTitle>
              <CardDescription className="mt-1">
                Sent automatically to the phone number entered at checkout.
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto shrink-0">
              {saving ? "Saving…" : "Save Template"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading template…</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="sms-enabled">Enable order SMS / WhatsApp</Label>
                      <p className="text-xs text-muted-foreground">
                        Turn on to send messages when customers place orders.
                      </p>
                    </div>
                    <Switch
                      id="sms-enabled"
                      checked={settings.enabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sms-channel">Send via</Label>
                    <select
                      id="sms-channel"
                      value={settings.channel}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          channel: e.target.value as SmsSettings["channel"],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="auto">Auto (WhatsApp first, then SMS)</option>
                      <option value="sms">SMS only</option>
                      <option value="whatsapp">WhatsApp only</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div>
                      <Label htmlFor="order-placed-enabled">Send on order placed</Label>
                    </div>
                    <Switch
                      id="order-placed-enabled"
                      checked={settings.orderPlacedEnabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, orderPlacedEnabled: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order-template">Message template</Label>
                  <Textarea
                    id="order-template"
                    rows={5}
                    value={settings.orderPlacedTemplate}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, orderPlacedTemplate: e.target.value }))
                    }
                    placeholder={DEFAULT_TEMPLATE}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available placeholders: {PLACEHOLDERS.join(", ")}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preview
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{preview}</p>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-3">
                  <Label htmlFor="test-phone">Send test message</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="test-phone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="03001234567"
                    />
                    <Button type="button" variant="outline" onClick={handleTest} disabled={sendingTest}>
                      {sendingTest ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send test"
                      )}
                    </Button>
                  </div>
                  {testMessage ? <p className="text-sm text-emerald-600">{testMessage}</p> : null}
                  {testError ? <p className="text-sm text-destructive">{testError}</p> : null}
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
