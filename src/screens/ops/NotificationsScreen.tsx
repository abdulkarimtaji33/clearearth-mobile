import React, { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useMarkAllRead, useMarkRead } from '@/hooks/ops/useNotifications';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { openEntity } from '@/navigation/navigationRef';
import { relativeTime } from '@/lib/opsFormat';
import { TONE_HEX, type Tone } from '@/constants/opsStatus';
import type { AppNotification } from '@/api/ops/types';

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; tone: Tone }> = {
  grn_submitted: { icon: 'cube', tone: 'upcoming' },
  expense_submitted: { icon: 'cash', tone: 'today' },
  pickup_date_scheduled: { icon: 'calendar', tone: 'today' },
  pickup_date_confirmed: { icon: 'calendar-clear', tone: 'completed' },
  pickup_reschedule_requested: { icon: 'refresh-circle', tone: 'overdue' },
  pickup_date_rescheduled: { icon: 'calendar', tone: 'upcoming' },
  quotation_approved: { icon: 'checkmark-circle', tone: 'completed' },
  purchase_order_approved: { icon: 'checkmark-circle', tone: 'completed' },
  deal_status_change: { icon: 'briefcase', tone: 'upcoming' },
  leave_requested: { icon: 'airplane', tone: 'today' },
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const sections = useMemo(() => {
    const list = data?.notifications ?? [];
    const today = list.filter((n) => isToday(n.created_at));
    const earlier = list.filter((n) => !isToday(n.created_at));
    return [
      ...(today.length ? [{ title: 'Today', data: today }] : []),
      ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
    ];
  }, [data]);

  function open(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
    openEntity(n.entity_type, n.entity_id);
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader
        title="Notifications"
        subtitle={data?.unreadCount ? `${data.unreadCount} unread` : 'All caught up'}
        back
        right={
          data?.unreadCount ? (
            <Pressable onPress={() => markAll.mutate()} hitSlop={10} accessibilityRole="button">
              <Text className="text-sm font-semibold text-primary-600">Mark all read</Text>
            </Pressable>
          ) : null
        }
      />
      {isLoading ? (
        <View className="p-5" style={{ gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load notifications"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="notifications-off-outline" size={40} color="#94A3B8" />}
              title="No notifications yet"
              description="Pickup dates, expense submissions and GRN updates will show up here."
            />
          }
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-extrabold uppercase text-neutral-500 dark:text-neutral-400 mb-2 mt-2" style={{ letterSpacing: 0.8 }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const meta = ICONS[item.type] ?? { icon: 'notifications' as const, tone: 'neutral' as const };
            const colors = TONE_HEX[meta.tone];
            return (
              <Pressable
                onPress={() => open(item)}
                accessibilityRole="button"
                className={`flex-row rounded-2xl p-3.5 mb-2.5 border ${
                  item.is_read
                    ? 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'
                    : 'bg-primary-50 dark:bg-primary-900/30 border-primary-100 dark:border-primary-800'
                }`}
                style={{ gap: 12 }}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.bg }}>
                  <Ionicons name={meta.icon} size={19} color={colors.fg} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
                    <Text className="flex-1 text-[15px] font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
                      {item.title}
                    </Text>
                    {!item.is_read ? <View className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" /> : null}
                  </View>
                  <Text className="text-[13px] text-neutral-600 dark:text-neutral-300 mt-0.5" numberOfLines={3}>
                    {item.message}
                  </Text>
                  <Text className="text-[11px] text-neutral-400 mt-1.5">{relativeTime(item.created_at)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
