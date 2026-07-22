import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '@/api/auth.api';
import { setUnauthorizedHandler } from '@/api/client';
import { initApiBaseUrl } from '@/lib/env';
import { tokenStorage } from '@/lib/secureStore';
import type { AuthTenant, AuthUser } from '@/api/types';

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
      await initApiBaseUrl();
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        setState({ status: 'signedOut', user: null, tenant: null, error: null });
        return;
      }
      try {
        const user = await getCurrentUser();
        if (user.role !== 'driver') {
          // Non-driver accounts aren't supported by this app's UX — sign them back out.
          await tokenStorage.clear();
          setState({
            status: 'signedOut',
            user: null,
            tenant: null,
            error: 'This app is for drivers only. Please sign in with a driver account.',
          });
          return;
        }
        setState({ status: 'signedIn', user, tenant: user.tenant ?? null, error: null });
      } catch {
        await tokenStorage.clear();
        setState({ status: 'signedOut', user: null, tenant: null, error: null });
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await loginRequest(email, password);
      if (res.user.role !== 'driver') {
        setState({
          status: 'signedOut',
          user: null,
          tenant: null,
          error: 'This app is for drivers only. Please sign in with a driver account.',
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
