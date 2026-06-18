"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function ShippingPage() {
  return (
    <div>
      <PageHeader title="Shipping" description="Delivery charges and estimated delivery times" />
      <div className="admin-content">
        <SettingsForm
          endpoint="/settings/shipping"
          title="Shipping Settings"
          description="Configure standard delivery pricing for Pakistan and international orders."
          fields={[
            { key: "pakistanCharge", label: "Pakistan Delivery Charge (PKR)", type: "number" },
            { key: "internationalEnabled", label: "International Shipping", type: "boolean" },
            { key: "internationalCharge", label: "International Charge (PKR)", type: "number" },
            { key: "deliveryDaysMin", label: "Minimum Delivery Days", type: "number" },
            { key: "deliveryDaysMax", label: "Maximum Delivery Days", type: "number" },
          ]}
        />
      </div>
    </div>
  );
}
