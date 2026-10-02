import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useInspectionRequest } from '@/hooks/useInspections';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { InspectionRequestInfo } from '@/components/inspections/InspectionRequestInfo';
import { InspectionDealCard } from '@/components/inspections/InspectionDealCard';
import { InspectionImageGallery } from '@/components/inspections/InspectionImageGallery';
import { InspectionReportView } from '@/components/inspections/InspectionReportView';
import { InspectionResponseActions } from '@/components/inspections/InspectionResponseActions';
import { InspectionProgressAction, hasInspectionProgressAction } from '@/components/inspections/InspectionProgressAction';
import { INSPECTION_PRIORITY_CONFIG, INSPECTION_STATUS_STEPS } from '@/constants/statusConfig';
import { parseSupportingDocuments, formatRequestNumber } from '@/lib/inspectionHelpers';
import type { InspectionStackParamList } from '@/navigation/types';

const STEP_INDEX: Record<string, number> = {
  request_submitted: 0,
  team_assigned: 1,
  inspection_completed: 2,
  report_submitted: 3,
};

export function InspectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<InspectionStackParamList>>();
  const route = useRoute<RouteProp<InspectionStackParamList, 'InspectionDetail'>>();
  const { id } = route.params;

  const { data: request, isLoading, isError, refetch } = useInspectionRequest(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (isError || !request) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this request"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  const title = request.deal?.title || formatRequestNumber(request.id);
  const supportingDocuments = parseSupportingDocuments(request.supporting_documents);
  const report = request.deal?.inspectionReport;
  const canRespond = request.response_status === 'pending';

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View
        className="flex-row items-center px-5 pb-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          className="mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#334155" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">{formatRequestNumber(request.id)}</Text>
        </View>
        <Badge
          label={INSPECTION_PRIORITY_CONFIG[request.priority].label}
          tone={INSPECTION_PRIORITY_CONFIG[request.priority].tone}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card>
            <StatusStepper steps={INSPECTION_STATUS_STEPS} activeIndex={STEP_INDEX[request.status] ?? 0} />
          </Card>
        </Animated.View>

        {request.response_status === 'rejected' && request.rejection_reason ? (
          <Animated.View entering={FadeInDown.duration(300).delay(40)}>
            <Card className="bg-overdue-bg dark:bg-overdue-bgDark border-0">
              <Text className="text-overdue font-bold text-sm mb-1">Rejected</Text>
              <Text className="text-overdue text-sm">{request.rejection_reason}</Text>
            </Card>
          </Animated.View>
        ) : null}

        {canRespond ? (
          <Animated.View entering={FadeInDown.duration(300).delay(60)}>
            <InspectionResponseActions requestId={request.id} />
          </Animated.View>
        ) : hasInspectionProgressAction(request) ? (
          <Animated.View entering={FadeInDown.duration(300).delay(60)}>
            <InspectionProgressAction request={request} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <InspectionRequestInfo request={request} />
        </Animated.View>

        {request.deal ? (
          <Animated.View entering={FadeInDown.duration(300).delay(140)}>
            <InspectionDealCard request={request} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(300).delay(180)}>
          <InspectionImageGallery
            title="Supporting documents"
            icon="document-attach-outline"
            paths={supportingDocuments}
            emptyHint="No supporting documents were attached to this request."
          />
        </Animated.View>

        {report ? (
          <Animated.View entering={FadeInDown.duration(300).delay(220)}>
            <InspectionReportView report={report} />
          </Animated.View>
        ) : null}

        {report?.images?.length ? (
          <Animated.View entering={FadeInDown.duration(300).delay(240)}>
            <InspectionImageGallery title="Report photos" icon="camera-outline" paths={report.images} />
          </Animated.View>
        ) : null}

        {request.deal ? (
          <Animated.View entering={FadeInDown.duration(300).delay(260)}>
            <Button
              label={report ? 'Edit inspection report' : 'Submit inspection report'}
              size="lg"
              fullWidth
              icon={<Ionicons name={report ? 'create-outline' : 'clipboard-outline'} size={18} color="#fff" />}
              onPress={() => navigation.navigate('InspectionReport', { id: request.id, dealId: request.deal!.id })}
            />
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
