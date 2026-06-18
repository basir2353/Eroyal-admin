"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";
import { Loader2, Mail, RefreshCw } from "lucide-react";

type EmailStatus = {
  configured: boolean;
  verified: boolean;
  source: "env" | "database" | null;
  host: string | null;
  port: number | null;
  user: string | null;
  from: string | null;
  fromName: string | null;
  error: string | null;
};

type EmailSettingsResponse = {
  usingEnvConfig?: boolean;
  emailStatus?: EmailStatus;
  smtpHost?: string;
  smtpUser?: string;
  senderEmail?: string;
};

export default function EmailSettingsPage() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [usingEnv, setUsingEnv] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const data = await apiGet<EmailSettingsResponse>("/settings/email");
      setStatus(data.emailStatus ?? null);
      setUsingEnv(Boolean(data.usingEnvConfig));
      if (!testTo && data.senderEmail) {
        setTestTo(String(data.senderEmail));
      }
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [testTo]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleTestEmail = async () => {
    setSendingTest(true);
    setTestMessage(null);
    setTestError(null);
    try {
      const result = await apiPost<{ sent: boolean; to: string; messageId?: string }>(
        "/settings/email/test",
        { to: testTo.trim() },
      );
      setTestMessage(`Test email sent to ${result.to}`);
      await loadStatus();
    } catch (error) {
      setTestError(getApiErrorMessage(error, "Failed to send test email"));
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Email Settings"
        description="SMTP server used for order confirmation and notifications"
      />

      <div className="admin-content space-y-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">Email service status</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {usingEnv
                  ? "Using credentials from backend/.env (EMAIL_* variables)"
                  : "Using credentials saved in admin settings or database"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadStatus}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loadingStatus ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking SMTP connection…
            </p>
          ) : status ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Configured</dt>
                <dd className="font-medium">{status.configured ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Verified</dt>
                <dd className={status.verified ? "font-medium text-green-600" : "font-medium text-amber-600"}>
                  {status.verified ? "Connected" : "Not connected"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Host</dt>
                <dd className="font-medium">{status.host ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">From</dt>
                <dd className="font-medium">{status.from ?? "—"}</dd>
              </div>
              {status.error ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Error</dt>
                  <dd className="font-medium text-red-600">{status.error}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-base font-semibold">Send test email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sends a sample order confirmation email using the current SMTP configuration.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="testEmailTo">Recipient email</Label>
              <Input
                id="testEmailTo"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="info@eroyalmango.com"
                className="mt-1.5"
              />
            </div>
            <Button
              type="button"
              onClick={handleTestEmail}
              disabled={sendingTest || !testTo.trim()}
            >
              {sendingTest ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send test email
            </Button>
          </div>
          {testMessage ? (
            <p className="mt-3 text-sm text-green-600">{testMessage}</p>
          ) : null}
          {testError ? (
            <p className="mt-3 text-sm text-red-600">{testError}</p>
          ) : null}
        </div>

        <SettingsForm
          endpoint="/settings/email"
          title="SMTP Configuration (database fallback)"
          description={
            usingEnv
              ? "EMAIL_* values in backend/.env take priority. These fields are used only when .env is empty."
              : "Configure SMTP here if you are not using backend/.env variables."
          }
          fields={[
            { key: "smtpHost", label: "SMTP Host", type: "text" },
            { key: "smtpPort", label: "SMTP Port", type: "number" },
            { key: "smtpUser", label: "SMTP Username", type: "text" },
            { key: "smtpPass", label: "SMTP Password", type: "text" },
            { key: "senderEmail", label: "Sender Email", type: "email" },
            { key: "senderName", label: "Sender Name", type: "text" },
          ]}
        />
      </div>
    </div>
  );
}
