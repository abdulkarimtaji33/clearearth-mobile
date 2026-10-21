import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { WORK_ORDER_STATUS, TONE_HEX } from '@/constants/opsStatus';
import { dueInfo } from '@/lib/opsFormat';
import type { WorkOrderListItem, UserLite } from '@/api/ops/types';

interface WorkOrderCardProps {
  workOrder: WorkOrderListItem;
  onPress: (id: number) => void;
}

function uniqueAssignees(wo: WorkOrderListItem): UserLite[] {
  const seen = new Map<number, UserLite>();
  (wo.tasks ?? []).forEach((t) => {
    const list = t.assignees && t.assignees.length ? t.assignees : t.assignedUser ? [t.assignedUser] : [];
    list.forEach((u) => seen.set(u.id, u));
  });
  return [...seen.values()];
}

export const WorkOrderCard = React.memo(function WorkOrderCard({ workOrder: wo, onPress }: WorkOrderCardProps) {
  const s = wo.taskSummary;
  const closed = wo.status === 'completed' || wo.status === 'cancelled';
  const due = closed ? null : dueInfo(s.nextDue);
  const source = wo.quotation_id ? 'Service order' : wo.purchase_order_id ? 'Purchase order' : null;
  const progress = s.total ? s.completed / s.total : 0;
  const people = uniqueAssignees(wo);
  const unassigned = !closed && (wo.tasks ?? []).some((t) => t.status !== 'completed' && !t.assigned_to);

  return (
    <Pressable
      onPress={() => onPress(wo.id)}
      accessibilityRole="button"
      accessibilityLabel={`${wo.title ?? 'Work order'}, ${WORK_ORDER_STATUS[wo.status].label}, ${s.completed} of ${s.total} tasks done`}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 mb-3 active:opacity-90"
      style={{ shadowColor: '#0A1628', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
            {wo.title || `Work order #${wo.id}`}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1" numberOfLines={1}>
            {[wo.deal?.deal_number ? `Deal ${wo.deal.deal_number}` : null, source].filter(Boolean).join(' · ') || `WO-${wo.id}`}
          </Text>
        </View>
        <StatusPill meta={WORK_ORDER_STATUS[wo.status]} />
      </View>

      <View className="mt-3.5">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {s.completed} of {s.total} task{s.total === 1 ? '' : 's'} done
          </Text>
          {due ? (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={TONE_HEX[due.tone].fg} />
              <Text className="text-xs font-bold" style={{ color: TONE_HEX[due.tone].fg }}>
                {due.label}
              </Text>
            </View>
          ) : null}
        </View>
        <ProgressBar value={progress} color={wo.status === 'completed' ? '#059669' : '#10B981'} />
      </View>

      {people.length > 0 || unassigned || s.overdue > 0 ? (
        <View className="flex-row items-center justify-between mt-3.5">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AvatarStack people={people} size={26} max={4} />
            {unassigned ? <StatusPill label="Unassigned tasks" tone="upcoming" icon="person-add-outline" /> : null}
          </View>
          {s.overdue > 0 ? <StatusPill label={`${s.overdue} overdue`} tone="overdue" icon="alert-circle-outline" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
});
