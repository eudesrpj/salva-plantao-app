import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertChecklist, type UpdateChecklistRequest } from "@shared/schema";

export function useChecklists() {
  return useQuery({
    queryKey: [api.checklists.list.path],
    queryFn: async () => {
      const res = await fetch(api.checklists.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch checklists");
      return api.checklists.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertChecklist) => {
      const res = await fetch(api.checklists.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create checklist");
      return api.checklists.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.checklists.list.path] }),
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.checklists.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete checklist");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.checklists.list.path] }),
  });
}
