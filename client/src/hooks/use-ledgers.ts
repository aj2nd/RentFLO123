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

export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const url = buildUrl(api.ledgers.createOrder.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create payment order");
      }
      return api.ledgers.createOrder.responses[200].parse(await res.json());
    },
  });
}

// === PARTIAL PAYMENTS ===
export function usePaymentsByLedger(ledgerId: string) {
  return useQuery({
    queryKey: [api.payments.listByLedger.path, ledgerId],
    queryFn: async () => {
      const url = buildUrl(api.payments.listByLedger.path, { ledgerId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return api.payments.listByLedger.responses[200].parse(await res.json());
    },
    enabled: !!ledgerId,
  });
}

export function useCreatePartialPayment() {
  return useMutation({
    mutationFn: async ({ ledgerId, amount }: { ledgerId: string; amount: number }) => {
      const url = buildUrl(api.payments.create.path, { ledgerId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create partial payment");
      }
      return api.payments.create.responses[200].parse(await res.json());
    },
  });
}

// === MAINTENANCE TICKETS ===
export function useTickets(propertyId?: string) {
  return useQuery({
    queryKey: [api.tickets.list.path, propertyId],
    queryFn: async () => {
      const url = propertyId 
        ? `${api.tickets.list.path}?propertyId=${propertyId}` 
        : api.tickets.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return api.tickets.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: async (data: { propertyId: string; title: string; description: string; photoUrl?: string }) => {
      const res = await fetch(api.tickets.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create ticket");
      }
      return api.tickets.create.responses[201].parse(await res.json());
    },
  });
}

export function useResolveTicket() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.tickets.resolve.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to resolve ticket");
      }
      return api.tickets.resolve.responses[200].parse(await res.json());
    },
  });
}

export function useTicketCounts(propertyId: string) {
  return useQuery({
    queryKey: [api.tickets.countsByProperty.path, propertyId],
    queryFn: async () => {
      const url = buildUrl(api.tickets.countsByProperty.path, { id: propertyId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ticket counts");
      return api.tickets.countsByProperty.responses[200].parse(await res.json());
    },
    enabled: !!propertyId,
  });
}
