import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '@/api/auth.api';
import { setUnauthorizedHandler } from '@/api/client';
import { initApiBaseUrl } from '@/lib/env';
import { tokenStorage } from '@/lib/secureStore';
import { isSupportedRole } from '@/lib/roles';
import type { AuthTenant, AuthUser } from '@/api/types';

const UNSUPPORTED_ROLE_MESSAGE =
  'This app supports driver and inspection accounts only. Please sign in with one of those.';

interface AuthState {
  status: 'loading' | 'signedIn' | 'signedOut';
  user: AuthUser | null;
  tenant: AuthTenant | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    tenant: null,
    error: null,
  });

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // best-effort — always clear local state regardless
    }
    await tokenStorage.clear();
    setState({ status: 'signedOut', user: null, tenant: null, error: null });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ status: 'signedOut', user: null, tenant: null, error: null });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      // Everything here — including the SecureStore/Keystore reads themselves —
      // must never leave `status` stuck on 'loading': a device-level SecureStore
      // failure (seen on some Android versions/OEMs, e.g. after a key-invalidating
      // OS update) would otherwise hang the app on the splash/loading screen
      // forever with nothing visibly wrong. Any failure anywhere in this flow
      // falls back to a clean signed-out state instead.
      try {
        await initApiBaseUrl();
        const accessToken = await tokenStorage.getAccessToken();
        if (!accessToken) {
          setState({ status: 'signedOut', user: null, tenant: null, error: null });
          return;
        }
        try {
          const user = await getCurrentUser();
          if (!isSupportedRole(user.role)) {
            // Unsupported accounts aren't supported by this app's UX — sign them back out.
            await tokenStorage.clear();
            setState({
              status: 'signedOut',
              user: null,
              tenant: null,
              error: UNSUPPORTED_ROLE_MESSAGE,
            });
            return;
          }
          setState({ status: 'signedIn', user, tenant: user.tenant ?? null, error: null });
        } catch {
          await tokenStorage.clear();
          setState({ status: 'signedOut', user: null, tenant: null, error: null });
        }
      } catch (err) {
        console.error('[AuthProvider] startup failed', err);
        setState({ status: 'signedOut', user: null, tenant: null, error: null });
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await loginRequest(email, password);
      if (!isSupportedRole(res.user.role)) {
        setState({
          status: 'signedOut',
          user: null,
          tenant: null,
          error: UNSUPPORTED_ROLE_MESSAGE,
        });
        return;
      }
      await tokenStorage.setTokens(res.accessToken, res.refreshToken);
      setState({ status: 'signedIn', user: res.user, tenant: res.tenant, error: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Cannot reach the server. Check your connection or API URL in Settings.'
          : 'Invalid email or password.');
      setState({ status: 'signedOut', user: null, tenant: null, error: message });
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, clearError }),
    [state, signIn, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
