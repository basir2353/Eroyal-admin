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
            { key: "paymentInstructions", label: "Payment Instructions", type: "textarea" },
            { key: "jazzCashAccount", label: "JazzCash Account Number", type: "text" },
            { key: "easyPaisaAccount", label: "EasyPaisa Account Number", type: "text" },
            { key: "bankName", label: "Bank Name", type: "text" },
            { key: "bankAccountTitle", label: "Bank Account Title", type: "text" },
            { key: "bankAccountNumber", label: "Bank Account Number", type: "text" },
            { key: "bankIban", label: "Bank IBAN", type: "text" },
            { key: "bankDetails", label: "Additional Bank Details", type: "textarea" },
          ]}
        />
      </div>
    </div>
  );
}
