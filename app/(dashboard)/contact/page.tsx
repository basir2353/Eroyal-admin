"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function ContactPage() {
  return (
    <div>
      <PageHeader title="Contact Messages" description="Messages submitted from the website contact form" />
      <div className="admin-content">
        <DataList
          endpoint="/contact"
          title="All Messages"
          description="View messages sent by customers through the contact page."
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Date" },
          ]}
        />
      </div>
    </div>
  );
}
