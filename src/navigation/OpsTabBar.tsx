import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useOverview } from '@/hooks/ops/useOverview';
import { useNotifications } from '@/hooks/ops/useNotifications';
import { haptic } from '@/lib/haptics';

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  Home: { label: 'Home', icon: 'grid-outline', iconActive: 'grid' },
  Work: { label: 'Work', icon: 'construct-outline', iconActive: 'construct' },
  Orders: { label: 'Orders', icon: 'document-text-outline', iconActive: 'document-text' },
  Stock: { label: 'Stock', icon: 'cube-outline', iconActive: 'cube' },
  More: { label: 'More', icon: 'ellipsis-horizontal-circle-outline', iconActive: 'ellipsis-horizontal-circle' },
};

/** Bottom tab bar with emerald active state, haptics and live attention badges. */
export function OpsTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { data: overview } = useOverview();
  const { data: notifications } = useNotifications();

  const badges: Record<string, number> = {
    Work: overview?.counts.overdueTasks ?? 0,
    Orders: (overview?.counts.ordersAwaitingWo ?? 0) + (overview?.counts.pendingPickupConfirmations ?? 0),
    Stock: (overview?.counts.grnsNew ?? 0) + (overview?.counts.grnsSubmitted ?? 0),
    More: notifications?.unreadCount ?? 0,
  };

  return (
    <View
      className="flex-row bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name];
        if (!meta) return null;
        const badge = badges[route.name] ?? 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptic.tap();
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={`${meta.label}${badge ? `, ${badge} need attention` : ''}`}
            className="flex-1 items-center"
          >
            <View
              className={`items-center justify-center rounded-full ${focused ? 'bg-primary-50 dark:bg-primary-900/50' : ''}`}
              style={{ width: 56, height: 30 }}
            >
              <Ionicons
                name={focused ? meta.iconActive : meta.icon}
                size={22}
                color={focused ? '#059669' : '#94A3B8'}
              />
              {badge > 0 ? (
                <View className="absolute -top-1 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-danger-500 items-center justify-center">
                  <Text className="text-white text-[10px] font-extrabold">{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              className={`text-[11px] mt-1 font-semibold ${
                focused ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
