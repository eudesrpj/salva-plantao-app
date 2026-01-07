import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateShiftInput = z.infer<typeof api.shifts.create.input>;
type UpdateShiftInput = z.infer<typeof api.shifts.update.input>;

export function useShifts() {
  return useQuery({
    queryKey: [api.shifts.list.path],
    queryFn: async () => {
      const res = await fetch(api.shifts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shifts");
      return api.shifts.list.responses[200].parse(await res.json());
    },
  });
}

export function useShiftStats() {
  return useQuery({
    queryKey: [api.shifts.stats.path],
    queryFn: async () => {
      const res = await fetch(api.shifts.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.shifts.stats.responses[200].parse(await res.json());
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShiftInput) => {
      const res = await fetch(api.shifts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create shift");
      return api.shifts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shifts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shifts.stats.path] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateShiftInput & { id: number }) => {
      const url = buildUrl(api.shifts.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update shift");
      return api.shifts.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shifts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shifts.stats.path] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shifts.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete shift");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shifts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shifts.stats.path] });
    },
  });
}
