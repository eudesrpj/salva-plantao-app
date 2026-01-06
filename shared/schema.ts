import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// --- App Specific Tables ---

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // JSON or structured text
  category: text("category"),
  isPublic: boolean("is_public").default(false), // Admin created vs User created? User prescriptions might be saved ones.
  userId: text("user_id").references(() => users.id), // Nullable if global/admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// Checklists / Conducts
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Structured items: { items: [], redFlags: [], exams: [] }
  category: text("category"),
  isPublic: boolean("is_public").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true, createdAt: true });
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

// Shifts (Plantões)
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  type: text("type"), // Day, Night, 12h, 24h
  startTime: text("start_time"),
  endTime: text("end_time"),
  value: decimal("value", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, createdAt: true });
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

// Notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("text"), // text or handwritten (image url)
  tags: text("tags").array(),
  folder: text("folder"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Library Categories
export const libraryCategories = pgTable("library_categories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  parentId: integer("parent_id"), // For subcategories
  order: integer("order").default(0),
});

export const insertLibraryCategorySchema = createInsertSchema(libraryCategories).omit({ id: true });
export type LibraryCategory = typeof libraryCategories.$inferSelect;
export type InsertLibraryCategory = z.infer<typeof insertLibraryCategorySchema>;

// Library Items (Videos/Content)
export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => libraryCategories.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // video, pdf, link
  url: text("url").notNull(),
  description: text("description"),
  order: integer("order").default(0),
});

export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true });
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;

// Shift Checklist (Passagem de plantão)
export const shiftChecklists = pgTable("shift_checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  items: jsonb("items").notNull(), // Array of { label: string, checked: boolean }
  type: text("type").notNull(), // 'entry' or 'exit'
  isDefault: boolean("is_default").default(false),
});

export const insertShiftChecklistSchema = createInsertSchema(shiftChecklists).omit({ id: true });
export type ShiftChecklist = typeof shiftChecklists.$inferSelect;
export type InsertShiftChecklist = z.infer<typeof insertShiftChecklistSchema>;

// Handovers (SBAR)
export const handovers = pgTable("handovers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  age: text("age"),
  diagnosis: text("diagnosis"),
  sbarSituation: text("sbar_situation"),
  sbarBackground: text("sbar_background"),
  sbarAssessment: text("sbar_assessment"),
  sbarRecommendation: text("sbar_recommendation"),
  ward: text("ward"),
  bed: text("bed"),
  status: text("status").default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHandoverSchema = createInsertSchema(handovers).omit({ id: true, createdAt: true });
export type Handover = typeof handovers.$inferSelect;
export type InsertHandover = z.infer<typeof insertHandoverSchema>;

// Goals (Financial)
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // "2023-10"
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// --- API Types ---

export type CreatePrescriptionRequest = InsertPrescription;
export type UpdatePrescriptionRequest = Partial<InsertPrescription>;

export type CreateChecklistRequest = InsertChecklist;
export type UpdateChecklistRequest = Partial<InsertChecklist>;

export type CreateShiftRequest = InsertShift;
export type UpdateShiftRequest = Partial<InsertShift>;

export type CreateNoteRequest = InsertNote;
export type UpdateNoteRequest = Partial<InsertNote>;

export type CreateLibraryCategoryRequest = InsertLibraryCategory;
export type UpdateLibraryCategoryRequest = Partial<InsertLibraryCategory>;

export type CreateLibraryItemRequest = InsertLibraryItem;
export type UpdateLibraryItemRequest = Partial<InsertLibraryItem>;

export type CreateHandoverRequest = InsertHandover;
export type UpdateHandoverRequest = Partial<InsertHandover>;

export type CreateGoalRequest = InsertGoal;
export type UpdateGoalRequest = Partial<InsertGoal>;
