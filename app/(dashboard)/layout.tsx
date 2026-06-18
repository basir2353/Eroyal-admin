import { AuthGuard } from "@/components/layout/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="admin-page min-h-screen bg-background">
        <Sidebar />
        <div className="pl-[17.5rem]">
          <div className="admin-content-inner mx-auto w-full">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
