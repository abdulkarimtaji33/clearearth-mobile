import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  pickups: ['pickups'] as const,
  pickup: (taskId: number) => ['pickups', taskId] as const,
  dropdown: (category: string) => ['dropdowns', category] as const,
};
