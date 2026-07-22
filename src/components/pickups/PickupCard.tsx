import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { PickupListItem } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { PRIORITY_CONFIG } from '@/constants/statusConfig';
import { formatShortDate } from '@/lib/format';

interface PickupCardProps {
  pickup: PickupListItem;
  /** Stable callback (e.g. from useCallback) — receives the pressed pickup's taskId. */
  onPress: (taskId: number) => void;
}

const ACCENT_CLASSES: Record<PickupListItem['priority'], string> = {
  overdue: 'bg-overdue',
  today: 'bg-today',
  upcoming: 'bg-upcoming',
  completed: 'bg-completed',
};

function PickupCardImpl({ pickup, onPress }: PickupCardProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const title = pickup.deal?.title || pickup.workOrderTitle || `Work Order #${pickup.workOrderId}`;
  const dealNumber = pickup.deal?.deal_number;
  const dueLabel = formatShortDate(pickup.endDate);

  return (
    <Animated.View style={style} className="mb-3 mx-5">
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 90 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        onPress={() => onPress(pickup.taskId)}
        className="flex-row bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden"
        style={{
          shadowColor: '#0A1628',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View className={`w-1.5 ${ACCENT_CLASSES[pickup.priority]}`} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-1.5">
            <Text
              className="flex-1 text-base font-bold text-neutral-900 dark:text-neutral-50 pr-2"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Badge label={PRIORITY_CONFIG[pickup.priority].label} tone={pickup.priority} />
          </View>

          <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {[dealNumber ? `#${dealNumber}` : null, pickup.typeOfWork].filter(Boolean).join(' · ')}
          </Text>

          {pickup.deal?.pickup_location ? (
            <View className="flex-row items-start mt-1.5 gap-1">
              <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
                {pickup.deal.pickup_location}
              </Text>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mt-3">
            {pickup.deal?.pickup_contact_name ? (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 flex-1" numberOfLines={1}>
                {pickup.deal.pickup_contact_name}
              </Text>
            ) : (
              <View className="flex-1" />
            )}

            {pickup.priority === 'overdue' && pickup.daysOverdue > 0 ? (
              <Text className="text-xs font-bold text-overdue">
                {pickup.daysOverdue}d overdue
              </Text>
            ) : dueLabel && pickup.priority !== 'completed' ? (
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">Due {dueLabel}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Memoized: pickup list items only need to re-render when their own data or the
// (stable, useCallback'd) onPress reference changes — not on every parent re-render.
export const PickupCard = React.memo(PickupCardImpl);
