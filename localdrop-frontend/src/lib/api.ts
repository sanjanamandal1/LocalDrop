import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";
import type { ApiResponse } from "@/types/api";
import { getStoredLanguage, translate } from "@/i18n/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Accept-Language"] = getStoredLanguage();
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const message = error.response?.data?.message || "";
    if (error.response?.status === 401 && original && !original._retry && message.toLowerCase().includes("expired")) {
      original._retry = true;
      refreshing ??= refreshAccessToken();
      const token = await refreshing.finally(() => {
        refreshing = null;
      });
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(`${API_URL}/auth/refresh`, { refreshToken }, {
      headers: { "Accept-Language": getStoredLanguage() }
    });
    const token = response.data.data.accessToken;
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

export function apiError(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message;
  }
  return translate(getStoredLanguage(), "error.generic");
}
