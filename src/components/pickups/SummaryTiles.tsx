import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { PickupPriority } from '@/api/types';
import { PRIORITY_CONFIG, PRIORITY_ORDER } from '@/constants/statusConfig';

interface SummaryTilesProps {
  counts: Record<PickupPriority, number>;
  active: PickupPriority | 'all';
  onSelect: (value: PickupPriority | 'all') => void;
}

const TILE_TEXT_CLASSES: Record<PickupPriority, string> = {
  overdue: 'text-overdue',
  today: 'text-today',
  upcoming: 'text-upcoming',
  completed: 'text-completed',
};

const TILE_BG_CLASSES: Record<PickupPriority, string> = {
  overdue: 'bg-overdue-bg dark:bg-overdue-bgDark',
  today: 'bg-today-bg dark:bg-today-bgDark',
  upcoming: 'bg-upcoming-bg dark:bg-upcoming-bgDark',
  completed: 'bg-completed-bg dark:bg-completed-bgDark',
};

function Tile({
  priority,
  count,
  selected,
  onPress,
}: {
  priority: PickupPriority;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style} className="flex-1">
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.95, { duration: 90 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        onPress={onPress}
        className={`rounded-lg py-3.5 items-center ${TILE_BG_CLASSES[priority]} ${
          selected ? 'border-2 border-neutral-900 dark:border-white' : 'border-2 border-transparent'
        }`}
      >
        <Text className={`text-2xl font-extrabold ${TILE_TEXT_CLASSES[priority]}`}>{count}</Text>
        <Text className={`text-xs font-semibold mt-0.5 ${TILE_TEXT_CLASSES[priority]}`}>
          {PRIORITY_CONFIG[priority].label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function SummaryTiles({ counts, active, onSelect }: SummaryTilesProps) {
  return (
    <View className="flex-row gap-2.5 px-5">
      {PRIORITY_ORDER.map((priority) => (
        <Tile
          key={priority}
          priority={priority}
          count={counts[priority] ?? 0}
          selected={active === priority}
          onPress={() => onSelect(active === priority ? 'all' : priority)}
        />
      ))}
    </View>
  );
}
