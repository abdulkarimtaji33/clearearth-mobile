import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ce_access_token';
const REFRESH_TOKEN_KEY = 'ce_refresh_token';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async setAccessToken(accessToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

const API_URL_OVERRIDE_KEY = 'ce_api_url_override';

export const apiUrlOverrideStorage = {
  async get(): Promise<string | null> {
    return SecureStore.getItemAsync(API_URL_OVERRIDE_KEY);
  },
  async set(url: string): Promise<void> {
    await SecureStore.setItemAsync(API_URL_OVERRIDE_KEY, url);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(API_URL_OVERRIDE_KEY);
  },
};
