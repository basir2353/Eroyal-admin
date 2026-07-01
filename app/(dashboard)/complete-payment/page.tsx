"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiGet, apiPatch } from "@/lib/api";
import { formatCurrency, formatDate, resolveMediaUrl } from "@/lib/utils";
import {
  PAYMENT_VERIFICATION_FILTERS,
  formatPaymentStatus,
  getCustomerEmail,
  getCustomerName,
  getCustomerPhone,
  orderId,
  paymentCompleteSuccessMessage,
  paymentVerificationFilterLabel,
  statusBadgeVariant,
  type OrderRecord,
  type PaymentVerificationFilter,
} from "@/lib/order-utils";

type PaymentListResponse = {
  items: OrderRecord[];
  pagination: { page: number; limit: number; total: number };
  filter: PaymentVerificationFilter;
};

export default function CompletePaymentPage() {
  const [filter, setFilter] = useState<PaymentVerificationFilter>("pending_review");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<PaymentListResponse>("/orders/payment-verifications", {
        filter,
        limit: 50,
      });
      setOrders(res.items ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrder = (order: OrderRecord) => {
    setSelectedOrder(order);
    setPanelOpen(true);
    setNote("");
    setMessage(null);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedOrder(null);
    setMessage(null);
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;
    const id = orderId(selectedOrder);
    if (!id) return;

    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiPatch<OrderRecord>(`/orders/${id}/payment-complete`, {
        note: note.trim() || undefined,
      });
      setSelectedOrder(updated);
      setMessage(paymentCompleteSuccessMessage(updated));
      await loadOrders();
    } catch {
      setMessage("Could not mark payment as complete. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPaid = String(selectedOrder?.paymentStatusLabel ?? selectedOrder?.paymentStatus ?? "")
    .toLowerCase()
    .includes("paid");

  return (
    <div>
      <PageHeader
        title="Complete Payment"
        description="Review bank transfer receipts and mark payments as complete"
      />

      <div className="admin-content space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Bank transfer payments</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  When a customer uploads a receipt on the Complete payment page, it appears here
                  for review.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {PAYMENT_VERIFICATION_FILTERS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={filter === item ? "default" : "outline"}
                  onClick={() => setFilter(item)}
                >
                  {paymentVerificationFilterLabel(item)}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading payments…</p>
            ) : orders.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {filter === "pending_review"
                  ? "No receipts waiting for review."
                  : filter === "awaiting_receipt"
                    ? "No bank transfer orders waiting for a receipt."
                    : "No completed bank payments yet."}
              </p>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Order #</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Receipt</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const id = orderId(order);
                      const paymentStatus = String(
                        order.paymentStatusLabel ?? order.paymentStatus ?? "pending",
                      ).toLowerCase();
                      const hasReceipt = Boolean(order.paymentReceiptUrl);

                      return (
                        <tr
                          key={id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3 font-medium">{String(order.orderNumber ?? "—")}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{getCustomerName(order)}</div>
                            <div className="text-xs text-muted-foreground">{getCustomerEmail(order)}</div>
                          </td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3">
                            {hasReceipt ? (
                              <Badge variant="warning">Uploaded</Badge>
                            ) : (
                              <Badge variant="outline">Waiting</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusBadgeVariant(paymentStatus)}>
                              {formatPaymentStatus(paymentStatus)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {order.paymentReceiptUploadedAt
                              ? formatDate(String(order.paymentReceiptUploadedAt))
                              : order.createdAt
                                ? formatDate(order.createdAt)
                                : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Button type="button" size="sm" variant="outline" onClick={() => openOrder(order)}>
                              <Eye className="h-4 w-4" />
                              <span className="max-sm:sr-only">Review</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {panelOpen && selectedOrder ? (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={closePanel} />
          <div className="admin-slide-panel max-w-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">
                  Order {selectedOrder.orderNumber ?? "Details"}
                </h2>
                <p className="text-sm text-muted-foreground">Bank transfer payment review</p>
              </div>
              <button type="button" onClick={closePanel} className="rounded-lg p-2 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusBadgeVariant(String(selectedOrder.paymentStatusLabel ?? "pending"))}>
                    Payment: {formatPaymentStatus(String(selectedOrder.paymentStatusLabel ?? "pending"))}
                  </Badge>
                  <Badge variant="outline">
                    Total {formatCurrency(selectedOrder.total)}
                  </Badge>
                </div>

                <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                  <h3 className="font-semibold">Customer</h3>
                  <p className="text-sm">{getCustomerName(selectedOrder)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerEmail(selectedOrder)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerPhone(selectedOrder)}</p>
                </section>

                <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <h3 className="font-semibold">Payment receipt</h3>
                  {selectedOrder.paymentReceiptUploadedAt ? (
                    <p className="text-sm text-muted-foreground">
                      Uploaded {formatDate(String(selectedOrder.paymentReceiptUploadedAt))}
                    </p>
                  ) : null}

                  {selectedOrder.paymentReceiptUrl ? (
                    <div className="space-y-3">
                      <a
                        href={resolveMediaUrl(String(selectedOrder.paymentReceiptUrl))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveMediaUrl(String(selectedOrder.paymentReceiptUrl))}
                          alt="Payment receipt"
                          className="max-h-80 w-full rounded-lg border border-border object-contain bg-background"
                        />
                      </a>
                      <a
                        href={resolveMediaUrl(String(selectedOrder.paymentReceiptUrl))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open receipt in new tab
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Customer has not uploaded a receipt yet.
                    </p>
                  )}
                </section>

                {!isPaid && selectedOrder.paymentReceiptUrl ? (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div>
                      <h3 className="font-semibold">Mark payment complete</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        After verifying the receipt matches the order total, confirm the payment.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-note">Admin note (optional)</Label>
                      <Textarea
                        id="payment-note"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Payment verified via JazzCash / MCB"
                      />
                    </div>
                    {message ? (
                      <p
                        className={`text-sm ${message.includes("Email not sent") || message.includes("Could not") ? "text-destructive" : "text-emerald-600"}`}
                      >
                        {message}
                      </p>
                    ) : null}
                    <Button type="button" onClick={handleCompletePayment} disabled={saving}>
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? "Saving…" : "Mark payment complete"}
                    </Button>
                  </section>
                ) : null}

                {isPaid ? (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-semibold">Payment complete</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This bank transfer has been verified and marked as paid.
                    </p>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
