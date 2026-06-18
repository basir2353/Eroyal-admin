"use client";

import { useId, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type ChartValueKey = "revenue" | "orders" | "count";

interface ChartPoint {
  _id: string;
  revenue?: number;
  orders?: number;
  count?: number;
}

function formatTooltipValue(value: number, valueKey: ChartValueKey) {
  if (valueKey === "revenue") return formatCurrency(value);
  return String(Math.round(value));
}

function formatYAxisTick(value: number, valueKey: ChartValueKey) {
  if (valueKey === "revenue") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return String(Math.round(value));
  }
  return String(Math.round(value));
}

function computeYMax(values: number[], valueKey: ChartValueKey) {
  const peak = Math.max(...values, 0);
  if (valueKey === "revenue") {
    if (peak === 0) return 1000;
    const step = peak <= 1000 ? 250 : peak <= 10000 ? 2500 : 5000;
    return Math.ceil((peak * 1.1) / step) * step;
  }
  if (peak === 0) return 5;
  return Math.max(Math.ceil(peak) + 1, 5);
}

export function RevenueChart({
  data,
  title,
  valueKey,
}: {
  data: ChartPoint[];
  title: string;
  valueKey: ChartValueKey;
}) {
  const gradientId = useId().replace(/:/g, "");

  const chartData = useMemo(
    () =>
      (data ?? []).map((point) => ({
        month: point._id,
        value: Number(point[valueKey] ?? 0),
      })),
    [data, valueKey],
  );

  const yMax = useMemo(
    () => computeYMax(chartData.map((p) => p.value), valueKey),
    [chartData, valueKey],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={48}
              />
              <YAxis
                className="text-xs"
                domain={[0, yMax]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => formatYAxisTick(Number(v), valueKey)}
                allowDecimals={valueKey === "revenue"}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [formatTooltipValue(Number(value), valueKey), title]}
                labelFormatter={(label) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
