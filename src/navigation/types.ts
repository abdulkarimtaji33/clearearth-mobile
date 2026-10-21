import type { NavigatorScreenParams } from '@react-navigation/native';
import type { OrderKind } from '@/api/ops/types';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  PickupList: undefined;
  PickupDetail: { taskId: number };
  Profile: undefined;
};

export type InspectionStackParamList = {
  InspectionList: undefined;
  InspectionDetail: { id: number };
  InspectionReport: { id: number; dealId: number };
  Profile: undefined;
};

export type WorkFilter = 'all' | 'overdue' | 'unassigned' | 'in_progress' | 'new' | 'completed';
export type OrderFilter = 'needs_wo' | 'has_wo' | 'all';

export type OpsTabParamList = {
  Home: undefined;
  Work: { filter?: WorkFilter } | undefined;
  Orders: { kind?: OrderKind; filter?: OrderFilter } | undefined;
  Stock: { segment?: 'grn' | 'inventory'; status?: 'new' | 'submitted' | 'approved' } | undefined;
  More: undefined;
};

export type OpsStackParamList = {
  Tabs: NavigatorScreenParams<OpsTabParamList> | undefined;
  WorkOrderDetail: { id: number; openTaskId?: number };
  OrderDetail: { kind: OrderKind; id: number };
  CreateWorkOrder: { kind: OrderKind; orderId: number };
  GrnDetail: { id: number };
  Notifications: undefined;
  Deals: undefined;
  DealDetail: { id: number };
  Certificates: undefined;
  Leave: undefined;
  WorkTypes: undefined;
  Profile: undefined;
};
