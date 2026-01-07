import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// --- App Specific Tables ---

// Pathologies (Base structure for prescriptions)
export const pathologies = pgTable("pathologies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ageGroup: text("age_group").default("adulto"), // adulto, pediatrico
  category: text("category"), // Emergência, Clínica, Pediatria, etc.
  specialty: text("specialty"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  isLocked: boolean("is_locked").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPathologySchema = createInsertSchema(pathologies).omit({ id: true, createdAt: true });
export type Pathology = typeof pathologies.$inferSelect;
export type InsertPathology = z.infer<typeof insertPathologySchema>;

// Pathology Medications (Multiple medications per pathology)
export const pathologyMedications = pgTable("pathology_medications", {
  id: serial("id").primaryKey(),
  pathologyId: integer("pathology_id").notNull().references(() => pathologies.id),
  medication: text("medication").notNull(),
  dose: text("dose"),
  dosePerKg: text("dose_per_kg"), // For pediatric: mg/kg
  maxDose: text("max_dose"), // Maximum dose for safety
  interval: text("interval"), // 6/6h, 8/8h, etc.
  duration: text("duration"),
  route: text("route"), // VO, IV, IM, SC
  quantity: text("quantity"), // 1 caixa, 20 comprimidos
  timing: text("timing"), // jejum, com alimentação
  observations: text("observations"),
  order: integer("order").default(0),
});

export const insertPathologyMedicationSchema = createInsertSchema(pathologyMedications).omit({ id: true });
export type PathologyMedication = typeof pathologyMedications.$inferSelect;
export type InsertPathologyMedication = z.infer<typeof insertPathologyMedicationSchema>;

// Patient Prescription History
export const patientHistory = pgTable("patient_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  patientId: text("patient_id"), // Optional: prontuário, CPF
  prescriptionData: jsonb("prescription_data").notNull(), // Full prescription snapshot
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatientHistorySchema = createInsertSchema(patientHistory).omit({ id: true, createdAt: true });
export type PatientHistory = typeof patientHistory.$inferSelect;
export type InsertPatientHistory = z.infer<typeof insertPatientHistorySchema>;

// Pediatric Calculator Settings (Admin configurable)
export const calculatorSettings = pgTable("calculator_settings", {
  id: serial("id").primaryKey(),
  medication: text("medication").notNull(),
  dosePerKg: text("dose_per_kg").notNull(),
  maxDose: text("max_dose"),
  unit: text("unit").default("mg"),
  interval: text("interval"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
});

export const insertCalculatorSettingSchema = createInsertSchema(calculatorSettings).omit({ id: true });
export type CalculatorSetting = typeof calculatorSettings.$inferSelect;
export type InsertCalculatorSetting = z.infer<typeof insertCalculatorSettingSchema>;

// Prescriptions (Updated with structured fields)
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // Legacy field for backwards compatibility
  medication: text("medication"),
  dose: text("dose"),
  interval: text("interval"), // 6/6h, 8/8h, 12/12h, 1x/dia
  quantity: text("quantity"), // comprimidos, gotas, ml, frascos
  duration: text("duration"), // 3, 5, 7, 10 dias, uso indeterminado
  route: text("route"), // VO, IV, IM, SC, Tópico
  timing: text("timing"), // Jejum, Com alimentação, Antes de dormir
  patientNotes: text("patient_notes"), // Observações do paciente
  ageGroup: text("age_group").default("adulto"), // adulto, pediatrico
  category: text("category"),
  specialty: text("specialty"), // Especialidade médica
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  isLocked: boolean("is_locked").default(false), // Bloquear edição (modelos oficiais)
  isFavorite: boolean("is_favorite").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// Protocols
export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Steps, criteria, flowchart data
  description: text("description"),
  ageGroup: text("age_group").default("adulto"), // adulto, pediatrico
  specialty: text("specialty"), // Cardiologia, Pediatria, etc.
  category: text("category"), // urgência, emergência, ambulatório
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  isLocked: boolean("is_locked").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProtocolSchema = createInsertSchema(protocols).omit({ id: true, createdAt: true, updatedAt: true });
export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;

// Checklists / Conducts (Updated)
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // { steps: [], items: [], redFlags: [], exams: [] }
  description: text("description"),
  ageGroup: text("age_group").default("adulto"),
  category: text("category"),
  specialty: text("specialty"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  isLocked: boolean("is_locked").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true, createdAt: true });
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

// Memorization / Flashcards
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // resumo, mnemonico, dica, checkpoint
  front: text("front").notNull(), // Question or term
  back: text("back").notNull(), // Answer or explanation
  category: text("category"),
  specialty: text("specialty"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

// User Favorites (junction table)
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(), // prescription, checklist, protocol, flashcard
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

// Admin Settings (Payment, AI Prompts, etc.)
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;

// Doctor Profile (Stamp/Signature)
export const doctorProfiles = pgTable("doctor_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  crm: text("crm"),
  crmState: text("crm_state"),
  specialty: text("specialty"),
  stampText: text("stamp_text"), // Custom stamp text
  signatureUrl: text("signature_url"), // Digital signature image
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorProfileSchema = createInsertSchema(doctorProfiles).omit({ id: true, updatedAt: true });
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;

// Interconsult Messages (User-to-User and User-to-Admin)
export const interconsultMessages = pgTable("interconsult_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").references(() => users.id), // Null = Admin support
  channel: text("channel").notNull(), // interconsult, admin_support
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInterconsultMessageSchema = createInsertSchema(interconsultMessages).omit({ id: true, createdAt: true });
export type InterconsultMessage = typeof interconsultMessages.$inferSelect;
export type InsertInterconsultMessage = z.infer<typeof insertInterconsultMessageSchema>;

// Usage Statistics (for Admin Dashboard)
export const usageStats = pgTable("usage_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // view_prescription, create_prescription, use_ai, etc.
  itemType: text("item_type"),
  itemId: integer("item_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUsageStatSchema = createInsertSchema(usageStats).omit({ id: true, createdAt: true });
export type UsageStat = typeof usageStats.$inferSelect;
export type InsertUsageStat = z.infer<typeof insertUsageStatSchema>;

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
  parentId: integer("parent_id"),
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
  items: jsonb("items").notNull(),
  type: text("type").notNull(),
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
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHandoverSchema = createInsertSchema(handovers).omit({ id: true, createdAt: true });
export type Handover = typeof handovers.$inferSelect;
export type InsertHandover = z.infer<typeof insertHandoverSchema>;

// Goals (Financial)
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  month: text("month").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// --- API Types ---

export type CreatePrescriptionRequest = InsertPrescription;
export type UpdatePrescriptionRequest = Partial<InsertPrescription>;

export type CreateProtocolRequest = InsertProtocol;
export type UpdateProtocolRequest = Partial<InsertProtocol>;

export type CreateChecklistRequest = InsertChecklist;
export type UpdateChecklistRequest = Partial<InsertChecklist>;

export type CreateFlashcardRequest = InsertFlashcard;
export type UpdateFlashcardRequest = Partial<InsertFlashcard>;

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

export type CreateDoctorProfileRequest = InsertDoctorProfile;
export type UpdateDoctorProfileRequest = Partial<InsertDoctorProfile>;

export type CreatePathologyRequest = InsertPathology;
export type UpdatePathologyRequest = Partial<InsertPathology>;

export type CreatePathologyMedicationRequest = InsertPathologyMedication;
export type UpdatePathologyMedicationRequest = Partial<InsertPathologyMedication>;

export type CreatePatientHistoryRequest = InsertPatientHistory;

export type CreateCalculatorSettingRequest = InsertCalculatorSetting;
export type UpdateCalculatorSettingRequest = Partial<InsertCalculatorSetting>;
