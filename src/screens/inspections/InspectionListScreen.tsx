import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { useInspectionRequests } from '@/hooks/useInspections';
import { Avatar } from '@/components/ui/Avatar';
import { PickupCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { InspectionSummaryTiles, type InspectionSummaryKey } from '@/components/inspections/InspectionSummaryTiles';
import { InspectionFilterTabs } from '@/components/inspections/InspectionFilterTabs';
import { InspectionCard } from '@/components/inspections/InspectionCard';
import { greetingForNow } from '@/constants/statusConfig';
import type { InspectionRequest, InspectionRequestStatus } from '@/api/types';
import type { InspectionStackParamList } from '@/navigation/types';

// Inspection teams deal in the tens of open requests, not thousands — one large
// page covers the whole queue without building out pagination UI (same call the
// driver list makes for pickups).
const PAGE_SIZE = 100;

const SUMMARY_STATUSES: Record<InspectionSummaryKey, InspectionRequestStatus[]> = {
  open: ['request_submitted', 'team_assigned'],
  inspected: ['inspection_completed'],
  reported: ['report_submitted'],
};

export function InspectionListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<InspectionStackParamList>>();
  const { data, isLoading, isError, refetch, isRefetching } = useInspectionRequests({ pageSize: PAGE_SIZE });
  const requests = useMemo(() => data?.data ?? [], [data]);
  const [filter, setFilter] = useState<InspectionSummaryKey | InspectionRequestStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const base: Record<InspectionSummaryKey, number> = { open: 0, inspected: 0, reported: 0 };
    requests.forEach((r) => {
      (Object.keys(SUMMARY_STATUSES) as InspectionSummaryKey[]).forEach((key) => {
        if (SUMMARY_STATUSES[key].includes(r.status)) base[key] += 1;
      });
    });
    return base;
  }, [requests]);

  const filtered = useMemo(() => {
    let result = requests;
    if (filter !== 'all') {
      const statuses = SUMMARY_STATUSES[filter as InspectionSummaryKey] ?? [filter as InspectionRequestStatus];
      result = result.filter((r) => statuses.includes(r.status));
    }
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => {
        const haystack = [
          r.deal?.title,
          r.deal?.deal_number,
          r.deal?.company?.company_name,
          r.location,
          r.materialType?.display_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    return result;
  }, [requests, filter, search]);

  const greeting = greetingForNow();
  const firstName = user?.firstName ?? 'Inspector';

  const handleCardPress = useCallback((id: number) => navigation.navigate('InspectionDetail', { id }), [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: InspectionRequest; index: number }) => (
      <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 8) * 40)}>
        <InspectionCard request={item} onPress={handleCardPress} />
      </Animated.View>
    ),
    [handleCardPress]
  );

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-5">
        <View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{greeting},</Text>
          <Text className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">{firstName} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} hitSlop={10}>
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-5">
          <PickupCardSkeleton />
          <PickupCardSkeleton />
          <PickupCardSkeleton />
        </View>
      ) : isError ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load inspection requests"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View className="mb-5">
              <View className="px-5 mb-4">
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search inspection requests..." />
              </View>
              <InspectionSummaryTiles
                counts={counts}
                active={filter as InspectionSummaryKey | 'all'}
                onSelect={setFilter}
              />
              <View className="h-4" />
              <InspectionFilterTabs
                active={filter as InspectionRequestStatus | 'all'}
                onSelect={setFilter}
                total={requests.length}
              />
            </View>
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          removeClippedSubviews
          initialNumToRender={10}
          windowSize={7}
          ListEmptyComponent={
            <EmptyState
              icon={
                <Ionicons
                  name={search.trim() ? 'search-outline' : 'checkmark-done-outline'}
                  size={40}
                  color="#94A3B8"
                />
              }
              title={
                search.trim()
                  ? 'No matching requests'
                  : filter === 'all'
                    ? 'No inspection requests'
                    : 'Nothing in this filter'
              }
              description={
                search.trim()
                  ? `Nothing matches "${search.trim()}". Try a different search.`
                  : filter === 'all'
                    ? "You're all caught up — new requests will show up here."
                    : 'Try a different filter to see other requests.'
              }
            />
          }
        />
      )}
    </View>
  );
}
