import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertPrescription, type UpdatePrescriptionRequest } from "@shared/schema";

export function usePrescriptions() {
  return useQuery({
    queryKey: [api.prescriptions.list.path],
    queryFn: async () => {
      const res = await fetch(api.prescriptions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      return api.prescriptions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const res = await fetch(api.prescriptions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create prescription");
      return api.prescriptions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] }),
  });
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePrescriptionRequest & { id: number }) => {
      const url = buildUrl(api.prescriptions.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update prescription");
      return api.prescriptions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] }),
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.prescriptions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete prescription");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] }),
  });
}
