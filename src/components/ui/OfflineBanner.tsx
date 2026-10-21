import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Thin banner shown while the device has no connectivity. Also feeds React Query's onlineManager so
 * queries pause instead of failing and resume automatically on reconnect.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        const online = state.isConnected !== false && state.isInternetReachable !== false;
        setOnline(online);
        setOffline(!online);
      })
    );
  }, []);

  if (!offline) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      className="absolute left-0 right-0 flex-row items-center justify-center bg-neutral-800 py-2"
      style={{ top: 0, paddingTop: insets.top + 6, zIndex: 50, gap: 6 }}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
      <Text className="text-white text-xs font-semibold">You're offline. Showing saved data.</Text>
    </Animated.View>
  );
}
