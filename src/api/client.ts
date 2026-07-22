import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl, onApiBaseUrlChange } from '@/lib/env';
import { tokenStorage } from '@/lib/secureStore';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

onApiBaseUrlChange((url) => {
  apiClient.defaults.baseURL = url;
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * Single-flight refresh: if multiple requests 401 concurrently, only one refresh
 * call fires; the rest wait on the same in-flight promise and retry after.
 */
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${getApiBaseUrl()}/auth/refresh-token`, { refreshToken });
    const newAccessToken: string | undefined = res.data?.data?.accessToken;
    if (!newAccessToken) return null;
    await tokenStorage.setAccessToken(newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/login')) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      await tokenStorage.clear();
      onUnauthorized?.();
    }

    return Promise.reject(error);
  }
);
