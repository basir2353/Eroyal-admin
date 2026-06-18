"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function FaqPage() {
  return (
    <div>
      <PageHeader title="FAQ" description="Questions shown on the FAQ help center page" />
      <div className="admin-content">
        <DataList
          endpoint="/faq"
          title="All FAQs"
          description="View-only list grouped by category on the website."
          columns={[
            { key: "category", label: "Category" },
            { key: "question", label: "Question" },
            { key: "sortOrder", label: "Order" },
          ]}
        />
      </div>
    </div>
  );
}
