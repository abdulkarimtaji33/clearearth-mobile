import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui/StatusPill';
import { GRN_STATUS } from '@/constants/opsStatus';
import { formatShortDate } from '@/lib/format';
import type { Grn } from '@/api/ops/types';

interface GrnCardProps {
  grn: Grn;
  onPress: (id: number) => void;
}

export const GrnCard = React.memo(function GrnCard({ grn, onPress }: GrnCardProps) {
  const items = grn.items ?? [];
  const photos = items.reduce((n, i) => n + (i.images?.length ?? 0), 0);
  return (
    <Pressable
      onPress={() => onPress(grn.id)}
      accessibilityRole="button"
      accessibilityLabel={`${grn.grn_number}, ${GRN_STATUS[grn.status].label}`}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 active:opacity-90"
      style={{ shadowColor: '#0A1628', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">{grn.grn_number}</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1" numberOfLines={1}>
            {[grn.deal?.title, grn.deal?.company?.company_name].filter(Boolean).join(' · ') || 'No deal'}
          </Text>
        </View>
        <StatusPill meta={GRN_STATUS[grn.status]} />
      </View>
      <View className="flex-row items-center mt-3" style={{ gap: 14 }}>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Ionicons name="layers-outline" size={14} color="#94A3B8" />
          <Text className="text-xs text-neutral-500">{items.length} item{items.length === 1 ? '' : 's'}</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Ionicons name="images-outline" size={14} color="#94A3B8" />
          <Text className="text-xs text-neutral-500">{photos} photo{photos === 1 ? '' : 's'}</Text>
        </View>
        {grn.workOrder ? (
          <View className="flex-row items-center flex-1" style={{ gap: 4 }}>
            <Ionicons name="construct-outline" size={14} color="#94A3B8" />
            <Text className="text-xs text-neutral-500 flex-1" numberOfLines={1}>
              {grn.workOrder.title ?? `WO #${grn.workOrder.id}`}
            </Text>
          </View>
        ) : null}
        <Text className="text-xs text-neutral-400">{formatShortDate(grn.created_at?.slice(0, 10))}</Text>
      </View>
    </Pressable>
  );
});
