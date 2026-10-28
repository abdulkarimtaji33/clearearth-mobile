/**
 * Operations-role API types. Mirror clearearth-backend responses (verified against the
 * running API): work-orders, grn, quotations / purchase-orders, dashboard, notifications.
 */
import type { TaskStatus } from '@/api/types';

export type { TaskStatus };
export type WorkOrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';

export interface UserLite {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Assignee extends UserLite {
  role?: { id: number; name: string; display_name?: string } | null;
}

export interface WorkType {
  id: number;
  name: string;
  display_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface TaskFile {
  id: number;
  task_id: number;
  image_url: string;
  original_name: string | null;
}

export type ExpenseAccountsStatus = 'pending' | 'approved' | 'rejected';

export interface TaskExpense {
  id: number;
  description: string | null;
  amount: number | string;
  sort_order: number;
  evidence_path: string | null;
  evidence_file_name: string | null;
  accounts_status?: ExpenseAccountsStatus | null;
  rejection_reason?: string | null;
  ledgerExpense?: { id: number } | null;
}

export interface WorkOrderTask {
  id: number;
  work_order_id: number;
  type_of_work: string | null;
  work_type_id: number | null;
  expense: number | string | null;
  estimated_duration: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_to: number | null;
  status: TaskStatus;
  notes: string | null;
  sort_order: number;
  /** Filled in by the driver app when a pickup is marked collected. */
  pickup_quantity?: string | number | null;
  pickup_uom?: string | null;
  pickup_condition?: string | null;
  assignedUser?: UserLite | null;
  assignees?: UserLite[];
  files?: TaskFile[];
  workType?: { id: number; name: string } | null;
  expenses?: TaskExpense[];
  isOverdue?: boolean;
}

export interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  nextDue: string | null;
}

export interface WorkOrderDealLite {
  id: number;
  deal_number: string | null;
  title: string | null;
  status: string | null;
}

export interface WorkOrderListItem {
  id: number;
  title: string | null;
  notes: string | null;
  status: WorkOrderStatus;
  deal_id: number | null;
  quotation_id: number | null;
  purchase_order_id: number | null;
  created_at: string;
  deal?: WorkOrderDealLite | null;
  quotation?: { id: number; status: string } | null;
  sourcePurchaseOrder?: { id: number; status: string; document_type: string } | null;
  tasks?: WorkOrderTask[];
  createdByUser?: UserLite | null;
  taskSummary: TaskSummary;
}

export interface WorkOrderDealDetail extends WorkOrderDealLite {
  deal_type: string | null;
  description: string | null;
  notes: string | null;
  container_type: string | null;
  location_type: string | null;
  wds_required: boolean;
  certificate_required: boolean;
  required_certificate_types: string[] | null;
  inspection_required: boolean;
  custom_inspection: boolean;
  trakhees_inspection: boolean;
  dubai_municipality_inspection: boolean;
  pickup_location: string | null;
  pickup_contact_name: string | null;
  pickup_contact_number: string | null;
  company?: { id: number; company_name: string | null } | null;
  supplier?: { id: number; company_name: string | null } | null;
  contact?: { id: number; first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null;
}

export interface PurchaseBillLite {
  id: number;
  status: string;
  document_type: string;
  company?: { id: number; company_name: string | null } | null;
  supplier?: { id: number; company_name: string | null } | null;
}

export interface WorkOrderDetail extends Omit<WorkOrderListItem, 'deal'> {
  deal?: WorkOrderDealDetail | null;
  purchaseBills?: PurchaseBillLite[];
}

export interface WorkOrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: WorkOrderStatus;
  overdue?: boolean;
  unassigned?: boolean;
  assignedTo?: number;
  sort?: 'due';
}

/** Task payload for POST/PUT /work-orders (lossless: always carry `id` for existing tasks). */
export interface TaskInput {
  id?: number;
  workTypeId?: number | null;
  typeOfWork?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  estimatedDuration?: string | null;
  status?: TaskStatus;
  notes?: string | null;
  assigneeIds?: number[];
  expenses?: {
    description?: string | null;
    amount: number | string;
    evidencePath?: string | null;
    evidenceFileName?: string | null;
  }[];
}

export interface CreateWorkOrderPayload {
  quotationId?: number;
  purchaseOrderId?: number;
  title?: string;
  notes?: string;
  tasks: TaskInput[];
}

/* ---------------------------------- Orders ---------------------------------- */

export type PickupDateStatus = 'pending' | 'confirmed' | 'reschedule_requested';
export type OrderKind = 'service' | 'client_po' | 'vendor_po';

export interface OrderWorkOrderRef {
  id: number;
  title: string | null;
  status: WorkOrderStatus;
}

interface OrderBase {
  id: number;
  deal_id: number | null;
  status: string;
  approved_at: string | null;
  reference_number: number | null;
  requested_pickup_date: string | null;
  pickup_date_status: PickupDateStatus | null;
  confirmed_pickup_date: string | null;
  pickup_reschedule_note: string | null;
  deal?: { id: number; title: string | null; deal_number: string | null; items?: { id: number }[] } | null;
}

export interface ServiceOrder extends OrderBase {
  kind: 'service';
  quotation_date: string | null;
  remarks: string | null;
  workOrder?: OrderWorkOrderRef | null;
  preparedByUser?: UserLite | null;
}

export interface PoItem {
  id: number;
  quantity: string | number | null;
  unit_of_measure: string | null;
  item_description: string | null;
  productService?: { id: number; name: string } | null;
}

export interface PurchaseOrderRow extends OrderBase {
  kind: 'client_po' | 'vendor_po';
  po_date: string | null;
  document_type: string;
  company_id: number | null;
  supplier_id: number | null;
  company?: { id: number; company_name: string | null } | null;
  supplier?: { id: number; company_name: string | null } | null;
  items?: PoItem[];
  sourceWorkOrder?: OrderWorkOrderRef | null;
}

export type OrderRow = ServiceOrder | PurchaseOrderRow;

export interface DealItemLite {
  id: number;
  quantity: string | number | null;
  unit_of_measure: string | null;
  notes: string | null;
  productService?: { id: number; name: string; unit_of_measure?: string | null } | null;
}

export interface ServiceOrderDetail extends Omit<ServiceOrder, 'kind' | 'deal'> {
  deal?: {
    id: number;
    title: string | null;
    deal_number: string | null;
    pickup_location: string | null;
    pickup_contact_name: string | null;
    pickup_contact_number: string | null;
    items?: DealItemLite[];
  } | null;
}

export type OrderDetailData = (ServiceOrderDetail & { kind: 'service' }) | PurchaseOrderRow;

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  hasWorkOrder?: boolean;
}

