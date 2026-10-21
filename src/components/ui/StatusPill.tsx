import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TONE_HEX, type StatusMeta, type Tone } from '@/constants/opsStatus';

interface StatusPillProps {
  meta?: StatusMeta;
  label?: string;
  tone?: Tone;
  icon?: StatusMeta['icon'];
  size?: 'sm' | 'md';
  onPress?: () => void;
}

/** Rounded status chip with tone-matched icon. Pass `meta` from constants/opsStatus. */
export function StatusPill({ meta, label, tone, icon, size = 'sm', onPress }: StatusPillProps) {
  const resolvedTone = tone ?? meta?.tone ?? 'neutral';
  const resolvedIcon = icon ?? meta?.icon;
  const text = label ?? meta?.label ?? '';
  const colors = TONE_HEX[resolvedTone];
  const iconSize = size === 'md' ? 15 : 12;

  const content = (
    <View
      className={`flex-row items-center self-start rounded-full ${size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1'}`}
      style={{ backgroundColor: colors.bg, gap: 4 }}
    >
      {resolvedIcon ? <Ionicons name={resolvedIcon} size={iconSize} color={colors.fg} /> : null}
      <Text style={{ color: colors.fg, fontSize: size === 'md' ? 13 : 11.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${text}. Tap to change`}>
      {content}
    </Pressable>
  );
}
