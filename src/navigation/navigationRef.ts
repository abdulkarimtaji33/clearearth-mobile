import { createNavigationContainerRef } from '@react-navigation/native';
import type { OpsStackParamList } from './types';

/** Lets non-component code (push taps, socket events) navigate inside the Operations stack. */
export const navigationRef = createNavigationContainerRef<OpsStackParamList>();

/**
 * Maps a notification's `entity_type` / `entity_id` to the screen that shows it.
 * Returns false when the entity has no mobile screen (inspection, leads, payroll...).
 */
export function openEntity(entityType: string | null | undefined, entityId: number | null | undefined): boolean {
  if (!navigationRef.isReady() || !entityType || !entityId) return false;
  switch (entityType) {
    case 'work_order':
      navigationRef.navigate('WorkOrderDetail', { id: entityId });
      return true;
    case 'grn':
      navigationRef.navigate('GrnDetail', { id: entityId });
      return true;
    case 'quotation':
      navigationRef.navigate('OrderDetail', { kind: 'service', id: entityId });
      return true;
    case 'purchase_order':
      navigationRef.navigate('OrderDetail', { kind: 'client_po', id: entityId });
      return true;
    case 'deal':
      navigationRef.navigate('DealDetail', { id: entityId });
      return true;
    case 'leave_request':
      navigationRef.navigate('Leave');
      return true;
    default:
      return false;
  }
}
