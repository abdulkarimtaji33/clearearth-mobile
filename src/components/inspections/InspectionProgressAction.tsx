import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useUpdateInspectionStatus } from '@/hooks/useInspections';
import { useToast } from '@/components/ui/Toast';
import type { InspectionRequest, InspectionRequestStatus } from '@/api/types';

const NEXT_STEP: Partial<
  Record<InspectionRequestStatus, { status: InspectionRequestStatus; label: string; icon: keyof typeof Ionicons.glyphMap }>
> = {
  request_submitted: { status: 'team_assigned', label: 'Start inspection', icon: 'play-outline' },
  team_assigned: { status: 'inspection_completed', label: 'Mark inspection completed', icon: 'checkmark-done-outline' },
};

export function hasInspectionProgressAction(request: InspectionRequest): boolean {
  return !!NEXT_STEP[request.status] && request.response_status !== 'rejected';
}

/** Lets the inspector drive the pipeline forward (request_submitted → team_assigned
 * → inspection_completed) ahead of filing the report, which auto-advances to
 * report_submitted on its own. Mirrors the web stepper's click-to-advance. */
export function InspectionProgressAction({ request }: { request: InspectionRequest }) {
  const toast = useToast();
  const mutation = useUpdateInspectionStatus(request.id);
  const next = NEXT_STEP[request.status];
  if (!next) return null;

  async function handlePress() {
    try {
      await mutation.mutateAsync(next!.status);
      toast.show(next!.label, 'success');
    } catch {
      toast.show('Could not update status — please try again.', 'error');
    }
  }

  return (
    <Button
      label={next.label}
      variant="secondary"
      size="lg"
      fullWidth
      icon={<Ionicons name={next.icon} size={18} color="#059669" />}
      loading={mutation.isPending}
      onPress={handlePress}
    />
  );
}
