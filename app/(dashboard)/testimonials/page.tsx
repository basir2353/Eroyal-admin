"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function TestimonialsPage() {
  return (
    <div>
      <PageHeader title="Testimonials" description="Customer reviews on the homepage" />
      <div className="admin-content">
        <DataList
          endpoint="/testimonials"
          title="All Testimonials"
          description="View-only list of customer testimonials."
          columns={[
            { key: "customerName", label: "Customer" },
            { key: "rating", label: "Rating" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Date" },
          ]}
        />
      </div>
    </div>
  );
}
