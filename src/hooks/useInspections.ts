import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptInspectionRequest,
  fetchInspectionRequest,
  fetchInspectionRequests,
  rejectInspectionRequest,
  saveInspectionReport,
  updateInspectionStatus,
  uploadInspectionImage,
} from '@/api/inspection.api';
import { queryKeys } from '@/api/queryClient';
import type { InspectionListParams, InspectionRequestStatus, SaveInspectionReportPayload } from '@/api/types';
import type { PickedPhoto } from '@/components/pickups/PhotoPicker';

export function useInspectionRequests(params: InspectionListParams) {
  return useQuery({
    queryKey: queryKeys.inspectionRequests(params),
    queryFn: () => fetchInspectionRequests(params),
  });
}

export function useInspectionRequest(id: number) {
  return useQuery({
    queryKey: queryKeys.inspectionRequest(id),
    queryFn: () => fetchInspectionRequest(id),
    enabled: Number.isFinite(id),
  });
}

function useInvalidateInspections(id: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inspectionRequest(id) });
    queryClient.invalidateQueries({ queryKey: ['inspectionRequests'] });
  };
}

export function useAcceptInspection(id: number) {
  const invalidate = useInvalidateInspections(id);
  return useMutation({
    mutationFn: () => acceptInspectionRequest(id),
    onSuccess: invalidate,
  });
}

export function useRejectInspection(id: number) {
  const invalidate = useInvalidateInspections(id);
  return useMutation({
    mutationFn: (reason: string) => rejectInspectionRequest(id, reason),
    onSuccess: invalidate,
  });
}

export function useUpdateInspectionStatus(id: number) {
  const invalidate = useInvalidateInspections(id);
  return useMutation({
    mutationFn: (status: InspectionRequestStatus) => updateInspectionStatus(id, status),
    onSuccess: invalidate,
  });
}

interface SubmitInspectionReportInput extends Omit<SaveInspectionReportPayload, 'images'> {
  photos: PickedPhoto[];
  /** Paths already on the report (editing an existing one). The backend upsert
   * replaces `images` wholesale rather than appending, so these must be
   * resent alongside any newly-uploaded paths or they'd be silently dropped. */
  existingImages?: string[];
}

/** Uploads any new photos sequentially (so a single progress number stays meaningful),
 * then upserts the report with the resulting image paths. */
export function useSaveInspectionReport(
  requestId: number,
  dealId: number,
  onUploadProgress?: (percent: number | null) => void
) {
  const invalidate = useInvalidateInspections(requestId);
  return useMutation({
    mutationFn: async (input: SubmitInspectionReportInput) => {
      const images: string[] = [...(input.existingImages ?? [])];
      for (let i = 0; i < input.photos.length; i++) {
        const photo = input.photos[i];
        const uploaded = await uploadInspectionImage(photo, (percent) => {
          const overall = Math.round(((i + percent / 100) / input.photos.length) * 100);
          onUploadProgress?.(overall);
        });
        images.push(uploaded.path);
      }
      onUploadProgress?.(null); // uploads done — switch the UI back to a generic "saving" state
      const { photos, existingImages, ...rest } = input;
      return saveInspectionReport(dealId, { ...rest, images });
    },
    onSuccess: invalidate,
  });
}
