import axios, { type AxiosError } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://eroyal-backend-production.up.railway.app/api"
    : "http://localhost:4000/api");

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("erm_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const isAuthPage = path.startsWith("/login") || path.startsWith("/forgot-password") || path.startsWith("/reset-password");
      if (!isAuthPage) {
        localStorage.removeItem("erm_admin_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message for failed API calls (login, forms, etc.). */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Cannot reach the API server at ${API_URL}. Check that the backend is running and NEXT_PUBLIC_API_URL is set on Vercel.`;
    }
    return error.response.data?.message ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>) {
  const { data } = await api.get<ApiResponse<T>>(path, { params });
  return data.data;
}

export async function apiPost<T>(path: string, body?: unknown) {
  const { data } = await api.post<ApiResponse<T>>(path, body);
  return data.data;
}

export async function apiPut<T>(path: string, body?: unknown) {
  const { data } = await api.put<ApiResponse<T>>(path, body);
  return data.data;
}

export async function apiPatch<T>(path: string, body?: unknown) {
  const { data } = await api.patch<ApiResponse<T>>(path, body);
  return data.data;
}

export async function apiDelete<T>(path: string) {
  const { data } = await api.delete<ApiResponse<T>>(path);
  return data.data;
}

export async function apiUploadFile(file: File): Promise<{ url: string; _id?: string; id?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ApiResponse<{ url: string; _id?: string; id?: string }>>(
    "/media",
    formData,
  );
  return data.data;
}

export async function apiImportImageUrl(url: string): Promise<{ url: string; _id?: string; id?: string }> {
  const { data } = await api.post<ApiResponse<{ url: string; _id?: string; id?: string }>>(
    "/media/import-url",
    { url },
  );
  return data.data;
}
