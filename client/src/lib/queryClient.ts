import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    // Bypass the browser's HTTP cache entirely — React Query owns all caching.
    // Without this, the browser can serve a stale response from its own cache
    // even when React Query decides it's time to refetch.
    cache: "no-store",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      // Same as apiRequest: bypass browser HTTP cache so React Query controls
      // all freshness logic and never serves a cached 200 from a prior session.
      cache: "no-store",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      // Refetch when the user returns to the tab so financial figures (balances,
      // payment status, ledger state) are never silently stale after a period of
      // inactivity or after another browser tab performs a write.
      refetchOnWindowFocus: true,
      // 30 s stale window: data fetched in the last 30 s is served from the
      // React Query in-memory cache; older data triggers a background refetch
      // on the next mount or window focus. Prevents redundant network calls
      // during normal navigation while still catching updates quickly.
      staleTime: 30_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
