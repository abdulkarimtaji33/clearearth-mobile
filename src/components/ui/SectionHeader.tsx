import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
  /** Horizontal padding so it lines up with list content. */
  padded?: boolean;
}

export function SectionHeader({ title, count, actionLabel, onAction, padded = true }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between mb-3 ${padded ? 'px-5' : ''}`}>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">{title}</Text>
        {count !== undefined ? (
          <View className="px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{count}</Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
