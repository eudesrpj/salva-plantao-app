import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { 
  CreatePrescriptionRequest, UpdatePrescriptionRequest,
  CreateChecklistRequest, UpdateChecklistRequest,
  CreateShiftRequest, UpdateShiftRequest,
  CreateNoteRequest, UpdateNoteRequest,
  CreateLibraryCategoryRequest, CreateLibraryItemRequest
} from "@shared/schema";

// --- PRESCRIPTIONS ---
export function usePrescriptions() {
  return useQuery({
    queryKey: [api.prescriptions.list.path],
    queryFn: async () => {
      const res = await fetch(api.prescriptions.list.path);
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      return api.prescriptions.list.responses[200].parse(await res.json());
    }
  });
}

export function usePrescriptionMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async (data: CreatePrescriptionRequest) => {
      const res = await fetch(api.prescriptions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return api.prescriptions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] });
      toast({ title: "Sucesso", description: "Prescrição criada com sucesso." });
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.prescriptions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] });
      toast({ title: "Deletado", description: "Prescrição removida." });
    }
  });

  return { create, deleteItem };
}

// --- SHIFTS ---
export function useShifts() {
  return useQuery({
    queryKey: [api.shifts.list.path],
    queryFn: async () => {
      const res = await fetch(api.shifts.list.path);
      if (!res.ok) throw new Error("Failed to fetch shifts");
      return api.shifts.list.responses[200].parse(await res.json());
    }
  });
}

export function useShiftStats() {
  return useQuery({
    queryKey: [api.shifts.stats.path],
    queryFn: async () => {
      const res = await fetch(api.shifts.stats.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.shifts.stats.responses[200].parse(await res.json());
    }
  });
}

export function useShiftMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async (data: CreateShiftRequest) => {
      const res = await fetch(api.shifts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return api.shifts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shifts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shifts.stats.path] });
      toast({ title: "Plantão adicionado", description: "Agenda atualizada." });
    }
  });

  return { create };
}

// --- NOTES ---
export function useNotes() {
  return useQuery({
    queryKey: [api.notes.list.path],
    queryFn: async () => {
      const res = await fetch(api.notes.list.path);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return api.notes.list.responses[200].parse(await res.json());
    }
  });
}

export function useNoteMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async (data: CreateNoteRequest) => {
      const res = await fetch(api.notes.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create note");
      return api.notes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path] });
      toast({ title: "Nota salva", description: "Sua anotação foi guardada." });
    }
  });

  return { create };
}

// --- LIBRARY ---
export function useLibraryCategories() {
  return useQuery({
    queryKey: [api.library.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.library.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.library.categories.list.responses[200].parse(await res.json());
    }
  });
}

export function useLibraryItems(categoryId: number) {
  return useQuery({
    queryKey: [api.library.items.list.path, categoryId],
    queryFn: async () => {
      const url = `${api.library.items.list.path}?categoryId=${categoryId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.library.items.list.responses[200].parse(await res.json());
    },
    enabled: !!categoryId
  });
}

// --- CHECKLISTS ---
export function useChecklists() {
  return useQuery({
    queryKey: [api.checklists.list.path],
    queryFn: async () => {
      const res = await fetch(api.checklists.list.path);
      if (!res.ok) throw new Error("Failed to fetch checklists");
      return api.checklists.list.responses[200].parse(await res.json());
    }
  });
}
