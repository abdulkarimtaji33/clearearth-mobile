import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TONE_HEX, type Tone } from '@/constants/opsStatus';

export interface CardAction {
  label: string;
  onPress: () => void;
  primary?: boolean;
  loading?: boolean;
}

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  title: string;
  subtitle?: string;
  actions?: CardAction[];
  onPress?: () => void;
}

/** "Needs you" feed card: toned icon, two-line summary, and one-tap actions. */
export function ActionCard({ icon, tone, title, subtitle, actions = [], onPress }: ActionCardProps) {
  const colors = TONE_HEX[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 active:opacity-90"
      style={{ shadowColor: '#0A1628', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <Ionicons name={icon} size={20} color={colors.fg} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onPress && actions.length === 0 ? <Ionicons name="chevron-forward" size={18} color="#94A3B8" /> : null}
      </View>
      {actions.length > 0 ? (
        <View className="flex-row mt-3.5" style={{ gap: 8 }}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              disabled={a.loading}
              accessibilityRole="button"
              className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
                a.primary ? 'bg-primary-600 active:bg-primary-700' : 'bg-neutral-100 dark:bg-neutral-800 active:opacity-70'
              } ${a.loading ? 'opacity-60' : ''}`}
            >
              <Text className={`text-sm font-bold ${a.primary ? 'text-white' : 'text-neutral-700 dark:text-neutral-200'}`}>
                {a.loading ? 'Working...' : a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
