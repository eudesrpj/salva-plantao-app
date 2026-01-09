
import { z } from 'zod';

// Schema for a single item in the sidebar menu
export const SidebarMenuItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "O rótulo não pode estar vazio."),
  route: z.string().min(1, "A rota não pode estar vazia."),
  icon: z.string().optional(),
  visible: z.boolean(),
  adminOnly: z.boolean(),
});

// Schema for a single tab within a page
export const PageTabSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "O rótulo não pode estar vazio."),
  value: z.string().min(1, "O valor não pode estar vazio."),
  visible: z.boolean(),
  adminOnly: z.boolean(),
});

// Schema for the entire UI configuration
export const UIConfigSchema = z.object({
  sidebarMenu: z.array(SidebarMenuItemSchema),
  pageTabs: z.record(z.array(PageTabSchema)),
});

// Type definitions inferred from schemas
export type SidebarMenuItem = z.infer<typeof SidebarMenuItemSchema>;
export type PageTab = z.infer<typeof PageTabSchema>;
export type UIConfig = z.infer<typeof UIConfigSchema>;
