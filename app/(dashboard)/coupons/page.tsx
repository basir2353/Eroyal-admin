"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function CouponsPage() {
  return (
    <div>
      <PageHeader title="Coupons" description="Manage discount codes and promotions" />
      <div className="p-8">
        <DataList
          endpoint="/coupons"
          title="All Coupons"
          columns={[
            { key: "code", label: "Code" },
            { key: "type", label: "Type" },
            { key: "value", label: "Value" },
            { key: "usageLimit", label: "Usage Limit" },
            { key: "expiresAt", label: "Expires" },
          ]}
        />
      </div>
    </div>
  );
}
