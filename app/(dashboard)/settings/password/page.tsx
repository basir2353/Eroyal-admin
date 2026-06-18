"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      await apiPost("/auth/change-password", { currentPassword, newPassword });
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setMessage("Could not update password. Check your current password.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" description="Update your admin login password" />
      <div className="admin-content max-w-lg">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Use at least 8 characters for your new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {message && (
                <p className={`text-sm ${error ? "text-destructive" : "text-primary"}`}>{message}</p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
