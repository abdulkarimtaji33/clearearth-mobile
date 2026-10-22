import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeals } from '@/hooks/ops/useMore';
import { useDebounce } from '@/hooks/ops/useDebounce';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatShortDate } from '@/lib/format';
import type { DealListItem } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

const DEAL_TYPE: Record<string, string> = {
  offer_to_charge: 'Offer to charge',
  offer_to_purchase: 'Offer to purchase',
  free_of_charge: 'Free of charge',
};

export function DealsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const list = useDeals({ search: debounced.trim() || undefined });

  const renderItem = useCallback(
    ({ item }: { item: DealListItem }) => (
      <Pressable
        onPress={() => navigation.navigate('DealDetail', { id: item.id })}
        accessibilityRole="button"
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 active:opacity-90"
      >
        <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
          <View className="flex-1">
            <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">Deal {item.deal_number ?? item.id}</Text>
            <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mt-0.5" numberOfLines={2}>
              {item.title ?? 'Untitled deal'}
            </Text>
            <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
              {item.company?.company_name ?? item.supplier?.company_name ?? 'No client'}
            </Text>
          </View>
          {item.status ? <StatusPill label={item.status.replace(/_/g, ' ')} tone="upcoming" /> : null}
        </View>
        <View className="flex-row items-center mt-2.5" style={{ gap: 12 }}>
          {item.deal_type ? <Text className="text-xs text-neutral-500">{DEAL_TYPE[item.deal_type] ?? item.deal_type}</Text> : null}
          {item.deal_date ? <Text className="text-xs text-neutral-400">{formatShortDate(item.deal_date.slice(0, 10))}</Text> : null}
        </View>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Deals" subtitle={list.total ? `${list.total} total` : 'Read-only'} back />
      <View className="px-5 pt-3 pb-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search deals..." />
      </View>
      {list.isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </View>
      ) : list.isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load deals"
          action={<Button label="Retry" onPress={() => list.refetch()} />}
        />
      ) : (
        <FlatList
          data={list.rows}
          keyExtractor={(d) => String(d.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={list.refetch} tintColor="#10B981" />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon={<Ionicons name="briefcase-outline" size={40} color="#94A3B8" />} title={search ? 'No matching deals' : 'No deals'} />}
        />
      )}
    </View>
  );
}
