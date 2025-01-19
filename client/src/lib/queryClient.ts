import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        try {
          const res = await fetch(queryKey[0] as string, {
            credentials: "include",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });

          if (!res.ok) {
            // Handle specific error cases
            if (res.status === 401) {
              throw new Error('Unauthorized - Please check your API key');
            }
            if (res.status === 403) {
              throw new Error('Forbidden - Access denied');
            }
            if (res.status >= 500) {
              throw new Error(`Server error: ${res.statusText}`);
            }

            const errorText = await res.text();
            throw new Error(`${res.status}: ${errorText}`);
          }

          return res.json();
        } catch (error) {
          console.error('Query error:', error);
          throw error;
        }
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Retry logic for specific error cases
        if (error instanceof Error && error.message.includes('rate limit')) {
          return failureCount < 3;
        }
        return false;
      },
    },
    mutations: {
      retry: false,
    }
  },
});
