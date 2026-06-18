"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Settings,
  Truck,
  ChevronDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavLink = { label: string; href: string };

type NavSection = {
  title: string;
  items: (
    | { type: "link"; label: string; href: string; icon: React.ComponentType<{ className?: string }> }
    | { type: "group"; label: string; icon: React.ComponentType<{ className?: string }>; children: NavLink[] }
  )[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Store",
    items: [
      { type: "link", label: "Products", href: "/products", icon: Package },
      { type: "link", label: "Orders", href: "/orders", icon: ShoppingCart },
      { type: "link", label: "Customers", href: "/customers", icon: Users },
      { type: "link", label: "Contact Messages", href: "/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Content",
    items: [{ type: "link", label: "Blogs", href: "/blogs", icon: FileText }],
  },
  {
    title: "Configuration",
    items: [
      {
        type: "group",
        label: "Settings",
        icon: Settings,
        children: [
          { label: "Payments", href: "/settings/payments" },
          { label: "Email (SMTP)", href: "/settings/email" },
          { label: "Change Password", href: "/settings/password" },
        ],
      },
      { type: "link", label: "Shipping", href: "/shipping", icon: Truck },
    ],
  },
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["Settings"]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label],
    );
  };

  return (
    <aside className="admin-sidebar fixed left-0 top-0 z-40 flex h-screen w-[17.5rem] flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          ER
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">E Royal Mango</p>
          <p className="text-xs text-muted-foreground">Administration</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.type === "link") {
                  const active = isLinkActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                      {item.label}
                    </Link>
                  );
                }

                const isOpen = openGroups.includes(item.label);
                const groupActive = item.children.some((c) => isLinkActive(pathname, c.href));

                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        groupActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                    {isOpen && (
                      <div className="ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
                        {item.children.map((child) => {
                          const active = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block rounded-md px-3 py-2 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
