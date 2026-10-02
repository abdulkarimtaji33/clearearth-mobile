/**
 * Types mirroring the ClearEarth backend API contract exactly.
 * Source of truth: clearearth-backend src/controllers/driver.controller.js,
 * src/services/driver.service.js, src/controllers/auth.controller.js.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
}

export interface AuthTenant {
  id: number;
  name: string;
  companyName: string;
}

export interface LoginResponse {
  user: AuthUser;
  tenant: AuthTenant;
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserResponse extends AuthUser {
  tenant?: AuthTenant;
}

export type PickupPriority = 'overdue' | 'today' | 'upcoming' | 'completed';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface PickupDeal {
  id: number;
  deal_number: string | null;
  title: string | null;
  pickup_location: string | null;
  pickup_contact_name: string | null;
  pickup_contact_number: string | null;
}

export interface PickupDealWithCompany extends PickupDeal {
  company: {
    id: number;
    name: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  } | null;
}

export interface PickupListItem {
  taskId: number;
  workOrderId: number;
  workOrderTitle: string | null;
  workOrderStatus: string | null;
  taskStatus: TaskStatus;
  typeOfWork: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  deal: PickupDeal | null;
  priority: PickupPriority;
  daysOverdue: number;
}

export interface PickupTaskFile {
  id: number;
  imageUrl: string;
  originalName: string | null;
}

export interface PickupMaterial {
  materialType: string | null;
  materialTypeId: number | null;
  quantity: number | string | null;
  unit: string | null;
  specification: string | null;
}

export interface PickupDetail extends Omit<PickupListItem, 'deal'> {
  uom: string | null;
  pickupUom: string | null;
  pickupQuantity: string | null;
  pickupCondition: string | null;
  assignedUser: { id: number; name: string } | null;
  files: PickupTaskFile[];
  deal: PickupDealWithCompany | null;
  material: PickupMaterial | null;
  inspectionPhotos: PickupTaskFile[];
}

export interface StartPickupResponse {
  taskId: number;
  status: 'in_progress';
}

export interface CompletePickupResponse {
  taskId: number;
  status: 'completed';
}

export interface CompletePickupPayload {
  quantity?: string;
  uom?: string;
  condition?: string;
  remarks?: string;
  photos?: { uri: string; name: string; type: string }[];
}

export interface DropdownOption {
  id: number;
  value: string;
  display_name: string;
  display_order?: number;
}

/**
 * Inspection role types — mirror clearearth-backend
 * src/models/DealInspectionRequest.js, DealInspectionReport.js,
 * src/controllers/inspectionRequest.controller.js, src/services/deal.service.js.
 */
export type InspectionRequestStatus =
  | 'request_submitted'
  | 'team_assigned'
  | 'inspection_completed'
  | 'report_submitted';
export type InspectionPriority = 'critical' | 'high' | 'medium' | 'low';
export type InspectionResponseStatus = 'pending' | 'accepted' | 'rejected';

export interface InspectionDealSummary {
  id: number;
  title: string | null;
  deal_number: string | null;
  deal_date: string | null;
  status: string | null;
  total: number | string | null;
  currency: string | null;
  inspection_required: boolean;
  deal_type: string | null;
  notes?: string | null;
  company?: { id: number; company_name: string | null } | null;
  supplier?: { id: number; company_name?: string | null; name?: string | null } | null;
  contact?: {
    first_name: string | null;
    last_name: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    designation?: string | null;
  } | null;
  items?: { productService?: { name?: string | null } | null }[];
}

export interface InspectionReport {
  deal_id: number;
  inspection_datetime: string | null;
  approximate_weight: number | string | null;
  weight_uom: string | null;
  cargo_type: string | null;
  transportation_arrangement: string | null;
  approximate_value: number | string | null;
  images: string[];
  inspector_id: number | null;
  approved_by_id: number | null;
  notes: string | null;
  inspector?: { id: number; first_name: string; last_name: string } | null;
  approvedBy?: { id: number; first_name: string; last_name: string } | null;
}

export interface InspectionRequest {
  id: number;
  deal_id: number;
  material_type_id: number | null;
  location: string | null;
  location_type: string | null;
  gate_pass_requirement: boolean;
  service_type: string | null;
  quantity: number | string | null;
  quantity_uom: string | null;
  lumpsum_price: number | string | null;
  safety_tools_required: boolean;
  safety_tools: string | null;
  supporting_documents: string[] | string | null;
  notes: string | null;
  preferred_inspection_date: string | null;
  status: InspectionRequestStatus;
  priority: InspectionPriority;
  response_status: InspectionResponseStatus;
  rejection_reason: string | null;
  deal: (InspectionDealSummary & { inspectionReport?: InspectionReport | null }) | null;
  materialType: { id: number; value: string; display_name: string } | null;
  requestedByUser?: { id: number; first_name: string; last_name: string } | null;
  respondedByUser?: { id: number; first_name: string; last_name: string } | null;
}

export interface InspectionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InspectionRequestStatus;
  priority?: InspectionPriority;
  responseStatus?: InspectionResponseStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedEnvelope<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface SaveInspectionReportPayload {
  inspectionDatetime: string;
  approximateWeight?: string;
  weightUom: string;
  cargoType: string;
  transportationArrangement: string;
  approximateValue?: string;
  images: string[];
  notes?: string;
}

export interface UploadResponse {
  path: string;
  url?: string;
  fileName?: string;
}
