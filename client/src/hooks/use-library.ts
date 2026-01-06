import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLibraryCategory, type InsertLibraryItem } from "@shared/schema";

export function useLibraryCategories() {
  return useQuery({
    queryKey: [api.library.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.library.categories.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.library.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useLibraryItems(categoryId: number) {
  return useQuery({
    queryKey: [api.library.items.list.path, categoryId],
    queryFn: async () => {
      const url = `${api.library.items.list.path}?categoryId=${categoryId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.library.items.list.responses[200].parse(await res.json());
    },
    enabled: !!categoryId,
  });
}
