import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui/StatusPill';
import { PICKUP_DATE_STATUS, WORK_ORDER_STATUS } from '@/constants/opsStatus';
import { orderNumber, orderParty, orderWorkOrder } from '@/lib/opsFormat';
import { formatShortDate } from '@/lib/format';
import type { OrderRow } from '@/api/ops/types';

interface OrderCardProps {
  order: OrderRow;
  onOpen: (order: OrderRow) => void;
  onCreateWorkOrder: (order: OrderRow) => void;
  onOpenWorkOrder: (workOrderId: number) => void;
}

export const OrderCard = React.memo(function OrderCard({ order, onOpen, onCreateWorkOrder, onOpenWorkOrder }: OrderCardProps) {
  const wo = orderWorkOrder(order);
  const party = orderParty(order);
  const pickup = order.pickup_date_status ? PICKUP_DATE_STATUS[order.pickup_date_status] : null;
  const pickupDate = order.confirmed_pickup_date ?? order.requested_pickup_date;
  const itemCount =
    order.kind === 'service' ? order.deal?.items?.length ?? 0 : (order.items ?? []).length;

  return (
    <Pressable
      onPress={() => onOpen(order)}
      accessibilityRole="button"
      accessibilityLabel={`${orderNumber(order)}, ${order.deal?.title ?? 'order'}`}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 active:opacity-90"
      style={{ shadowColor: '#0A1628', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
        <View className="flex-1">
          <Text className="text-xs font-bold text-primary-700 dark:text-primary-300 mb-0.5">{orderNumber(order)}</Text>
          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
            {order.deal?.title || `Deal #${order.deal_id ?? '-'}`}
          </Text>
          {party ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1" numberOfLines={1}>
              {party}
            </Text>
          ) : null}
        </View>
        {wo ? <StatusPill meta={WORK_ORDER_STATUS[wo.status]} /> : <StatusPill label="Needs work order" tone="upcoming" icon="hammer-outline" />}
      </View>

      <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 8 }}>
        {pickup ? <StatusPill meta={pickup} /> : <StatusPill label="No pickup date" tone="neutral" icon="calendar-outline" />}
        {pickupDate ? (
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{formatShortDate(pickupDate)}</Text>
        ) : null}
        {itemCount > 0 ? (
          <View className="flex-row items-center" style={{ gap: 3 }}>
            <Ionicons name="layers-outline" size={13} color="#94A3B8" />
            <Text className="text-xs text-neutral-500">
              {itemCount} item{itemCount > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => (wo ? onOpenWorkOrder(wo.id) : onCreateWorkOrder(order))}
        accessibilityRole="button"
        className={`mt-3.5 flex-row items-center justify-center py-3 rounded-xl ${
          wo ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-primary-600 active:bg-primary-700'
        }`}
        style={{ gap: 6 }}
      >
        <Ionicons name={wo ? 'open-outline' : 'hammer'} size={17} color={wo ? '#475569' : '#fff'} />
        <Text className={`text-sm font-bold ${wo ? 'text-neutral-700 dark:text-neutral-200' : 'text-white'}`}>
          {wo ? 'Open work order' : 'Create work order'}
        </Text>
      </Pressable>
    </Pressable>
  );
});
