import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Refetches when the screen regains focus (tab switch / back navigation) and when the app returns
 * from the background. Skips the very first focus so a freshly mounted screen doesn't double-fetch.
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const first = useRef(true);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      refetchRef.current();
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refetchRef.current();
    });
    return () => sub.remove();
  }, []);
}
