"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  formatPaymentMethod,
  formatStatusLabel,
  getCustomerEmail,
  getCustomerName,
  getCustomerPhone,
  getShippingAddress,
  orderId,
  orderStatus,
  statusBadgeVariant,
  type OrderRecord,
} from "@/lib/order-utils";

type CustomerRecord = Record<string, unknown> & {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  totalSpent?: number;
  orderCount?: number;
  createdAt?: string;
  orders?: OrderRecord[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: CustomerRecord[] }>("/customers");
      setCustomers(res.items ?? []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.email, customer.phone].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, search]);

  const openCustomerPanel = async (customer: CustomerRecord) => {
    const id = String(customer._id ?? customer.id ?? "");
    if (!id) return;
    setPanelOpen(true);
    setPanelLoading(true);
    try {
      const full = await apiGet<CustomerRecord>(`/customers/${id}`);
      setSelectedCustomer(full);
    } catch {
      setSelectedCustomer(customer);
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCustomer(null);
  };

  const customerOrders = (selectedCustomer?.orders ?? []) as OrderRecord[];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Customers from checkout — view profiles and full order history"
      />

      <div className="admin-content space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Every customer who placed an order is listed here with spending totals and order count.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone…"
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading customers…</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No customers match your search." : "No customers yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Orders</th>
                      <th className="px-4 py-3 font-medium">Total Spent</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const id = String(customer._id ?? customer.id ?? "");
                      return (
                        <tr
                          key={id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3 font-medium">{String(customer.name ?? "—")}</td>
                          <td className="px-4 py-3 text-muted-foreground">{String(customer.email ?? "—")}</td>
                          <td className="px-4 py-3 text-muted-foreground">{String(customer.phone ?? "—")}</td>
                          <td className="px-4 py-3">{String(customer.orderCount ?? 0)}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(customer.totalSpent)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {customer.createdAt ? formatDate(customer.createdAt) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openCustomerPanel(customer)}
                            >
                              <Eye className="h-4 w-4" />
                              View
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={closePanel} />
          <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedCustomer?.name ?? "Customer"}</h2>
                <p className="text-sm text-muted-foreground">Profile and order history</p>
              </div>
              <button type="button" onClick={closePanel} className="rounded-lg p-2 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {panelLoading || !selectedCustomer ? (
                <p className="text-sm text-muted-foreground">Loading customer…</p>
              ) : (
                <div className="space-y-6">
                  <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                    <h3 className="font-semibold">Contact details</h3>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Email: </span>
                      {String(selectedCustomer.email ?? "—")}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      {String(selectedCustomer.phone ?? "—")}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Member since: </span>
                      {selectedCustomer.createdAt ? formatDate(selectedCustomer.createdAt) : "—"}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Total spent: </span>
                      <span className="font-semibold">{formatCurrency(selectedCustomer.totalSpent)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Orders: </span>
                      {String(selectedCustomer.orderCount ?? customerOrders.length)}
                    </p>
                  </section>

                  <section className="rounded-xl border border-border overflow-hidden">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <h3 className="font-semibold">Order history</h3>
                    </div>
                    {customerOrders.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {customerOrders.map((order) => {
                          const status = orderStatus(order);
                          const address = getShippingAddress(order);
                          const items = (order.items ?? []) as Record<string, unknown>[];
                          return (
                            <div key={orderId(order)} className="space-y-3 px-4 py-4">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold">{String(order.orderNumber ?? "—")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.createdAt ? formatDate(order.createdAt) : "—"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={statusBadgeVariant(status)}>{formatStatusLabel(status)}</Badge>
                                  <p className="mt-1 font-semibold">{formatCurrency(order.total)}</p>
                                </div>
                              </div>

                              <div className="grid gap-2 text-sm sm:grid-cols-2">
                                <p>
                                  <span className="text-muted-foreground">Customer: </span>
                                  {getCustomerName(order)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Phone: </span>
                                  {getCustomerPhone(order)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Email: </span>
                                  {getCustomerEmail(order)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Payment: </span>
                                  {formatPaymentMethod(String(order.paymentMethod ?? ""))}
                                </p>
                              </div>

                              {address.address1 ? (
                                <p className="text-sm text-muted-foreground">
                                  <span className="text-foreground">Address: </span>
                                  {[address.address1, address.address2, address.city, address.state, address.postcode]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              ) : null}

                              {order.notes ? (
                                <p className="text-sm text-muted-foreground">
                                  <span className="text-foreground">Notes: </span>
                                  {String(order.notes)}
                                </p>
                              ) : null}

                              <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Items
                                </p>
                                <ul className="space-y-1 text-sm">
                                  {items.map((item, index) => (
                                    <li key={String(item._id ?? item.id ?? index)} className="flex justify-between gap-4">
                                      <span>
                                        {String(item.name ?? "—")}
                                        {item.weight ? ` (${String(item.weight)})` : ""} × {String(item.quantity ?? 0)}
                                      </span>
                                      <span className="shrink-0 font-medium">{formatCurrency(item.lineTotal)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
