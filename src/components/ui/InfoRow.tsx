import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  /** Makes the whole row tappable (call, open maps...). */
  onPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

/** Label/value row with a leading icon; renders nothing when there's no value. */
export function InfoRow({ icon, label, value, onPress, actionIcon }: InfoRowProps) {
  if (!value) return null;
  const body = (
    <View className="flex-row items-center py-2.5" style={{ gap: 12 }}>
      <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center">
        <Ionicons name={icon} size={17} color="#059669" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
        <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50 mt-0.5">{value}</Text>
      </View>
      {onPress ? <Ionicons name={actionIcon ?? 'chevron-forward'} size={18} color="#94A3B8" /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      {body}
    </Pressable>
  );
}
