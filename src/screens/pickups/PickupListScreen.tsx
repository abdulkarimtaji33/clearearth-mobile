import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { usePickups } from '@/hooks/usePickups';
import { Avatar } from '@/components/ui/Avatar';
import { PickupCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SummaryTiles } from '@/components/pickups/SummaryTiles';
import { FilterTabs } from '@/components/pickups/FilterTabs';
import { PickupCard } from '@/components/pickups/PickupCard';
import { greetingForNow } from '@/constants/statusConfig';
import type { PickupPriority } from '@/api/types';
import type { AppStackParamList } from '@/navigation/types';

export function PickupListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, isLoading, isError, refetch, isRefetching } = usePickups();
  const [filter, setFilter] = useState<PickupPriority | 'all'>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const base: Record<PickupPriority, number> = { overdue: 0, today: 0, upcoming: 0, completed: 0 };
    (data ?? []).forEach((p) => {
      base[p.priority] = (base[p.priority] ?? 0) + 1;
    });
    return base;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = filter === 'all' ? data : data.filter((p) => p.priority === filter);

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => {
        const haystack = [
          p.deal?.title,
          p.workOrderTitle,
          p.deal?.deal_number,
          p.typeOfWork,
          p.deal?.pickup_contact_name,
          p.deal?.pickup_location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    return result;
  }, [data, filter, search]);

  const greeting = greetingForNow();
  const firstName = user?.firstName ?? 'Driver';

  const handleCardPress = useCallback(
    (taskId: number) => navigation.navigate('PickupDetail', { taskId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof filtered)[number]; index: number }) => (
      <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 8) * 40)}>
        <PickupCard pickup={item} onPress={handleCardPress} />
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
          title="Couldn't load your pickups"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.taskId)}
          ListHeaderComponent={
            <View className="mb-5">
              <View className="px-5 mb-4">
                <SearchBar value={search} onChangeText={setSearch} />
              </View>
              <SummaryTiles counts={counts} active={filter} onSelect={setFilter} />
              <View className="h-4" />
              <FilterTabs active={filter} onSelect={setFilter} total={data?.length ?? 0} />
            </View>
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />
          }
          // A driver's list is small (tens of items, not thousands), so this is mostly
          // about keeping scroll buttery on low-end devices rather than raw windowing need.
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
                  ? 'No matching pickups'
                  : filter === 'all'
                    ? 'No pickups assigned'
                    : `No ${filter} pickups`
              }
              description={
                search.trim()
                  ? `Nothing matches "${search.trim()}". Try a different search.`
                  : filter === 'all'
                    ? "You're all caught up — new pickups will show up here."
                    : 'Try a different filter to see other pickups.'
              }
            />
          }
        />
      )}
    </View>
  );
}
