import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrderDetail, useConfirmPickup, useRequestReschedule } from '@/hooks/ops/useOrders';
import { useDeal } from '@/hooks/ops/useMore';
import { usePermission } from '@/hooks/usePermission';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoRow } from '@/components/ui/InfoRow';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { RescheduleSheet } from '@/components/ops/RescheduleSheet';
import { PICKUP_DATE_STATUS, WORK_ORDER_STATUS } from '@/constants/opsStatus';
import { orderPdfPath } from '@/api/ops/orders.api';
import { openApiPdf } from '@/lib/files';
import { callPhoneNumber, openPickupLocation } from '@/lib/linking';
import { formatFullDate } from '@/lib/format';
import { formatQty, orderNumber, orderParty, orderWorkOrder } from '@/lib/opsFormat';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { OrderRow } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

export function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { params } = useRoute<RouteProp<OpsStackParamList, 'OrderDetail'>>();
  const toast = useToast();
  const { can } = usePermission();

  const { data: order, isLoading, isError, refetch, isRefetching } = useOrderDetail(params.kind, params.id);
  const { data: deal } = useDeal(order?.deal_id);
  useRefreshOnFocus(refetch);
  const confirmPickup = useConfirmPickup();
  const requestReschedule = useRequestReschedule();
  const [rescheduling, setRescheduling] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const wo = order ? orderWorkOrder(order as OrderRow) : null;
  const party = order && order.kind !== 'service' ? orderParty(order as OrderRow) : null;
  const items =
    !order
      ? []
      : order.kind === 'service'
        ? (order.deal?.items ?? []).map((i) => ({ id: i.id, name: i.productService?.name ?? 'Item', qty: i.quantity, uom: i.unit_of_measure ?? i.productService?.unit_of_measure }))
        : (order.items ?? []).map((i) => ({ id: i.id, name: i.productService?.name ?? i.item_description ?? 'Item', qty: i.quantity, uom: i.unit_of_measure }));

  const pickup = order?.pickup_date_status ? PICKUP_DATE_STATUS[order.pickup_date_status] : null;
  const canAct = can('operations.update', 'operations.read');

  async function handleConfirm() {
    try {
      await confirmPickup.mutateAsync({ kind: params.kind, id: params.id });
      haptic.success();
      toast.show('Pickup date confirmed. Sales has been notified.', 'success');
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  async function handleReschedule(note: string) {
    try {
      await requestReschedule.mutateAsync({ kind: params.kind, id: params.id, note });
      haptic.success();
      toast.show('Reschedule request sent to sales', 'success');
      setRescheduling(false);
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
    }
  }

  async function handlePdf() {
    setPdfLoading(true);
    try {
      await openApiPdf(orderPdfPath(params.kind, params.id), `${orderNumber({ kind: params.kind, id: params.id, reference_number: order?.reference_number })}.pdf`);
    } catch (err) {
      toast.show(toUserMessage(err, 'Could not open the PDF.'), 'error');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader
        title={order ? orderNumber({ kind: params.kind, id: params.id, reference_number: order.reference_number }) : 'Order'}
        subtitle={order?.deal?.title ?? undefined}
        back
      />
      {isLoading ? (
        <View className="p-5" style={{ gap: 12 }}>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      ) : isError || !order ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this order"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 110 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          >
            <Card className="mb-5">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">Pickup date</Text>
                {pickup ? <StatusPill meta={pickup} /> : null}
              </View>
              {order.requested_pickup_date || order.confirmed_pickup_date ? (
                <>
                  <InfoRow icon="calendar-outline" label="Requested by sales" value={formatFullDate(order.requested_pickup_date)} />
                  <InfoRow icon="calendar-clear-outline" label="Confirmed" value={formatFullDate(order.confirmed_pickup_date)} />
                </>
              ) : (
                <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sales hasn't requested a pickup date yet.</Text>
              )}
              {order.pickup_reschedule_note ? (
                <View className="mt-2 p-3 rounded-xl bg-today-bg">
                  <Text className="text-xs text-today font-bold mb-0.5">Reschedule note</Text>
                  <Text className="text-sm text-neutral-800 leading-5">{order.pickup_reschedule_note}</Text>
                </View>
              ) : null}
              {canAct && order.requested_pickup_date && order.pickup_date_status !== 'reschedule_requested' ? (
                <View className="flex-row mt-4" style={{ gap: 10 }}>
                  {order.pickup_date_status !== 'confirmed' ? (
                    <View className="flex-1">
                      <Button label="Confirm date" loading={confirmPickup.isPending} onPress={handleConfirm} fullWidth />
                    </View>
                  ) : null}
                  <View className="flex-1">
                    <Button label="Ask for another" variant="secondary" onPress={() => setRescheduling(true)} fullWidth />
                  </View>
                </View>
              ) : null}
              {order.pickup_date_status === 'reschedule_requested' ? (
                <Text className="text-xs text-neutral-500 mt-3">Waiting for sales to submit a new date.</Text>
              ) : null}
            </Card>

            <Card className="mb-5">
              <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-1">Order</Text>
              <InfoRow icon="briefcase-outline" label="Deal" value={order.deal ? `${order.deal.title ?? ''} (${order.deal.deal_number ?? order.deal.id})` : null} />
              <InfoRow icon="business-outline" label={params.kind === 'vendor_po' ? 'Vendor' : 'Client'} value={party ?? deal?.company?.company_name ?? deal?.supplier?.company_name} />
              <InfoRow
                icon="location-outline"
                label="Pickup location"
                value={deal?.pickup_location}
                onPress={deal?.pickup_location ? () => openPickupLocation(deal.pickup_location!) : undefined}
                actionIcon="navigate-outline"
              />
              <InfoRow
                icon="call-outline"
                label={deal?.pickup_contact_name ? `Site contact · ${deal.pickup_contact_name}` : 'Site contact'}
                value={deal?.pickup_contact_number}
                onPress={deal?.pickup_contact_number ? () => callPhoneNumber(deal.pickup_contact_number!) : undefined}
                actionIcon="call-outline"
              />
            </Card>

            <SectionHeader title="Items" count={items.length} padded={false} />
            <Card className="mb-5" padded={false}>
              {items.length === 0 ? (
                <Text className="text-sm text-neutral-500 p-4">No line items.</Text>
              ) : (
                items.map((it, i) => (
                  <View
                    key={it.id}
                    className={`flex-row items-center justify-between px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`}
                    style={{ gap: 12 }}
                  >
                    <Text className="flex-1 text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">{it.name}</Text>
                    <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{formatQty(it.qty, it.uom)}</Text>
                  </View>
                ))
              )}
            </Card>

            <Button
              label="View order PDF"
              variant="secondary"
              loading={pdfLoading}
              icon={<Ionicons name="document-text-outline" size={19} color="#059669" />}
              onPress={handlePdf}
              fullWidth
            />
          </ScrollView>

          <View
            className="absolute left-0 right-0 bottom-0 px-5 pt-3 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-100 dark:border-neutral-800"
            style={{ paddingBottom: Math.max(insets.bottom, 14) }}
          >
            {wo ? (
              <View style={{ gap: 8 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-neutral-600 dark:text-neutral-300" numberOfLines={1}>
                    {wo.title ?? `Work order #${wo.id}`}
                  </Text>
                  <StatusPill meta={WORK_ORDER_STATUS[wo.status]} />
                </View>
                <Button label="Open work order" size="lg" fullWidth onPress={() => navigation.navigate('WorkOrderDetail', { id: wo.id })} />
              </View>
            ) : can('operations.create') ? (
              <Button
                label="Create work order"
                size="lg"
                fullWidth
                icon={<Ionicons name="hammer" size={19} color="#fff" />}
                onPress={() => navigation.navigate('CreateWorkOrder', { kind: params.kind, orderId: params.id })}
              />
            ) : null}
          </View>
        </>
      )}

      <RescheduleSheet
        visible={rescheduling}
        requestedDate={order?.requested_pickup_date}
        loading={requestReschedule.isPending}
        onClose={() => setRescheduling(false)}
        onSubmit={handleReschedule}
      />
    </View>
  );
}
