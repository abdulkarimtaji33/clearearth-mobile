/** Query-key factory for the Operations experience. Keep every ops query under the `ops` root. */
export const opsKeys = {
  all: ['ops'] as const,
  overview: ['ops', 'overview'] as const,
  notifications: ['ops', 'notifications'] as const,
  assignees: ['ops', 'assignees'] as const,
  workTypes: ['ops', 'workTypes'] as const,
  materialTypes: ['ops', 'materialTypes'] as const,

  workOrders: ['ops', 'workOrders'] as const,
  workOrderList: (params: object) => ['ops', 'workOrders', 'list', params] as const,
  workOrder: (id: number) => ['ops', 'workOrders', 'detail', id] as const,

  orders: ['ops', 'orders'] as const,
  orderList: (kind: string, params: object) => ['ops', 'orders', 'list', kind, params] as const,
  order: (kind: string, id: number) => ['ops', 'orders', 'detail', kind, id] as const,

  grns: ['ops', 'grns'] as const,
  grnList: (params: object) => ['ops', 'grns', 'list', params] as const,
  grn: (id: number) => ['ops', 'grns', 'detail', id] as const,
  stock: ['ops', 'stock'] as const,
  inventoryList: (params: object) => ['ops', 'inventory', 'list', params] as const,

  deals: ['ops', 'deals'] as const,
  dealList: (params: object) => ['ops', 'deals', 'list', params] as const,
  deal: (id: number) => ['ops', 'deals', 'detail', id] as const,

  certificates: ['ops', 'certificates'] as const,
  leave: ['ops', 'leave'] as const,
};
