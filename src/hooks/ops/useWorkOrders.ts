import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsKeys } from '@/api/ops/keys';
import * as api from '@/api/ops/workOrders.api';
import type {
  CreateWorkOrderPayload,
  TaskInput,
  TaskStatus,
  WorkOrderDetail,
  WorkOrderListParams,
  WorkOrderStatus,
} from '@/api/ops/types';
import { usePaginated } from './usePaginated';
import { appendTask, removeTask, replaceTask } from '@/lib/taskSerializer';
import type { UploadFile } from '@/lib/upload';

export function useWorkOrders(params: Omit<WorkOrderListParams, 'page'>) {
  return usePaginated(opsKeys.workOrderList(params), (page) =>
    api.fetchWorkOrders({ ...params, page, pageSize: 20 })
  );
}

export function useWorkOrder(id: number) {
  return useQuery({
    queryKey: opsKeys.workOrder(id),
    queryFn: () => api.fetchWorkOrder(id),
    enabled: Number.isFinite(id),
  });
}

/** Anything that changes a work order also changes lists, the dashboard and (on completion) GRNs. */
function useInvalidateWorkOrder(id?: number) {
  const qc = useQueryClient();
  return (opts: { grn?: boolean } = {}) => {
    if (id !== undefined) qc.invalidateQueries({ queryKey: opsKeys.workOrder(id) });
    qc.invalidateQueries({ queryKey: [...opsKeys.workOrders, 'list'] });
    qc.invalidateQueries({ queryKey: opsKeys.overview });
    if (opts.grn) {
      qc.invalidateQueries({ queryKey: opsKeys.grns });
      qc.invalidateQueries({ queryKey: opsKeys.orders });
    }
  };
}

/** Optimistic task-field patch on the cached detail, with rollback. */
function useOptimisticTaskPatch(workOrderId: number) {
  const qc = useQueryClient();
  return {
    apply: async (taskId: number, patch: Record<string, unknown>) => {
      await qc.cancelQueries({ queryKey: opsKeys.workOrder(workOrderId) });
      const prev = qc.getQueryData<WorkOrderDetail>(opsKeys.workOrder(workOrderId));
      if (prev) {
        qc.setQueryData<WorkOrderDetail>(opsKeys.workOrder(workOrderId), {
          ...prev,
          tasks: (prev.tasks ?? []).map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        });
      }
      return { prev };
    },
    rollback: (prev?: WorkOrderDetail) => {
      if (prev) qc.setQueryData(opsKeys.workOrder(workOrderId), prev);
    },
  };
}

export function useSetTaskStatus(workOrderId: number) {
  const optimistic = useOptimisticTaskPatch(workOrderId);
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      api.setTaskStatus(workOrderId, taskId, status),
    onMutate: ({ taskId, status }) => optimistic.apply(taskId, { status }),
    onError: (_e, _v, ctx) => optimistic.rollback(ctx?.prev),
    onSettled: () => invalidate(),
  });
}

export function useSetTaskNotes(workOrderId: number) {
  const optimistic = useOptimisticTaskPatch(workOrderId);
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, notes }: { taskId: number; notes: string }) =>
      api.setTaskNotes(workOrderId, taskId, notes),
    onMutate: ({ taskId, notes }) => optimistic.apply(taskId, { notes }),
    onError: (_e, _v, ctx) => optimistic.rollback(ctx?.prev),
    onSettled: () => invalidate(),
  });
}

export function useSetTaskAssignees(workOrderId: number) {
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, assigneeIds }: { taskId: number; assigneeIds: number[] }) =>
      api.setTaskAssignees(workOrderId, taskId, assigneeIds),
    onSettled: () => invalidate(),
  });
}

/** Assign from places that don't have the detail cached (dashboard cards). */
export function useAssignTaskById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workOrderId, taskId, assigneeIds }: { workOrderId: number; taskId: number; assigneeIds: number[] }) =>
      api.setTaskAssignees(workOrderId, taskId, assigneeIds),
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: opsKeys.workOrder(v.workOrderId) });
      qc.invalidateQueries({ queryKey: [...opsKeys.workOrders, 'list'] });
      qc.invalidateQueries({ queryKey: opsKeys.overview });
    },
  });
}

export function useSetTaskExpenses(workOrderId: number) {
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, expenses }: { taskId: number; expenses: api.ExpenseInput[] }) =>
      api.setTaskExpenses(workOrderId, taskId, expenses),
    onSettled: () => invalidate(),
  });
}

export function useUploadTaskFiles(workOrderId: number) {
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, files, onProgress }: { taskId: number; files: UploadFile[]; onProgress?: (p: number) => void }) =>
      api.uploadTaskFiles(workOrderId, taskId, files, onProgress),
    onSettled: () => invalidate(),
  });
}

export function useDeleteTaskFile(workOrderId: number) {
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: ({ taskId, fileId }: { taskId: number; fileId: number }) =>
      api.deleteTaskFile(workOrderId, taskId, fileId),
    onSettled: () => invalidate(),
  });
}

export function useUpdateWorkOrder(workOrderId: number) {
  const invalidate = useInvalidateWorkOrder(workOrderId);
  return useMutation({
    mutationFn: (payload: api.UpdateWorkOrderPayload) => api.updateWorkOrder(workOrderId, payload),
    onSettled: (_d, _e, v) => invalidate({ grn: v.status === 'completed' }),
  });
}

export function useSetWorkOrderStatus(workOrderId: number) {
  const update = useUpdateWorkOrder(workOrderId);
  return {
    ...update,
    mutateStatus: (status: WorkOrderStatus) => update.mutateAsync({ status }),
  };
}

/** Task add/edit/remove: rebuilds the full task list losslessly from the cached detail. */
export function useEditTasks(workOrderId: number, tasks: WorkOrderDetail['tasks']) {
  const update = useUpdateWorkOrder(workOrderId);
  const list = tasks ?? [];
  return {
    isPending: update.isPending,
    addTask: (input: TaskInput) => update.mutateAsync({ tasks: appendTask(list, input) }),
    editTask: (taskId: number, patch: Partial<TaskInput>) =>
      update.mutateAsync({ tasks: replaceTask(list, taskId, patch) }),
    deleteTask: (taskId: number) => update.mutateAsync({ tasks: removeTask(list, taskId) }),
  };
}

export function useCreateWorkOrder() {
  const invalidate = useInvalidateWorkOrder();
  return useMutation({
    mutationFn: (payload: CreateWorkOrderPayload) => api.createWorkOrder(payload),
    onSettled: () => invalidate({ grn: true }),
  });
}

export function useDeleteWorkOrder() {
  const invalidate = useInvalidateWorkOrder();
  return useMutation({
    mutationFn: (id: number) => api.deleteWorkOrder(id),
    onSettled: () => invalidate({ grn: true }),
  });
}
