import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertGoal } from "@shared/schema";

export function useCurrentGoal() {
  return useQuery({
    queryKey: [api.goals.get.path],
    queryFn: async () => {
      const res = await fetch(api.goals.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch goal");
      return api.goals.get.responses[200].parse(await res.json());
    },
  });
}

export function useSetGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGoal) => {
      const res = await fetch(api.goals.set.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set goal");
      return api.goals.set.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.goals.get.path] }),
  });
}