/* ----------------------------------- GRN ------------------------------------ */

export type GrnStatus = 'new' | 'submitted' | 'approved';

export interface GrnImage {
  id: number;
  grn_item_id: number;
  image_url: string;
  original_name: string | null;
}

export interface GrnItem {
  id: number;
  grn_id: number;
  item_name: string;
  material_type_id: number | null;
  quantity: string | number;
  unit_of_measure: string | null;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  units: number | null;
  notes: string | null;
  materialType?: { id: number; value: string; display_name: string } | null;
  images?: GrnImage[];
}

export interface Grn {
  id: number;
  grn_number: string;
  work_order_id: number | null;
  deal_id: number | null;
  status: GrnStatus;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  workOrder?: { id: number; title: string | null; status: WorkOrderStatus } | null;
  deal?: {
    id: number;
    deal_number: string | null;
    title: string | null;
    company?: { id: number; company_name: string | null } | null;
    contact?: { id: number; first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null;
  } | null;
  createdByUser?: UserLite | null;
  approvedByUser?: UserLite | null;
  items?: GrnItem[];
}

export interface GrnItemInput {
  itemName: string;
  materialTypeId?: number | null;
  quantity: number | string;
  unitOfMeasure?: string | null;
  make?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  units?: number | string | null;
  notes?: string | null;
  /** Existing images carried over so a full item replace on PATCH doesn't drop them. */
  images?: { imageUrl: string; originalName?: string | null }[];
}

export interface InventoryItemRow extends GrnItem {
  grn?: {
    id: number;
    grn_number: string;
    status: GrnStatus;
    work_order_id: number | null;
    deal?: { id: number; deal_number: string | null; title: string | null; company?: { company_name: string | null } | null } | null;
  } | null;
}

export interface StockRow {
  id: number;
  materialTypeId: number;
  materialType: { id: number; displayName: string; value: string } | null;
  totalQuantity: number;
  unitOfMeasure: string | null;
  lastUpdated: string | null;
}

export interface MaterialTypeOption {
  id: number;
  value: string;
  display_name: string;
}

/* -------------------------------- Dashboard --------------------------------- */

export interface DashboardKpi {
  label: string;
  value: number;
  format: string;
  highlight?: boolean;
}

export interface DashboardOverdueTask {
  taskId: number;
  workOrderId: number;
  workOrderTitle: string;
  assignedTo: string;
  endDate: string | null;
  status: TaskStatus;
  typeOfWork: string | null;
}

export interface DashboardTodayWorkOrder {
  workOrderId: number;
  workOrderTitle: string;
  workOrderStatus: string | null;
  typeOfWork: string | null;
  assignedTo: string;
  startDate: string | null;
  endDate: string | null;
  status: TaskStatus | WorkOrderStatus;
}

export interface DashboardDriverActivity {
  taskId: number;
  workOrderTitle: string;
  driverName: string;
  status: TaskStatus;
  startDate: string | null;
}

export interface DashboardRecentOrder {
  id: number;
  dealId: number | null;
  dealTitle: string | null;
  companyName?: string | null;
  approvedAt: string | null;
  requestedPickupDate: string | null;
  workOrderId: number | null;
  workOrderStatus: string | null;
}

export interface PendingPickupConfirmation {
  entityType: 'quotation' | 'purchase_order';
  id: number;
  dealId: number | null;
  dealTitle: string | null;
  partyName: string | null;
  requestedPickupDate: string | null;
}

export interface DashboardUnassignedTask {
  taskId: number;
  workOrderId: number;
  workOrderTitle: string;
  typeOfWork: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TaskStatus;
}

export interface OperationsOverview {
  role: 'operations_manager';
  kpis: DashboardKpi[];
  counts: {
    ordersAwaitingWo: number;
    grnsNew: number;
    grnsSubmitted: number;
    overdueTasks: number;
    pendingPickupConfirmations: number;
  };
  pendingPickupConfirmations: PendingPickupConfirmation[];
  unassignedTasks: DashboardUnassignedTask[];
  overdueTasks: DashboardOverdueTask[];
  driverActivity: DashboardDriverActivity[];
  recentServiceOrders: DashboardRecentOrder[];
  recentPurchaseOrders: DashboardRecentOrder[];
  todayWorkOrders: DashboardTodayWorkOrder[];
}

/* ------------------------------ Notifications ------------------------------- */

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

/* --------------------------- Deals / Certs / Leave -------------------------- */

export interface DealListItem {
  id: number;
  deal_number: string | null;
  title: string | null;
  status: string | null;
  deal_type: string | null;
  deal_date: string | null;
  pickup_location: string | null;
  pickup_contact_name: string | null;
  pickup_contact_number: string | null;
  company?: { id: number; company_name: string | null } | null;
  supplier?: { id: number; company_name: string | null } | null;
  contact?: { id: number; first_name: string | null; last_name: string | null } | null;
  items?: DealItemLite[];
}

export interface DealDetail extends DealListItem {
  description: string | null;
  notes: string | null;
  container_type: string | null;
  location_type: string | null;
  wds_required: boolean;
  certificate_required: boolean;
  inspection_required: boolean;
  workOrders?: { id: number; title: string | null; status: WorkOrderStatus }[];
  contact?: { id: number; first_name: string | null; last_name: string | null; email?: string | null; phone?: string | null } | null;
  inspectionReport?: {
    inspection_datetime: string | null;
    approximate_weight: string | number | null;
    weight_uom: string | null;
    cargo_type: string | null;
    notes: string | null;
  } | null;
}

export type CertificateRequestStatus = 'pending_verification' | 'verified' | 'generated' | 'issued';

export interface CertificateRequestRow {
  id: number;
  company_name: string;
  collection_date: string;
  grn_no: string | null;
  total_weight_quantity: number | string;
  uom: string | null;
  status: CertificateRequestStatus;
  material_waste_details: string | null;
  created_at: string;
}

export interface CertificateRow {
  id: number;
  certificate_number: string;
  type: string | null;
  issued_date: string | null;
  request?: { id: number; company_name: string | null; grn_no: string | null } | null;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequestRow {
  id: number;
  status: LeaveStatus;
  start_date: string;
  end_date: string;
  days_count?: number | string | null;
  reason: string | null;
  employee?: { id: number; first_name: string; last_name: string; employee_code?: string | null } | null;
  leaveType?: { id: number; name: string } | null;
}
