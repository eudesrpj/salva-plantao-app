import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertHandover, type UpdateHandoverRequest } from "@shared/schema";

export function useHandovers() {
  return useQuery({
    queryKey: [api.handovers.list.path],
    queryFn: async () => {
      const res = await fetch(api.handovers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch handovers");
      return api.handovers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertHandover) => {
      const res = await fetch(api.handovers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create handover");
      return api.handovers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.handovers.list.path] }),
  });
}

export function useUpdateHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateHandoverRequest & { id: number }) => {
      const url = buildUrl(api.handovers.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update handover");
      return api.handovers.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.handovers.list.path] }),
  });
}

export function useDeleteHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.handovers.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete handover");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.handovers.list.path] }),
  });
}
