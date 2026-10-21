import { useCallback } from 'react';
import { useAuth } from '@/hooks/AuthContext';

/**
 * UI-level permission gate. The server remains the source of truth (every route is
 * authorized there) — this only decides what to show. `operations_manager` follows the
 * backend rule that any `operations.*` permission satisfies `operations.<action>`.
 */
export function usePermission() {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  const role = user?.role;

  const can = useCallback(
    (...required: string[]) => {
      if (role === 'super_admin') return true;
      return required.some((p) => {
        if (perms.includes(p)) return true;
        if (role === 'operations_manager' && p.startsWith('operations.')) {
          return perms.some((x) => x.startsWith('operations.'));
        }
        return false;
      });
    },
    [perms, role]
  );

  return { can };
}
