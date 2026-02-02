import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PayOwnerInput, type CollectRentInput } from "@shared/routes";

export function useLedgers(params?: { status?: 'ARREARS' | 'SETTLED' | 'EXPOSED'; propertyId?: string }) {
  return useQuery({
    queryKey: [api.ledgers.list.path, params],
    queryFn: async () => {
      // Build query string manually or use URLSearchParams if needed, 
      // but since api definition uses body/path, we'll map params to query string here for GET
      const url = new URL(api.ledgers.list.path, window.location.origin);
      if (params?.status) url.searchParams.append("status", params.status);
      if (params?.propertyId) url.searchParams.append("propertyId", params.propertyId);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ledgers");
      return api.ledgers.list.responses[200].parse(await res.json());
    },
  });
}

export function usePayOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PayOwnerInput }) => {
      const url = buildUrl(api.ledgers.payOwner.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
         const error = await res.json();
         throw new Error(error.message || "Failed to process payout");
      }
      return api.ledgers.payOwner.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ledgers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard.path] });
    },
  });
}

export function useCollectRent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CollectRentInput }) => {
      const url = buildUrl(api.ledgers.collectRent.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to collect rent");
      return api.ledgers.collectRent.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ledgers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard.path] });
    },
  });
}

export function useAdminDashboard() {
    return useQuery({
        queryKey: [api.admin.dashboard.path],
        queryFn: async () => {
            const res = await fetch(api.admin.dashboard.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch dashboard stats");
            return api.admin.dashboard.responses[200].parse(await res.json());
        }
    });
}
