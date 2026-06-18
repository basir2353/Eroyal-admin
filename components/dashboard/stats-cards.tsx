"use client";

import { DollarSign, ShoppingCart, Users, Package, FileText, Star, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalBlogs: number;
  totalTestimonials: number;
}

const statConfig = [
  { key: "totalRevenue" as const, label: "Total Revenue", icon: DollarSign, format: (v: number) => formatCurrency(v) },
  { key: "totalOrders" as const, label: "Total Orders", icon: ShoppingCart },
  { key: "pendingOrders" as const, label: "Pending Orders", icon: Clock },
  { key: "deliveredOrders" as const, label: "Delivered", icon: CheckCircle },
  { key: "totalCustomers" as const, label: "Customers", icon: Users },
  { key: "totalProducts" as const, label: "Products", icon: Package },
  { key: "totalBlogs" as const, label: "Blogs", icon: FileText },
  { key: "totalTestimonials" as const, label: "Testimonials", icon: Star },
];

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, format }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format ? format(stats[key] as number) : stats[key]}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
