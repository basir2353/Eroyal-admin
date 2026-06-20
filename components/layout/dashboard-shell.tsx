"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="admin-page min-h-screen bg-background">
        <Sidebar />
        <div className="admin-main lg:pl-[17.5rem]">
          <div className="admin-content-inner mx-auto w-full min-w-0">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
