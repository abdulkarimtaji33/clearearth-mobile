import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KpiTileProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Turns the tile red-tinted (e.g. overdue > 0). */
  alert?: boolean;
  onPress?: () => void;
}

/** Glass-style KPI tile for the navy hero. Big tabular number, small label, optional alert tint. */
export function KpiTile({ label, value, icon, alert = false, onPress }: KpiTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      className="rounded-2xl p-3.5 active:opacity-80"
      style={{
        width: 132,
        backgroundColor: alert ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: alert ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.14)',
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: alert ? 'rgba(248,113,113,0.25)' : 'rgba(16,185,129,0.25)' }}
        >
          <Ionicons name={icon} size={16} color={alert ? '#FCA5A5' : '#6EE7B7'} />
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.45)" /> : null}
      </View>
      <Text className="text-white font-extrabold" style={{ fontSize: 28, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
