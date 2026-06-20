"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" description="Manage product categories" />
      <div className="admin-content">
        <DataList
          endpoint="/categories"
          title="All Categories"
          columns={[
            { key: "name", label: "Name" },
            { key: "slug", label: "Slug" },
            { key: "description", label: "Description" },
          ]}
        />
      </div>
    </div>
  );
}
