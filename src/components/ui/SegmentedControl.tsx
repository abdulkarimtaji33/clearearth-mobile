import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { haptic } from '@/lib/haptics';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

/** Equal-width iOS-style segmented control for 2-4 options. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              if (!active) haptic.tap();
              onChange(o.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center justify-center py-2.5 rounded-lg ${
              active ? 'bg-white dark:bg-neutral-700' : ''
            }`}
            style={
              active
                ? { shadowColor: '#0A1628', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }
                : undefined
            }
          >
            <Text
              className={`text-sm font-semibold ${
                active ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-500 dark:text-neutral-400'
              }`}
              numberOfLines={1}
            >
              {o.label}
              {o.count !== undefined ? `  ${o.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ChipRowProps<T extends string> {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (key: T | null) => void;
  /** Tapping the active chip clears it when true (for optional filters). */
  toggleable?: boolean;
  paddingHorizontal?: number;
}

/** Horizontally scrolling filter chips. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  toggleable = false,
  paddingHorizontal = 20,
}: ChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal, gap: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              haptic.tap();
              onChange(active && toggleable ? null : o.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`flex-row items-center px-4 py-2.5 rounded-full border ${
              active
                ? 'bg-primary-600 border-primary-600'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
            }`}
            style={{ gap: 6 }}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? 'text-white' : 'text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {o.label}
            </Text>
            {o.count !== undefined ? (
              <View className={`px-1.5 rounded-full ${active ? 'bg-white/25' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                <Text
                  className={`text-xs font-bold ${active ? 'text-white' : 'text-neutral-500 dark:text-neutral-300'}`}
                >
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
