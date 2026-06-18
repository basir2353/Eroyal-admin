"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function WebsiteSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Website Settings"
        description="Brand identity and contact details used across the storefront"
      />
      <div className="admin-content">
        <SettingsForm
          endpoint="/settings/website"
          title="General Settings"
          description="These values appear in the header, footer, contact page, and WhatsApp button."
          fields={[
            { key: "siteName", label: "Website Name", type: "text" },
            { key: "logo", label: "Logo URL", type: "text", hint: "Upload in Media Library and paste the image URL." },
            { key: "contactPhone", label: "Contact Phone", type: "text" },
            { key: "contactEmail", label: "Contact Email", type: "email" },
            { key: "whatsapp", label: "WhatsApp Number", type: "text", hint: "Used for the floating WhatsApp chat button." },
            { key: "address", label: "Business Address", type: "text" },
            { key: "footerContent", label: "Footer About Text", type: "textarea", hint: "Short description shown in the website footer." },
            { key: "copyrightText", label: "Copyright Text", type: "text" },
            { key: "socialLinks", label: "Social Links", type: "json", hint: "JSON array: [{ \"platform\": \"facebook\", \"url\": \"...\" }]" },
          ]}
        />
      </div>
    </div>
  );
}
