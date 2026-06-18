"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface DataListProps {
  endpoint: string;
  title: string;
  description?: string;
  columns: {
    key: string;
    label: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }[];
}

export function DataList({ endpoint, title, description, columns }: DataListProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ items: Record<string, unknown>[] } | Record<string, unknown>[]>(endpoint)
      .then((res) => {
        if (Array.isArray(res)) setItems(res);
        else setItems(res.items ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <Badge variant="secondary">{items.length} records</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                    No records found
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr
                    key={String(row._id ?? row.id ?? idx)}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-3.5 align-middle">
                        {col.render
                          ? col.render(row[col.key], row)
                          : col.key === "createdAt"
                            ? formatDate(row[col.key] as string)
                            : col.key === "status"
                              ? (
                                <Badge
                                  variant={
                                    row[col.key] === "published" ||
                                    row[col.key] === "delivered" ||
                                    row[col.key] === "read"
                                      ? "success"
                                      : "secondary"
                                  }
                                >
                                  {String(row[col.key] ?? "-")}
                                </Badge>
                              )
                              : String(row[col.key] ?? row.title ?? row.name ?? row.question ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
