import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { InspectionRequest } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { INSPECTION_PRIORITY_CONFIG, INSPECTION_STATUS_CONFIG } from '@/constants/statusConfig';
import { formatShortDate } from '@/lib/format';
import { formatRequestNumber } from '@/lib/inspectionHelpers';

interface InspectionCardProps {
  request: InspectionRequest;
  onPress: (id: number) => void;
}

const ACCENT_CLASSES: Record<InspectionRequest['priority'], string> = {
  critical: 'bg-overdue',
  high: 'bg-today',
  medium: 'bg-upcoming',
  low: 'bg-completed',
};

function InspectionCardImpl({ request, onPress }: InspectionCardProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const deal = request.deal;
  const title = deal?.title || formatRequestNumber(request.id);
  const companyName = deal?.company?.company_name;
  const dueLabel = formatShortDate(request.preferred_inspection_date);

  return (
    <Animated.View style={style} className="mb-3 mx-5">
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 90 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        onPress={() => onPress(request.id)}
        className="flex-row bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden"
        style={{
          shadowColor: '#0A1628',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View className={`w-1.5 ${ACCENT_CLASSES[request.priority]}`} />
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-1.5">
            <Text className="flex-1 text-base font-bold text-neutral-900 dark:text-neutral-50 pr-2" numberOfLines={1}>
              {title}
            </Text>
            <Badge
              label={INSPECTION_PRIORITY_CONFIG[request.priority].label}
              tone={INSPECTION_PRIORITY_CONFIG[request.priority].tone}
            />
          </View>

          <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {[formatRequestNumber(request.id), companyName].filter(Boolean).join(' · ')}
          </Text>

          {request.location ? (
            <View className="flex-row items-start mt-1.5 gap-1">
              <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
                {request.location}
              </Text>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mt-3">
            <Badge
              label={INSPECTION_STATUS_CONFIG[request.status].label}
              tone={INSPECTION_STATUS_CONFIG[request.status].tone}
            />
            {dueLabel ? <Text className="text-xs text-neutral-400 dark:text-neutral-500">Due {dueLabel}</Text> : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const InspectionCard = React.memo(InspectionCardImpl);
