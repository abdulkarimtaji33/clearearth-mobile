import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { InspectionReport } from '@/api/types';

export function InspectionReportView({ report }: { report: InspectionReport }) {
  const inspectorName = report.inspector
    ? `${report.inspector.first_name} ${report.inspector.last_name}`
    : null;
  const approvedByName = report.approvedBy
    ? `${report.approvedBy.first_name} ${report.approvedBy.last_name}`
    : null;

  return (
    <Card className="bg-completed-bg dark:bg-completed-bgDark border-0">
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="checkmark-circle" size={18} color="#059669" />
        <Text className="text-completed font-bold text-base">Inspection report</Text>
      </View>

      <View className="gap-1.5">
        {report.inspection_datetime ? (
          <Text className="text-completed text-sm">Inspected {formatDateTime(report.inspection_datetime)}</Text>
        ) : null}
        {report.approximate_weight ? (
          <Text className="text-completed text-sm">
            Approx. weight: {report.approximate_weight} {report.weight_uom}
          </Text>
        ) : null}
        {report.cargo_type ? <Text className="text-completed text-sm">Cargo: {report.cargo_type}</Text> : null}
        {report.transportation_arrangement ? (
          <Text className="text-completed text-sm">Transport: {report.transportation_arrangement}</Text>
        ) : null}
        {report.approximate_value ? (
          <Text className="text-completed text-sm">Approx. value: {formatMoney(report.approximate_value)}</Text>
        ) : null}
        {inspectorName ? <Text className="text-completed text-sm">Inspector: {inspectorName}</Text> : null}
        {approvedByName ? <Text className="text-completed text-sm">Approved by: {approvedByName}</Text> : null}
      </View>

      {report.notes ? <Text className="text-completed text-sm mt-2">{report.notes}</Text> : null}
    </Card>
  );
}
