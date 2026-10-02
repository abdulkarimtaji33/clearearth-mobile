import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { InspectionRequestStatus } from '@/api/types';

export type InspectionSummaryKey = 'open' | 'inspected' | 'reported';

const TILES: { key: InspectionSummaryKey; label: string; statuses: InspectionRequestStatus[]; tone: string }[] = [
  { key: 'open', label: 'Open', statuses: ['request_submitted', 'team_assigned'], tone: 'upcoming' },
  { key: 'inspected', label: 'Inspected', statuses: ['inspection_completed'], tone: 'today' },
  { key: 'reported', label: 'Reported', statuses: ['report_submitted'], tone: 'completed' },
];

const TILE_TEXT_CLASSES: Record<string, string> = {
  upcoming: 'text-upcoming',
  today: 'text-today',
  completed: 'text-completed',
};

const TILE_BG_CLASSES: Record<string, string> = {
  upcoming: 'bg-upcoming-bg dark:bg-upcoming-bgDark',
  today: 'bg-today-bg dark:bg-today-bgDark',
  completed: 'bg-completed-bg dark:bg-completed-bgDark',
};

interface InspectionSummaryTilesProps {
  counts: Record<InspectionSummaryKey, number>;
  active: InspectionSummaryKey | 'all';
  onSelect: (value: InspectionSummaryKey | 'all') => void;
}

function Tile({
  tile,
  count,
  selected,
  onPress,
}: {
  tile: (typeof TILES)[number];
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
        className={`rounded-lg py-3.5 items-center ${TILE_BG_CLASSES[tile.tone]} ${
          selected ? 'border-2 border-neutral-900 dark:border-white' : 'border-2 border-transparent'
        }`}
      >
        <Text className={`text-2xl font-extrabold ${TILE_TEXT_CLASSES[tile.tone]}`}>{count}</Text>
        <Text className={`text-xs font-semibold mt-0.5 ${TILE_TEXT_CLASSES[tile.tone]}`}>{tile.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function InspectionSummaryTiles({ counts, active, onSelect }: InspectionSummaryTilesProps) {
  return (
    <View className="flex-row gap-2.5 px-5">
      {TILES.map((tile) => (
        <Tile
          key={tile.key}
          tile={tile}
          count={counts[tile.key] ?? 0}
          selected={active === tile.key}
          onPress={() => onSelect(active === tile.key ? 'all' : tile.key)}
        />
      ))}
    </View>
  );
}
