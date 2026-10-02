import './global.css';

import React from 'react';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { AuthProvider } from '@/hooks/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// NativeWind only maps `className` -> `style` for core RN components. Without this,
// `className` on LinearGradient is silently dropped (e.g. the login screen's
// `flex-1` gradient collapses to zero height and the app renders blank).
cssInterop(LinearGradient, { className: 'style' });

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ToastProvider>
                <RootNavigator />
                <StatusBar style="light" />
              </ToastProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
