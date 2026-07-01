"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPatch } from "@/lib/api";
import { formatCurrency, formatDate, resolveMediaUrl } from "@/lib/utils";
import {
  ORDER_STATUSES,
  formatPaymentMethod,
  formatPaymentStatus,
  formatStatusLabel,
  getCustomerEmail,
  getCustomerName,
  getCustomerPhone,
  getShippingAddress,
  isBankTransfer,
  orderId,
  orderStatus,
  paymentCompleteSuccessMessage,
  statusBadgeVariant,
  type OrderRecord,
} from "@/lib/order-utils";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right sm:max-w-[65%] sm:text-right">{value || "—"}</span>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: "pending",
    note: "",
    trackingNumber: "",
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await apiGet<{ items: OrderRecord[] }>(`/orders${query}`);
      setOrders(res.items ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const haystack = [
        order.orderNumber,
        getCustomerName(order),
        getCustomerEmail(order),
        getCustomerPhone(order),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search]);

  const openOrderPanel = async (order: OrderRecord) => {
    const id = orderId(order);
    if (!id) return;
    setPanelOpen(true);
    setPanelLoading(true);
    setSaveMessage(null);
    try {
      const full = await apiGet<OrderRecord>(`/orders/${id}`);
      setSelectedOrder(full);
      setStatusForm({
        status: orderStatus(full),
        note: "",
        trackingNumber: String(full.trackingNumber ?? ""),
      });
    } catch {
      setSelectedOrder(order);
      setStatusForm({
        status: orderStatus(order),
        note: "",
        trackingNumber: String(order.trackingNumber ?? ""),
      });
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedOrder(null);
    setSaveMessage(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    const id = orderId(selectedOrder);
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await apiPatch<OrderRecord>(`/orders/${id}/status`, {
        status: statusForm.status,
        note: statusForm.note || undefined,
        trackingNumber: statusForm.trackingNumber || undefined,
      });
      setSelectedOrder(updated);
      setStatusForm((prev) => ({ ...prev, note: "" }));
      setSaveMessage("Order updated successfully.");
      await loadOrders();
    } catch {
      setSaveMessage("Could not update order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;
    const id = orderId(selectedOrder);
    setSavingPayment(true);
    setSaveMessage(null);
    try {
      const updated = await apiPatch<OrderRecord>(`/orders/${id}/payment-complete`);
      setSelectedOrder(updated);
      setSaveMessage(paymentCompleteSuccessMessage(updated));
      await loadOrders();
    } catch {
      setSaveMessage("Could not mark payment as complete.");
    } finally {
      setSavingPayment(false);
    }
  };

  const selectedPaymentStatus = String(
    selectedOrder?.paymentStatusLabel ?? selectedOrder?.paymentStatus ?? "pending",
  ).toLowerCase();
  const selectedPaymentComplete = selectedPaymentStatus.includes("paid");

  const address = selectedOrder ? getShippingAddress(selectedOrder) : {};
  const items = (selectedOrder?.items ?? []) as Record<string, unknown>[];

  return (
    <div>
      <PageHeader
        title="Orders"
        description="View complete order details, track status, and manage fulfillment"
      />

      <div className="admin-content space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Click View to see everything the customer submitted at checkout.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order #, name, email, phone…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", ...ORDER_STATUSES].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "all" ? "All" : formatStatusLabel(status)}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            ) : filteredOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No orders match your search." : "No orders yet."}
              </p>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Order #</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const id = orderId(order);
                      const status = orderStatus(order);
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
                          <td className="px-4 py-3 text-muted-foreground">{getCustomerPhone(order)}</td>
                          <td className="px-4 py-3">{String(order.itemCount ?? order.items?.length ?? 0)}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatPaymentMethod(String(order.paymentMethod ?? ""))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusBadgeVariant(status)}>{formatStatusLabel(status)}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {order.createdAt ? formatDate(order.createdAt) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Button type="button" size="sm" variant="outline" onClick={() => openOrderPanel(order)}>
                              <Eye className="h-4 w-4" />
                              <span className="max-sm:sr-only">View</span>
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

      {panelOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={closePanel} />
          <div className="admin-slide-panel max-w-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">
                  Order {selectedOrder?.orderNumber ?? "Details"}
                </h2>
                <p className="text-sm text-muted-foreground max-sm:hidden">
                  Complete checkout submission from the customer
                </p>
              </div>
              <button type="button" onClick={closePanel} className="rounded-lg p-2 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {panelLoading || !selectedOrder ? (
                <p className="text-sm text-muted-foreground">Loading order details…</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusBadgeVariant(orderStatus(selectedOrder))}>
                      {formatStatusLabel(orderStatus(selectedOrder))}
                    </Badge>
                    <Badge variant={statusBadgeVariant(String(selectedOrder.paymentStatusLabel ?? "pending"))}>
                      Payment: {formatStatusLabel(String(selectedOrder.paymentStatusLabel ?? "pending"))}
                    </Badge>
                    <Badge variant="outline">
                      Placed {selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : "—"}
                    </Badge>
                  </div>

                  <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="font-semibold">Customer</h3>
                    {selectedOrder.customerInfo &&
                    typeof selectedOrder.customerInfo === "object" &&
                    (selectedOrder.customerInfo as { firstName?: string }).firstName ? (
                      <>
                        <DetailRow
                          label="First name"
                          value={String((selectedOrder.customerInfo as { firstName?: string }).firstName ?? "")}
                        />
                        <DetailRow
                          label="Last name"
                          value={String((selectedOrder.customerInfo as { lastName?: string }).lastName ?? "")}
                        />
                      </>
                    ) : null}
                    <DetailRow label="Full name" value={getCustomerName(selectedOrder)} />
                    <DetailRow label="Email" value={getCustomerEmail(selectedOrder)} />
                    <DetailRow label="Phone" value={getCustomerPhone(selectedOrder)} />
                  </section>

                  <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="font-semibold">Delivery address</h3>
                    <DetailRow label="Company" value={String(address.company ?? "")} />
                    <DetailRow label="Street address" value={String(address.address1 ?? "")} />
                    {address.address2 ? (
                      <DetailRow label="Address line 2" value={String(address.address2)} />
                    ) : null}
                    <DetailRow label="City" value={String(address.city ?? "")} />
                    <DetailRow label="State / County" value={String(address.state ?? "")} />
                    <DetailRow label="Postcode" value={String(address.postcode ?? "")} />
                    <DetailRow label="Country" value={String(address.country ?? "")} />
                  </section>

                  <section className="rounded-xl border border-border overflow-hidden">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <h3 className="font-semibold">Order items</h3>
                    </div>
                    <div className="admin-table-scroll">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="px-4 py-2 font-medium">Product</th>
                            <th className="px-4 py-2 font-medium">Weight</th>
                            <th className="px-4 py-2 font-medium">Qty</th>
                            <th className="px-4 py-2 font-medium">Unit</th>
                            <th className="px-4 py-2 font-medium">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={String(item._id ?? item.id ?? index)} className="border-b border-border/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={resolveMediaUrl(String(item.image))}
                                      alt=""
                                      className="h-10 w-10 rounded-md border border-border object-cover"
                                    />
                                  ) : null}
                                  <span className="font-medium">{String(item.name ?? "—")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{String(item.weight ?? "—")}</td>
                              <td className="px-4 py-3">{String(item.quantity ?? 0)}</td>
                              <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3 font-medium">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                    <h3 className="mb-2 font-semibold">Order summary</h3>
                    <DetailRow label="Subtotal" value={formatCurrency(selectedOrder.subtotal)} />
                    <DetailRow label="Shipping" value={formatCurrency(selectedOrder.shippingCost)} />
                    <DetailRow label="Tax" value={formatCurrency(selectedOrder.tax)} />
                    <DetailRow label="Discount" value={formatCurrency(selectedOrder.discount)} />
                    {selectedOrder.couponCode ? (
                      <DetailRow label="Coupon" value={String(selectedOrder.couponCode)} />
                    ) : null}
                    <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="font-semibold">Payment</h3>
                    <DetailRow
                      label="Method"
                      value={formatPaymentMethod(String(selectedOrder.paymentMethod ?? ""))}
                    />
                    <DetailRow
                      label="Payment status"
                      value={formatPaymentStatus(String(selectedOrder.paymentStatusLabel ?? "pending"))}
                    />
                    {selectedOrder.paymentReceiptUploadedAt ? (
                      <DetailRow
                        label="Receipt uploaded"
                        value={formatDate(String(selectedOrder.paymentReceiptUploadedAt))}
                      />
                    ) : null}
                    {selectedOrder.paymentReceiptUrl ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Payment receipt</p>
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
                            className="max-h-64 rounded-lg border border-border object-contain bg-background"
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
                    ) : null}
                    {isBankTransfer(selectedOrder) &&
                    selectedOrder.paymentReceiptUrl &&
                    !selectedPaymentComplete ? (
                      <Button
                        type="button"
                        className="mt-2"
                        onClick={handleCompletePayment}
                        disabled={savingPayment}
                      >
                        {savingPayment ? "Saving…" : "Mark payment complete"}
                      </Button>
                    ) : null}
                    {isBankTransfer(selectedOrder) && selectedPaymentComplete ? (
                      <p className="text-sm font-medium text-emerald-600">Payment verified and complete.</p>
                    ) : null}
                  </section>

                  {(selectedOrder.notes || selectedOrder.trackingNumber || selectedOrder.couponCode) && (
                    <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                      <h3 className="font-semibold">Additional information</h3>
                      {selectedOrder.couponCode ? (
                        <DetailRow label="Coupon code" value={String(selectedOrder.couponCode)} />
                      ) : null}
                      {selectedOrder.notes ? (
                        <div>
                          <p className="text-sm text-muted-foreground">Order notes</p>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{String(selectedOrder.notes)}</p>
                        </div>
                      ) : null}
                      {selectedOrder.trackingNumber ? (
                        <DetailRow label="Tracking number" value={String(selectedOrder.trackingNumber)} />
                      ) : null}
                    </section>
                  )}

                  <section className="rounded-xl border border-border p-4 space-y-4">
                    <h3 className="font-semibold">Manage order</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="order-status">Order status</Label>
                        <select
                          id="order-status"
                          value={statusForm.status}
                          onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tracking">Tracking number</Label>
                        <Input
                          id="tracking"
                          value={statusForm.trackingNumber}
                          onChange={(e) =>
                            setStatusForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status-note">Status note</Label>
                      <Textarea
                        id="status-note"
                        rows={3}
                        value={statusForm.note}
                        onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Optional note for the timeline (e.g. dispatched with courier)"
                      />
                    </div>
                    {saveMessage ? (
                      <p
                        className={`text-sm ${saveMessage.includes("success") ? "text-emerald-500" : "text-destructive"}`}
                      >
                        {saveMessage}
                      </p>
                    ) : null}
                    <Button type="button" onClick={handleStatusUpdate} disabled={saving}>
                      {saving ? "Saving…" : "Update order"}
                    </Button>
                  </section>

                  {Array.isArray(selectedOrder.timeline) && selectedOrder.timeline.length > 0 ? (
                    <section className="rounded-xl border border-border p-4">
                      <h3 className="mb-3 font-semibold">Order timeline</h3>
                      <div className="space-y-3">
                        {[...selectedOrder.timeline].reverse().map((entry, index) => (
                          <div
                            key={`${entry.createdAt ?? index}-${entry.status}`}
                            className="flex gap-3 border-l-2 border-primary/30 pl-4"
                          >
                            <div>
                              <Badge variant={statusBadgeVariant(String(entry.status ?? "pending"))}>
                                {formatStatusLabel(String(entry.status ?? "pending"))}
                              </Badge>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {entry.createdAt ? formatDate(entry.createdAt) : "—"}
                              </p>
                              {entry.note ? (
                                <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
