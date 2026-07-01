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
  Image,
  X,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/layout/sidebar-context";

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
      { type: "link", label: "Complete Payment", href: "/complete-payment", icon: CircleDollarSign },
      { type: "link", label: "Customers", href: "/customers", icon: Users },
      { type: "link", label: "Contact Messages", href: "/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Content",
    items: [
      { type: "link", label: "Carousel Banners", href: "/carousel", icon: Image },
      { type: "link", label: "Blogs", href: "/blogs", icon: FileText },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        type: "group",
        label: "Settings",
        icon: Settings,
        children: [
          { label: "Announcements", href: "/settings/announcements" },
          { label: "SMS / WhatsApp", href: "/settings/sms" },
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
  const { open, close } = useSidebar();
  const [openGroups, setOpenGroups] = useState<string[]>(["Settings"]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label],
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        onClick={close}
      />

      <aside
        className={cn(
          "admin-sidebar fixed left-0 top-0 z-50 flex h-screen w-[17.5rem] max-w-[85vw] flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              ER
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">E Royal Mango</p>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
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
                        onClick={close}
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
                                onClick={close}
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
    </>
  );
}
