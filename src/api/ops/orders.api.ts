import { apiClient } from '@/api/client';
import type { ApiEnvelope, PaginatedEnvelope } from '@/api/types';
import type {
  OrderDetailData,
  OrderKind,
  OrderListParams,
  OrderRow,
  PurchaseOrderRow,
  ServiceOrder,
  ServiceOrderDetail,
} from './types';

const hasWo = (v?: boolean) => (v === undefined ? undefined : v ? 'true' : 'false');

export async function fetchOrders(
  kind: OrderKind,
  params: OrderListParams
): Promise<PaginatedEnvelope<OrderRow>> {
  const common = {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search || undefined,
    status: 'approved',
    hasWorkOrder: hasWo(params.hasWorkOrder),
  };

  if (kind === 'service') {
    const res = await apiClient.get<PaginatedEnvelope<Omit<ServiceOrder, 'kind'>>>('/quotations', { params: common });
    return { ...res.data, data: res.data.data.map((q) => ({ ...q, kind: 'service' as const })) };
  }

  const res = await apiClient.get<PaginatedEnvelope<Omit<PurchaseOrderRow, 'kind'>>>('/purchase-orders', {
    params: { ...common, side: kind === 'client_po' ? 'client' : 'supplier' },
  });
  // Purchase bills share the table; only real purchase orders can become work orders.
  const rows = res.data.data
    .filter((p) => p.document_type !== 'bill')
    .map((p) => ({ ...p, kind }) as PurchaseOrderRow);
  return { ...res.data, data: rows };
}

export async function fetchServiceOrder(id: number): Promise<OrderDetailData> {
  const res = await apiClient.get<ApiEnvelope<ServiceOrderDetail>>(`/quotations/${id}`);
  return { ...res.data.data, kind: 'service' };
}

export async function fetchPurchaseOrder(id: number): Promise<OrderDetailData> {
  const res = await apiClient.get<ApiEnvelope<Omit<PurchaseOrderRow, 'kind'>>>(`/purchase-orders/${id}`);
  const row = res.data.data;
  return { ...row, kind: row.supplier_id && !row.company_id ? 'vendor_po' : 'client_po' } as PurchaseOrderRow;
}

const base = (kind: OrderKind) => (kind === 'service' ? '/quotations' : '/purchase-orders');

export async function confirmPickupDate(kind: OrderKind, id: number): Promise<void> {
  await apiClient.post(`${base(kind)}/${id}/confirm-pickup-date`);
}

export async function requestPickupReschedule(kind: OrderKind, id: number, note?: string): Promise<void> {
  await apiClient.post(`${base(kind)}/${id}/request-pickup-reschedule`, { note: note || undefined });
}

export function orderPdfPath(kind: OrderKind, id: number): string {
  return kind === 'service' ? `/quotations/${id}/pdf?documentType=order` : `/purchase-orders/${id}/pdf`;
}
