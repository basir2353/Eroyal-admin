"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function PaymentsSettingsPage() {
  return (
    <div>
      <PageHeader title="Payment Settings" description="Payment methods available at checkout" />
      <div className="admin-content">
        <SettingsForm
          endpoint="/settings/payments"
          title="Payment Methods"
          description="Enable the payment options your customers can use when placing orders."
          fields={[
            { key: "cashOnDelivery", label: "Cash On Delivery", type: "boolean" },
            { key: "easyPaisa", label: "EasyPaisa", type: "boolean" },
            { key: "jazzCash", label: "JazzCash", type: "boolean" },
            { key: "bankTransfer", label: "Bank Transfer", type: "boolean" },
            { key: "easyPaisaAccount", label: "EasyPaisa Account", type: "text" },
            { key: "jazzCashAccount", label: "JazzCash Account", type: "text" },
            { key: "bankDetails", label: "Bank Details", type: "textarea" },
          ]}
        />
      </div>
    </div>
  );
}
