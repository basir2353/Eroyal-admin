"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataList } from "@/components/shared/data-list";

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="Users & Roles" description="Manage admin users and role-based permissions" />
      <div className="admin-content">
        <DataList
          endpoint="/users"
          title="Admin Users"
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "role",
              label: "Role",
              render: (v) => String(v).replace("_", " "),
            },
            { key: "isActive", label: "Active", render: (v) => (v ? "Yes" : "No") },
          ]}
        />
      </div>
    </div>
  );
}
