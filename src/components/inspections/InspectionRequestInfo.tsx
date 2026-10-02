import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatShortDate } from '@/lib/format';
import { parseSafetyTools } from '@/lib/inspectionHelpers';
import type { InspectionRequest } from '@/api/types';

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-2.5 py-2">
      <Ionicons name={icon} size={16} color="#64748B" style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">{label}</Text>
        <Text className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

export function InspectionRequestInfo({ request }: { request: InspectionRequest }) {
  const safetyTools = parseSafetyTools(request.safety_tools);
  const preferredDate = formatShortDate(request.preferred_inspection_date);

  return (
    <Card>
      <View className="flex-row items-center gap-1.5 mb-1">
        <Ionicons name="clipboard-outline" size={17} color="#0F172A" />
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">Request details</Text>
      </View>

      <View className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {request.materialType?.display_name ? (
          <Row icon="cube-outline" label="Material" value={request.materialType.display_name} />
        ) : null}
        {request.service_type ? (
          <Row icon="construct-outline" label="Service type" value={request.service_type} />
        ) : null}
        {request.quantity ? (
          <Row
            icon="scale-outline"
            label="Quantity"
            value={`${request.quantity} ${request.quantity_uom ?? ''}`.trim()}
          />
        ) : null}
        {preferredDate ? <Row icon="calendar-outline" label="Preferred inspection date" value={preferredDate} /> : null}
        {request.location ? <Row icon="location-outline" label="Location" value={request.location} /> : null}
        {request.location_type ? <Row icon="navigate-outline" label="Location type" value={request.location_type} /> : null}
      </View>

      {request.gate_pass_requirement || safetyTools.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {request.gate_pass_requirement ? <Badge label="Gate pass required" tone="today" /> : null}
          {safetyTools.map((tool) => (
            <Badge key={tool} label={tool} tone="neutral" />
          ))}
        </View>
      ) : null}

      {request.notes ? (
        <View className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Text className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Notes</Text>
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">{request.notes}</Text>
        </View>
      ) : null}
    </Card>
  );
}
