import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";

export type Permission = "view" | "create" | "edit" | "delete" | "publish";
export type UserRole = "super_admin" | "admin" | "content_manager" | "order_manager";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await apiPost<{ token: string; user: AdminUser }>("/auth/login", {
            email: email.trim().toLowerCase(),
            password,
          });
          localStorage.setItem("erm_admin_token", result.token);
          set({ token: result.token, user: result.user });
        } catch (err) {
          throw new Error(getApiErrorMessage(err, "Invalid email or password"));
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("erm_admin_token");
        set({ token: null, user: null });
      },

      fetchMe: async () => {
        const user = await apiGet<AdminUser>("/auth/me");
        set({ user });
      },

      hasPermission: (perm) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "super_admin") return true;
        return user.permissions.includes(perm);
      },
    }),
    {
      name: "erm-admin-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
