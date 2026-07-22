import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PickupDetail } from '@/api/types';
import { formatFullDate } from '@/lib/format';

interface AssignmentCardProps {
  pickup: PickupDetail;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex-1 text-right ml-4">
        {value}
      </Text>
    </View>
  );
}

export function AssignmentCard({ pickup }: AssignmentCardProps) {
  const company = pickup.deal?.company;
  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="clipboard-outline" size={17} color="#0F172A" />
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">Assignment</Text>
        </View>
        <Badge label={pickup.workOrderStatus ?? '—'} />
      </View>
      <Row label="Work order" value={`#${pickup.workOrderId}`} />
      {pickup.deal?.deal_number ? <Row label="Deal" value={`#${pickup.deal.deal_number}`} /> : null}
      {company?.name ? <Row label="Company" value={company.name} /> : null}
      {company?.address || company?.city ? (
        <Row label="Address" value={[company?.address, company?.city].filter(Boolean).join(', ')} />
      ) : null}
      {pickup.startDate ? <Row label="Assigned on" value={formatFullDate(pickup.startDate) ?? ''} /> : null}
    </Card>
  );
}
