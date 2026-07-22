import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { usePickupDetail } from '@/hooks/usePickups';
import { useStartPickup } from '@/hooks/useStartPickup';
import { useCompletePickup } from '@/hooks/useCompletePickup';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssignmentCard } from '@/components/pickups/AssignmentCard';
import { MaterialDetailsCard } from '@/components/pickups/MaterialDetailsCard';
import { LocationCard } from '@/components/pickups/LocationCard';
import { CompletePickupForm } from '@/components/pickups/CompletePickupForm';
import { PhotoGallery } from '@/components/pickups/PhotoGallery';
import { PRIORITY_CONFIG } from '@/constants/statusConfig';
import type { AppStackParamList } from '@/navigation/types';

const STEPS = [
  { key: 'not_started', label: 'Start' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Picked Up' },
];

const STEP_INDEX: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2 };

export function PickupDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PickupDetail'>>();
  const { taskId } = route.params;
  const toast = useToast();

  const { data: pickup, isLoading, isError, refetch } = usePickupDetail(taskId);
  const startMutation = useStartPickup(taskId);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const completeMutation = useCompletePickup(taskId, setUploadProgress);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (isError || !pickup) {
    return (
      <View className="flex-1 bg-neutral-50 dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this pickup"
          description="Check your connection and try again."
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  const isCompleted = pickup.taskStatus === 'completed';
  const isNotStarted = pickup.taskStatus === 'not_started';

  async function handleStart() {
    try {
      await startMutation.mutateAsync();
      toast.show('Pickup started', 'success');
    } catch {
      toast.show('Could not start pickup — please try again.', 'error');
    }
  }

  async function handleComplete(payload: Parameters<typeof completeMutation.mutateAsync>[0]) {
    try {
      await completeMutation.mutateAsync(payload);
      toast.show('Pickup confirmed', 'success');
    } catch {
      toast.show('Could not confirm pickup — please try again.', 'error');
    } finally {
      setUploadProgress(null);
    }
  }

  const title = pickup.deal?.title || pickup.workOrderTitle || `Work Order #${pickup.workOrderId}`;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View
        className="flex-row items-center px-5 pb-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} className="mr-3">
          <Ionicons name="chevron-back" size={26} color="#334155" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">{pickup.typeOfWork ?? 'Pickup'}</Text>
        </View>
        <Badge label={PRIORITY_CONFIG[pickup.priority].label} tone={pickup.priority} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card>
            <StatusStepper steps={STEPS} activeIndex={STEP_INDEX[pickup.taskStatus] ?? 0} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <AssignmentCard pickup={pickup} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <MaterialDetailsCard material={pickup.material} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(120)}>
          <PhotoGallery
            title="Inspection Photos"
            icon="search-outline"
            files={pickup.inspectionPhotos}
            emptyHint="No inspection photos were attached to this deal."
          />
        </Animated.View>

        {pickup.deal ? (
          <Animated.View entering={FadeInDown.duration(300).delay(140)}>
            <LocationCard deal={pickup.deal} />
          </Animated.View>
        ) : null}

        {isNotStarted ? (
          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <Button
              label="Start Pickup"
              size="lg"
              fullWidth
              loading={startMutation.isPending}
              onPress={handleStart}
            />
          </Animated.View>
        ) : null}

        {!isNotStarted && !isCompleted ? (
          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <CompletePickupForm
              initialQuantity={pickup.pickupQuantity}
              initialUom={pickup.pickupUom ?? pickup.uom}
              initialCondition={pickup.pickupCondition}
              initialRemarks={pickup.notes}
              submitting={completeMutation.isPending}
              uploadProgress={uploadProgress}
              onSubmit={handleComplete}
            />
          </Animated.View>
        ) : null}

        {isCompleted ? (
          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <Card className="bg-completed-bg dark:bg-completed-bgDark border-0">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text className="text-completed font-bold text-base">Pickup confirmed</Text>
              </View>
              <Text className="text-completed text-sm">
                {pickup.pickupQuantity ? `${pickup.pickupQuantity} ${pickup.pickupUom ?? ''} collected` : 'Collected'}
                {pickup.pickupCondition ? ` · Condition: ${pickup.pickupCondition}` : ''}
              </Text>
              {pickup.notes ? <Text className="text-completed text-sm mt-2">{pickup.notes}</Text> : null}
            </Card>
          </Animated.View>
        ) : null}

        {pickup.files.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(300).delay(220)}>
            <PhotoGallery title="Pickup Photos" icon="camera-outline" files={pickup.files} />
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
