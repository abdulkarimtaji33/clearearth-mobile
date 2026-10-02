import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import type { InspectionRequestStatus } from '@/api/types';
import { INSPECTION_STATUS_CONFIG } from '@/constants/statusConfig';

const STATUS_ORDER: InspectionRequestStatus[] = [
  'request_submitted',
  'team_assigned',
  'inspection_completed',
  'report_submitted',
];

interface InspectionFilterTabsProps {
  active: InspectionRequestStatus | 'all';
  onSelect: (value: InspectionRequestStatus | 'all') => void;
  total: number;
}

export function InspectionFilterTabs({ active, onSelect, total }: InspectionFilterTabsProps) {
  const tabs: { key: InspectionRequestStatus | 'all'; label: string }[] = [
    { key: 'all', label: `All (${total})` },
    ...STATUS_ORDER.map((s) => ({ key: s, label: INSPECTION_STATUS_CONFIG[s].label })),
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
            className={`px-4 py-2 rounded-full ${selected ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800'}`}
          >
            <Text
              className={`text-sm font-semibold ${selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
