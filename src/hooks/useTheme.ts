import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { colorScheme } from 'nativewind';

export type ThemePreference = 'system' | 'light' | 'dark';
const KEY = 'ce_theme_preference';

/** Persisted System / Light / Dark preference, applied through NativeWind's colorScheme. */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') {
          setPreference(v);
          colorScheme.set(v);
        }
      })
      .catch(() => undefined);
  }, []);

  const update = useCallback((next: ThemePreference) => {
    setPreference(next);
    colorScheme.set(next);
    SecureStore.setItemAsync(KEY, next).catch(() => undefined);
  }, []);

  return { preference, setPreference: update };
}

/** Call once at startup so a saved preference applies before the first screen paints. */
export async function applySavedTheme(): Promise<void> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') colorScheme.set(v);
  } catch {
    /* default to system */
  }
}
