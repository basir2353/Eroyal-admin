"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useSidebar } from "@/components/layout/sidebar-context";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { toggle: toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-14 min-h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
            {description && (
              <p className="truncate text-sm text-muted-foreground max-sm:hidden">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-2 py-1.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials ?? "AD"}
            </div>
            <div className="hidden pr-1 text-left md:block">
              <p className="max-w-[140px] truncate text-sm font-medium leading-none">
                {user?.name ?? "Admin"}
              </p>
              <p className="mt-0.5 max-w-[140px] truncate text-xs capitalize text-muted-foreground">
                {user?.role?.replace("_", " ") ?? "Administrator"}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
