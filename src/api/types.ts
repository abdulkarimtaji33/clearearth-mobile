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
