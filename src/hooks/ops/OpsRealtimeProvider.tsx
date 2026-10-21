import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import { registerPushToken, removePushToken } from '@/api/ops/common.api';
import { getApiOrigin } from '@/lib/env';
import { tokenStorage } from '@/lib/secureStore';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/components/ui/Toast';
import { openEntity } from '@/navigation/navigationRef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Keeps the Operations app live while signed in:
 *  - Socket.IO `notification` events refresh the dashboard + inbox and raise a toast.
 *  - Registers an Expo push token (best effort: needs a real device and an EAS projectId;
 *    silently skipped otherwise) and routes notification taps to the right screen.
 */
export function OpsRealtimeProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    (async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token || cancelled) return;
      socket = io(getApiOrigin(), {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket'],
        reconnectionDelayMax: 15_000,
      });
      socket.on('notification', (n: { title?: string; message?: string }) => {
        haptic.light();
        toast.show(n.title || n.message || 'New notification', 'info');
        qc.invalidateQueries({ queryKey: opsKeys.notifications });
        qc.invalidateQueries({ queryKey: opsKeys.overview });
        qc.invalidateQueries({ queryKey: opsKeys.workOrders });
        qc.invalidateQueries({ queryKey: opsKeys.orders });
        qc.invalidateQueries({ queryKey: opsKeys.grns });
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
    // toast.show is stable; qc is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let pushToken: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        if (!Device.isDevice) return;
        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) return; // push needs an EAS project; the in-app socket still works

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Operations',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }
        const existing = await Notifications.getPermissionsAsync();
        const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
        if (!status.granted || cancelled) return;

        const res = await Notifications.getExpoPushTokenAsync({ projectId });
        pushToken = res.data;
        await registerPushToken(pushToken, Platform.OS);
      } catch {
        // Push is optional; never block the app on it.
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { entityType?: string | null; entityId?: number | null }
        | undefined;
      openEntity(data?.entityType, data?.entityId);
    });

    return () => {
      cancelled = true;
      sub.remove();
      if (pushToken) removePushToken(pushToken).catch(() => undefined);
    };
  }, []);

  return <>{children}</>;
}
