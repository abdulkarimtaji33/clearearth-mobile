import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCertificateRequests, useCertificates } from '@/hooks/ops/useMore';
import { useDebounce } from '@/hooks/ops/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { CERT_REQUEST_STATUS } from '@/constants/opsStatus';
import { openApiPdf } from '@/lib/files';
import { formatShortDate } from '@/lib/format';
import { formatQty } from '@/lib/opsFormat';
import { toUserMessage } from '@/lib/errors';

type Segment = 'requests' | 'register';

export function CertificatesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = usePermission();
  const allowed = can('certificates.read');
  const [segment, setSegment] = useState<Segment>('requests');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const requests = useCertificateRequests(debounced.trim(), null, allowed && segment === 'requests');
  const register = useCertificates(debounced.trim(), allowed && segment === 'register');
  const active = segment === 'requests' ? requests : register;

  async function openPdf(id: number, number: string) {
    try {
      await openApiPdf(`/certificates/${id}/pdf`, `${number}.pdf`);
    } catch (err) {
      toast.show(toUserMessage(err, 'Could not open the certificate.'), 'error');
    }
  }

  if (!allowed) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
        <ScreenHeader title="Certificates" back />
        <EmptyState
          icon={<Ionicons name="lock-closed-outline" size={40} color="#94A3B8" />}
          title="No access to certificates"
          description="Ask an administrator to grant your role the certificates permission."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="Certificates" subtitle="Destruction and recycling certificates" back />
      <View className="px-5 pt-3">
        <SegmentedControl<Segment>
          options={[
            { key: 'requests', label: 'Requests' },
            { key: 'register', label: 'Issued register' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>
      <View className="px-5 pt-3 pb-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search..." />
      </View>

      {active.isLoading ? (
        <View className="px-5" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </View>
      ) : active.isError ? (
        <EmptyState title="Couldn't load certificates" action={<Button label="Retry" onPress={() => active.refetch()} />} />
      ) : segment === 'requests' ? (
        <FlatList
          key="requests"
          data={requests.rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={requests.isRefetching} onRefresh={requests.refetch} tintColor="#10B981" />}
          onEndReached={requests.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={requests.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon={<Ionicons name="ribbon-outline" size={40} color="#94A3B8" />} title="No certificate requests" />}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3">
              <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
                    {item.company_name}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    {[item.grn_no ? `GRN ${item.grn_no}` : null, formatShortDate(item.collection_date)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <StatusPill meta={CERT_REQUEST_STATUS[item.status]} />
              </View>
              <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-200 mt-2.5">{formatQty(item.total_weight_quantity, item.uom)}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          key="register"
          data={register.rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={register.isRefetching} onRefresh={register.refetch} tintColor="#10B981" />}
          onEndReached={register.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={register.isFetchingNextPage ? <ActivityIndicator color="#10B981" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon={<Ionicons name="ribbon-outline" size={40} color="#94A3B8" />} title="No issued certificates" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openPdf(item.id, item.certificate_number)}
              accessibilityRole="button"
              accessibilityLabel={`Open certificate ${item.certificate_number}`}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 flex-row items-center active:opacity-90"
              style={{ gap: 12 }}
            >
              <View className="w-11 h-11 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center">
                <Ionicons name="ribbon" size={22} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">{item.certificate_number}</Text>
                <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
                  {[item.request?.company_name, item.issued_date ? formatShortDate(item.issued_date) : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="document-text-outline" size={20} color="#94A3B8" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
