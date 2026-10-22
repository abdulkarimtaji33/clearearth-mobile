import React, { useState } from 'react';
import { RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeal, useUpdateCollectionDetails } from '@/hooks/ops/useMore';
import { createLocationShareToken } from '@/api/ops/more.api';
import { usePermission } from '@/hooks/usePermission';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { InfoRow } from '@/components/ui/InfoRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { WORK_ORDER_STATUS } from '@/constants/opsStatus';
import { callPhoneNumber, openPickupLocation } from '@/lib/linking';
import { formatDateTime } from '@/lib/format';
import { formatQty, fullName } from '@/lib/opsFormat';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { OpsStackParamList } from '@/navigation/types';

export function DealDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { params } = useRoute<RouteProp<OpsStackParamList, 'DealDetail'>>();
  const toast = useToast();
  const { can } = usePermission();
  const { data: deal, isLoading, isError, refetch, isRefetching } = useDeal(params.id);
  const save = useUpdateCollectionDetails(params.id);

  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [sharing, setSharing] = useState(false);

  const canEdit = can('operations.update', 'deals.update');

  function openEditor() {
    setLocation(deal?.pickup_location ?? '');
    setContactName(deal?.pickup_contact_name ?? '');
    setContactNumber(deal?.pickup_contact_number ?? '');
    setEditing(true);
  }

  async function handleSave() {
    try {
      await save.mutateAsync({
        pickupLocation: location.trim() || null,
        pickupContactName: contactName.trim() || null,
        pickupContactNumber: contactNumber.trim() || null,
      });
      haptic.success();
      toast.show('Collection details saved', 'success');
      setEditing(false);
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  async function handleShareLink() {
    setSharing(true);
    try {
      const { shareUrl } = await createLocationShareToken(params.id);
      await Share.share({
        message: `Please share the exact pickup location for ${deal?.title ?? 'your collection'} using this link (valid for 7 days): ${shareUrl}`,
      });
    } catch (err) {
      toast.show(toUserMessage(err, 'Could not create the link.'), 'error');
    } finally {
      setSharing(false);
    }
  }

  const requirements = deal
    ? ([deal.wds_required && 'Waste data sheet', deal.certificate_required && 'Certificate', deal.inspection_required && 'Inspection'].filter(Boolean) as string[])
    : [];

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title={deal ? `Deal ${deal.deal_number ?? deal.id}` : 'Deal'} subtitle={deal?.title ?? undefined} back />
      {isLoading ? (
        <View className="p-5" style={{ gap: 12 }}>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </View>
      ) : isError || !deal ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this deal"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
        >
          <Card className="mb-5">
            {deal.status ? <StatusPill label={deal.status.replace(/_/g, ' ')} tone="upcoming" size="md" /> : null}
            <InfoRow icon="business-outline" label="Client" value={deal.company?.company_name ?? deal.supplier?.company_name} />
            <InfoRow
              icon="person-outline"
              label="Contact"
              value={deal.contact ? `${fullName(deal.contact)}${deal.contact.phone ? ` · ${deal.contact.phone}` : ''}` : null}
              onPress={deal.contact?.phone ? () => callPhoneNumber(deal.contact!.phone!) : undefined}
              actionIcon="call-outline"
            />
            <InfoRow icon="cube-outline" label="Container / location type" value={[deal.container_type, deal.location_type].filter(Boolean).join(' · ') || null} />
            {requirements.length > 0 ? (
              <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
                {requirements.map((r) => (
                  <StatusPill key={r} label={r} tone="upcoming" icon="shield-checkmark-outline" />
                ))}
              </View>
            ) : null}
            {deal.description || deal.notes ? (
              <View className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <Text className="text-sm text-neutral-800 dark:text-neutral-100 leading-5">{[deal.description, deal.notes].filter(Boolean).join('\n\n')}</Text>
              </View>
            ) : null}
          </Card>

          <Card className="mb-5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">Collection details</Text>
              {canEdit ? (
                <Button label="Edit" variant="ghost" onPress={openEditor} />
              ) : null}
            </View>
            <InfoRow
              icon="location-outline"
              label="Pickup location"
              value={deal.pickup_location ?? 'Not provided yet'}
              onPress={deal.pickup_location ? () => openPickupLocation(deal.pickup_location!) : undefined}
              actionIcon="navigate-outline"
            />
            <InfoRow icon="person-outline" label="Site contact" value={deal.pickup_contact_name} />
            <InfoRow
              icon="call-outline"
              label="Site phone"
              value={deal.pickup_contact_number}
              onPress={deal.pickup_contact_number ? () => callPhoneNumber(deal.pickup_contact_number!) : undefined}
              actionIcon="call-outline"
            />
            {canEdit ? (
              <View className="mt-3">
                <Button
                  label="Ask client to share location"
                  variant="secondary"
                  loading={sharing}
                  icon={<Ionicons name="share-social-outline" size={19} color="#059669" />}
                  onPress={handleShareLink}
                  fullWidth
                />
              </View>
            ) : null}
          </Card>

          {deal.inspectionReport ? (
            <Card className="mb-5">
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-1">Inspection report</Text>
              <InfoRow icon="calendar-outline" label="Inspected" value={formatDateTime(deal.inspectionReport.inspection_datetime)} />
              <InfoRow icon="scale-outline" label="Approx. weight" value={deal.inspectionReport.approximate_weight ? formatQty(deal.inspectionReport.approximate_weight, deal.inspectionReport.weight_uom) : null} />
              <InfoRow icon="cube-outline" label="Cargo" value={deal.inspectionReport.cargo_type} />
              <InfoRow icon="chatbox-outline" label="Notes" value={deal.inspectionReport.notes} />
            </Card>
          ) : null}

          <SectionHeader title="Items" count={deal.items?.length ?? 0} padded={false} />
          <Card className="mb-5" padded={false}>
            {(deal.items ?? []).length === 0 ? (
              <Text className="text-sm text-neutral-500 p-4">No line items.</Text>
            ) : (
              (deal.items ?? []).map((it, i) => (
                <View key={it.id} className={`flex-row items-center justify-between px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`} style={{ gap: 12 }}>
                  <Text className="flex-1 text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">{it.productService?.name ?? 'Item'}</Text>
                  <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{formatQty(it.quantity, it.unit_of_measure)}</Text>
                </View>
              ))
            )}
          </Card>

          {(deal.workOrders ?? []).length > 0 ? (
            <>
              <SectionHeader title="Work orders" count={deal.workOrders!.length} padded={false} />
              {deal.workOrders!.map((w) => (
                <Card key={w.id} className="mb-2.5">
                  <InfoRow icon="construct-outline" label={WORK_ORDER_STATUS[w.status]?.label ?? w.status} value={w.title ?? `Work order #${w.id}`} onPress={() => navigation.navigate('WorkOrderDetail', { id: w.id })} />
                </Card>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}

      <BottomSheet
        visible={editing}
        onClose={() => setEditing(false)}
        title="Collection details"
        footer={<Button label="Save" loading={save.isPending} onPress={handleSave} fullWidth size="lg" />}
      >
        <View style={{ gap: 14 }}>
          <Input label="Pickup location" value={location} onChangeText={setLocation} placeholder="Address or map link" multiline numberOfLines={3} textAlignVertical="top" className="min-h-[72px]" />
          <Input label="Site contact name" value={contactName} onChangeText={setContactName} />
          <Input label="Site contact phone" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" placeholder="+971..." />
        </View>
      </BottomSheet>
    </View>
  );
}
