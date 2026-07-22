import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import type { PickupPriority } from '@/api/types';
import { PRIORITY_CONFIG, PRIORITY_ORDER } from '@/constants/statusConfig';

interface FilterTabsProps {
  active: PickupPriority | 'all';
  onSelect: (value: PickupPriority | 'all') => void;
  total: number;
}

export function FilterTabs({ active, onSelect, total }: FilterTabsProps) {
  const tabs: { key: PickupPriority | 'all'; label: string }[] = [
    { key: 'all', label: `All (${total})` },
    ...PRIORITY_ORDER.map((p) => ({ key: p, label: PRIORITY_CONFIG[p].label })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            className={`px-4 py-2 rounded-full ${
              selected ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
