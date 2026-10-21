import { apiClient } from '@/api/client';
import type { ApiEnvelope, PaginatedEnvelope, UploadResponse } from '@/api/types';
import { buildFileForm, multipartConfig, type UploadFile } from '@/lib/upload';
import type {
  CreateWorkOrderPayload,
  TaskExpense,
  TaskFile,
  TaskInput,
  TaskStatus,
  UserLite,
  WorkOrderDetail,
  WorkOrderListItem,
  WorkOrderListParams,
  WorkOrderStatus,
} from './types';

export async function fetchWorkOrders(params: WorkOrderListParams): Promise<PaginatedEnvelope<WorkOrderListItem>> {
  const res = await apiClient.get<PaginatedEnvelope<WorkOrderListItem>>('/work-orders', {
    params: {
      ...params,
      overdue: params.overdue ? 'true' : undefined,
      unassigned: params.unassigned ? 'true' : undefined,
    },
  });
  return res.data;
}

export async function fetchWorkOrder(id: number): Promise<WorkOrderDetail> {
  const res = await apiClient.get<ApiEnvelope<WorkOrderDetail>>(`/work-orders/${id}`);
  return res.data.data;
}

export async function createWorkOrder(payload: CreateWorkOrderPayload): Promise<WorkOrderDetail> {
  const res = await apiClient.post<ApiEnvelope<WorkOrderDetail>>('/work-orders', payload);
  return res.data.data;
}

export interface UpdateWorkOrderPayload {
  title?: string;
  notes?: string | null;
  status?: WorkOrderStatus;
  tasks?: TaskInput[];
}

export async function updateWorkOrder(id: number, payload: UpdateWorkOrderPayload): Promise<WorkOrderDetail> {
  const res = await apiClient.put<ApiEnvelope<WorkOrderDetail>>(`/work-orders/${id}`, payload);
  return res.data.data;
}

export async function deleteWorkOrder(id: number): Promise<void> {
  await apiClient.delete(`/work-orders/${id}`);
}

export async function setTaskStatus(workOrderId: number, taskId: number, status: TaskStatus): Promise<void> {
  await apiClient.patch(`/work-orders/${workOrderId}/tasks/${taskId}/status`, { status });
}

export async function setTaskNotes(workOrderId: number, taskId: number, notes: string): Promise<void> {
  await apiClient.patch(`/work-orders/${workOrderId}/tasks/${taskId}/notes`, { notes });
}

export async function setTaskAssignees(
  workOrderId: number,
  taskId: number,
  assigneeIds: number[]
): Promise<{ assignees: UserLite[] }> {
  const res = await apiClient.patch<ApiEnvelope<{ assignees: UserLite[] }>>(
    `/work-orders/${workOrderId}/tasks/${taskId}/assign`,
    { assigneeIds }
  );
  return res.data.data;
}

export interface ExpenseInput {
  description?: string | null;
  amount: number | string;
  evidencePath?: string | null;
  evidenceFileName?: string | null;
}

export async function setTaskExpenses(
  workOrderId: number,
  taskId: number,
  expenses: ExpenseInput[]
): Promise<TaskExpense[]> {
  const res = await apiClient.patch<ApiEnvelope<TaskExpense[]>>(
    `/work-orders/${workOrderId}/tasks/${taskId}/expenses`,
    { expenses }
  );
  return res.data.data;
}

export async function uploadExpenseEvidence(file: UploadFile): Promise<UploadResponse> {
  const form = await buildFileForm('file', [file]);
  const res = await apiClient.post<ApiEnvelope<UploadResponse>>('/upload/expense-evidence', form, multipartConfig());
  return res.data.data;
}

export async function uploadTaskFiles(
  workOrderId: number,
  taskId: number,
  files: UploadFile[],
  onProgress?: (percent: number) => void
): Promise<TaskFile[]> {
  const form = await buildFileForm('files', files);
  const res = await apiClient.post<ApiEnvelope<TaskFile[]>>(
    `/work-orders/${workOrderId}/tasks/${taskId}/files`,
    form,
    multipartConfig(onProgress)
  );
  return res.data.data;
}

export async function deleteTaskFile(workOrderId: number, taskId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/work-orders/${workOrderId}/tasks/${taskId}/files/${fileId}`);
}

export async function linkTaskFileToCertificate(
  workOrderId: number,
  taskId: number,
  fileId: number,
  certificateRequestId: number
): Promise<void> {
  await apiClient.post(`/work-orders/${workOrderId}/tasks/${taskId}/files/${fileId}/link-certificate`, {
    certificateRequestId,
  });
}
