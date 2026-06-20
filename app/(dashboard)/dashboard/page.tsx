"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

const REFRESH_MS = 15_000;

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalBlogs: number;
    totalTestimonials: number;
  };
  charts: {
    revenue: { _id: string; revenue: number }[];
    orders: { _id: string; orders: number }[];
    customers: { _id: string; count: number }[];
  };
  widgets: {
    recentOrders: Record<string, unknown>[];
    recentCustomers: Record<string, unknown>[];
    topProducts: Record<string, unknown>[];
    latestBlogs: Record<string, unknown>[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const next = await apiGet<DashboardData>("/dashboard");
      setData(next);
      setLastUpdated(new Date());
    } catch {
      if (showLoading) setData(null);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
    const timer = setInterval(() => loadDashboard(false), REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your store" />
        <div className="admin-content space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="admin-content text-muted-foreground">Unable to load dashboard. Ensure the API is running.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          lastUpdated
            ? `Live store overview · Auto-refresh every 15s · Updated ${lastUpdated.toLocaleTimeString()}${refreshing ? " · Syncing…" : ""}`
            : "Live store overview"
        }
      />
      <div className="admin-content space-y-6">
        <StatsCards stats={data.stats} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart
            data={data.charts.revenue}
            title="Revenue Analytics"
            valueKey="revenue"
          />
          <RevenueChart
            data={data.charts.orders}
            title="Orders Analytics"
            valueKey="orders"
          />
          <RevenueChart
            data={data.charts.customers}
            title="Customers Analytics"
            valueKey="count"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.widgets.recentOrders.map((order) => (
                <div key={String(order._id)} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{String(order.orderNumber ?? order._id)}</p>
                    <p className="text-muted-foreground">{formatDate(order.createdAt as string)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="secondary">{String(order.status)}</Badge>
                    <p className="mt-1 font-medium">{formatCurrency(Number(order.total ?? 0))}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.widgets.topProducts.map((p, index) => (
                <div
                  key={`${String(p._id ?? p.slug ?? "product")}-${index}`}
                  className="flex justify-between text-sm"
                >
                  <span>{String(p.name)}</span>
                  <span className="text-muted-foreground">{String(p.sold)} sold</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Customers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.widgets.recentCustomers.map((c) => (
                <div key={String(c._id)} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{String(c.name)}</span>
                  <span className="shrink-0 truncate text-muted-foreground max-w-[50%]">{String(c.email)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Latest Blogs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.widgets.latestBlogs.map((b) => (
                <div key={String(b._id)} className="flex justify-between text-sm">
                  <span>{String(b.title)}</span>
                  <span className="text-muted-foreground">{formatDate(b.createdAt as string)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
