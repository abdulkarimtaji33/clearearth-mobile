import React from 'react';
import { Text, View } from 'react-native';
import type { PickupPriority } from '@/theme/tokens';

interface BadgeProps {
  label: string;
  tone?: 'neutral' | PickupPriority;
}

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-neutral-100 dark:bg-neutral-800',
  overdue: 'bg-overdue-bg dark:bg-overdue-bgDark',
  today: 'bg-today-bg dark:bg-today-bgDark',
  upcoming: 'bg-upcoming-bg dark:bg-upcoming-bgDark',
  completed: 'bg-completed-bg dark:bg-completed-bgDark',
};

const TEXT_CLASSES: Record<string, string> = {
  neutral: 'text-neutral-600 dark:text-neutral-300',
  overdue: 'text-overdue',
  today: 'text-today',
  upcoming: 'text-upcoming',
  completed: 'text-completed',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${TONE_CLASSES[tone]}`}>
      <Text className={`text-xs font-semibold ${TEXT_CLASSES[tone]}`}>{label}</Text>
    </View>
  );
}
