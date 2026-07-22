import Constants from 'expo-constants';
import { apiUrlOverrideStorage } from './secureStore';

/**
 * Resolves the backend API base URL.
 *
 * Priority: dev-only in-app override (Settings screen, persisted in SecureStore)
 * > EXPO_PUBLIC_API_URL build-time env var > a same-LAN guess derived from the
 * Metro dev server host (works out of the box for most physical-device dev setups).
 */

function guessDevApiUrl(): string {
  // hostUri looks like "192.168.1.23:8081" when running via `expo start` on a LAN.
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3000/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
}

const BUILD_TIME_API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;

let currentApiBaseUrl: string = BUILD_TIME_API_URL || guessDevApiUrl();
const listeners = new Set<(url: string) => void>();

export function getApiBaseUrl(): string {
  return currentApiBaseUrl;
}

export function getApiOrigin(): string {
  // Strip a trailing /api/v1 (or similar) to get the origin that /uploads/* is served from.
  return currentApiBaseUrl.replace(/\/api(\/v\d+)?\/?$/, '');
}

export async function setApiBaseUrl(url: string, persist = true): Promise<void> {
  currentApiBaseUrl = url;
  listeners.forEach((l) => l(url));
  if (persist) await apiUrlOverrideStorage.set(url);
}

export async function resetApiBaseUrl(): Promise<void> {
  currentApiBaseUrl = BUILD_TIME_API_URL || guessDevApiUrl();
  listeners.forEach((l) => l(currentApiBaseUrl));
  await apiUrlOverrideStorage.clear();
}

export function onApiBaseUrlChange(listener: (url: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call once at app startup to hydrate any persisted dev override. */
export async function initApiBaseUrl(): Promise<void> {
  const override = await apiUrlOverrideStorage.get();
  if (override) {
    currentApiBaseUrl = override;
    listeners.forEach((l) => l(override));
  }
}

export const isDev = __DEV__;
