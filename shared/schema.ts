import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// --- App Specific Tables ---

// Medications Library (Reusable medication templates)
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Ex: Dipirona 500mg
  presentation: text("presentation"), // Ex: Comprimido, Gotas, Ampola
  dose: text("dose"), // Default dose
  dosePerKg: text("dose_per_kg"), // For pediatric
  maxDose: text("max_dose"),
  interval: text("interval"), // 6/6h, 8/8h, etc.
  duration: text("duration"),
  route: text("route"), // VO, IV, IM, SC
  quantity: text("quantity"), // 1 caixa, 20 comprimidos
  timing: text("timing"), // jejum, com alimentação
  observations: text("observations"),
  ageGroup: text("age_group").default("adulto"), // adulto, pediatrico
  category: text("category"), // Analgésicos, Antibióticos, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

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
  medicationId: integer("medication_id").references(() => medications.id), // Reference to library
  medication: text("medication").notNull(), // Inline name (or copy from library)
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
  pharmaceuticalForm: text("pharmaceutical_form"), // Comprimido, Gotas, Xarope, Solução/Ampola
  concentration: text("concentration"), // Ex: 500mg/ml, 100mg/5ml
  doseByAge: jsonb("dose_by_age"), // { "0-1": "2.5ml", "1-5": "5ml", "5-12": "10ml" }
  minAge: integer("min_age"), // Minimum age in months
  maxAge: integer("max_age"), // Maximum age in months
  minWeight: decimal("min_weight"), // Minimum weight in kg
  maxWeight: decimal("max_weight"), // Maximum weight in kg
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalculatorSettingSchema = createInsertSchema(calculatorSettings).omit({ id: true, createdAt: true });
export type CalculatorSetting = typeof calculatorSettings.$inferSelect;
export type InsertCalculatorSetting = z.infer<typeof insertCalculatorSettingSchema>;

// Drug Interactions (Admin configurable)
export const drugInteractions = pgTable("drug_interactions", {
  id: serial("id").primaryKey(),
  drug1: text("drug_1").notNull(),
  drug2: text("drug_2").notNull(),
  severity: text("severity").notNull(), // leve, moderada, grave
  description: text("description").notNull(),
  recommendation: text("recommendation"), // Ex: "evitar associação", "monitorar função renal"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDrugInteractionSchema = createInsertSchema(drugInteractions).omit({ id: true, createdAt: true });
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = z.infer<typeof insertDrugInteractionSchema>;

// Medication Contraindications (Admin configurable)
export const medicationContraindications = pgTable("medication_contraindications", {
  id: serial("id").primaryKey(),
  medicationName: text("medication_name").notNull(),
  contraindication: text("contraindication").notNull(),
  severity: text("severity"), // leve, moderada, grave, absoluta
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicationContraindicationSchema = createInsertSchema(medicationContraindications).omit({ id: true, createdAt: true });
export type MedicationContraindication = typeof medicationContraindications.$inferSelect;
export type InsertMedicationContraindication = z.infer<typeof insertMedicationContraindicationSchema>;

// Prescriptions (Updated with structured fields)
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // Legacy field for backwards compatibility
  medication: text("medication"),
  dose: text("dose"),
  pharmaceuticalForm: text("pharmaceutical_form"), // Comprimido, Gotas, Xarope, Solução/Ampola
  interval: text("interval"), // 6/6h, 8/8h, 12/12h, 1x/dia
  quantity: text("quantity"), // comprimidos, gotas, ml, frascos
  duration: text("duration"), // 3, 5, 7, 10 dias, uso indeterminado
  route: text("route"), // VO, IV, IM, SC, Tópico
  timing: text("timing"), // Jejum, Com alimentação, Antes de dormir
  patientNotes: text("patient_notes"), // Observações do paciente
  orientations: text("orientations"), // Orientações / Sinais de Alarme
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

// User Prescription Favorites (Personalized copies)
export const prescriptionFavorites = pgTable("prescription_favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  originalPrescriptionId: integer("original_prescription_id").references(() => prescriptions.id),
  title: text("title").notNull(),
  medication: text("medication"),
  dose: text("dose"),
  pharmaceuticalForm: text("pharmaceutical_form"),
  interval: text("interval"),
  quantity: text("quantity"),
  duration: text("duration"),
  route: text("route"),
  timing: text("timing"),
  patientNotes: text("patient_notes"),
  orientations: text("orientations"), // Orientações / Sinais de Alarme
  exportToken: text("export_token"), // Token for sharing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrescriptionFavoriteSchema = createInsertSchema(prescriptionFavorites).omit({ id: true, createdAt: true, updatedAt: true });
export type PrescriptionFavorite = typeof prescriptionFavorites.$inferSelect;
export type InsertPrescriptionFavorite = z.infer<typeof insertPrescriptionFavoriteSchema>;

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

export const insertShiftSchema = createInsertSchema(shifts, {
  date: z.coerce.date(),
  isPaid: z.boolean().optional().default(false),
}).omit({ id: true, createdAt: true });
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

// Daily Tasks (Tarefas do Dia)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueTime: text("due_time"), // HH:mm format
  dueDate: timestamp("due_date"),
  frequency: text("frequency").default("once"), // once, daily, weekly, monthly
  reminder: boolean("reminder").default(false),
  reminderMinutes: integer("reminder_minutes").default(30), // minutes before
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: z.coerce.date().optional().nullable(),
  isCompleted: z.boolean().optional().default(false),
  reminder: z.boolean().optional().default(false),
}).omit({ id: true, createdAt: true, completedAt: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

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

// Evolution Models (Modelos de Evolução Clínica)
export const evolutionModels = pgTable("evolution_models", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"), // clínica médica, pediatria, gineco, pronto-atendimento
  isPublic: boolean("is_public").default(true),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEvolutionModelSchema = createInsertSchema(evolutionModels).omit({ id: true, createdAt: true });
export type EvolutionModel = typeof evolutionModels.$inferSelect;
export type InsertEvolutionModel = z.infer<typeof insertEvolutionModelSchema>;

// Physical Exam Templates (Exame Físico Padrão)
export const physicalExamTemplates = pgTable("physical_exam_templates", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // estado_geral, sinais_vitais, cabeca_pescoco, cardiovascular, respiratorio, abdome, neurologico, extremidades
  content: text("content").notNull(),
  order: integer("order").default(0),
  isPublic: boolean("is_public").default(true),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhysicalExamTemplateSchema = createInsertSchema(physicalExamTemplates).omit({ id: true, createdAt: true });
export type PhysicalExamTemplate = typeof physicalExamTemplates.$inferSelect;
export type InsertPhysicalExamTemplate = z.infer<typeof insertPhysicalExamTemplateSchema>;

// Signs and Symptoms Templates
export const signsSymptoms = pgTable("signs_symptoms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"), // cardiologia, respiratório, abdome, neurológico
  isPublic: boolean("is_public").default(true),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSignsSymptomsSchema = createInsertSchema(signsSymptoms).omit({ id: true, createdAt: true });
export type SignsSymptoms = typeof signsSymptoms.$inferSelect;
export type InsertSignsSymptoms = z.infer<typeof insertSignsSymptomsSchema>;

// Semiological Signs Templates
export const semiologicalSigns = pgTable("semiological_signs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  isPublic: boolean("is_public").default(true),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSemiologicalSignsSchema = createInsertSchema(semiologicalSigns).omit({ id: true, createdAt: true });
export type SemiologicalSigns = typeof semiologicalSigns.$inferSelect;
export type InsertSemiologicalSigns = z.infer<typeof insertSemiologicalSignsSchema>;

// Medical Certificates (Atestados Médicos)
export const medicalCertificates = pgTable("medical_certificates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  patientDocument: text("patient_document"),
  daysOff: integer("days_off").notNull(),
  startDate: timestamp("start_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicalCertificateSchema = createInsertSchema(medicalCertificates, {
  startDate: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export type MedicalCertificate = typeof medicalCertificates.$inferSelect;
export type InsertMedicalCertificate = z.infer<typeof insertMedicalCertificateSchema>;

// Attendance Declarations (Declarações de Comparecimento)
export const attendanceDeclarations = pgTable("attendance_declarations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  patientDocument: text("patient_document"),
  attendanceDate: timestamp("attendance_date").notNull(),
  period: text("period"), // manhã, tarde, noite
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceDeclarationSchema = createInsertSchema(attendanceDeclarations, {
  attendanceDate: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export type AttendanceDeclaration = typeof attendanceDeclarations.$inferSelect;
export type InsertAttendanceDeclaration = z.infer<typeof insertAttendanceDeclarationSchema>;

// Referral Destinations (Destinos de Encaminhamento)
export const referralDestinations = pgTable("referral_destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // UPA, hospital, pronto-socorro, especialidade
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralDestinationSchema = createInsertSchema(referralDestinations).omit({ id: true, createdAt: true });
export type ReferralDestination = typeof referralDestinations.$inferSelect;
export type InsertReferralDestination = z.infer<typeof insertReferralDestinationSchema>;

// Referral Reasons (Motivos de Encaminhamento)
export const referralReasons = pgTable("referral_reasons", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralReasonSchema = createInsertSchema(referralReasons).omit({ id: true, createdAt: true });
export type ReferralReason = typeof referralReasons.$inferSelect;
export type InsertReferralReason = z.infer<typeof insertReferralReasonSchema>;

// Medical Referrals (Encaminhamentos)
export const medicalReferrals = pgTable("medical_referrals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  patientBirthDate: timestamp("patient_birth_date"),
  patientAge: text("patient_age"),
  patientSex: text("patient_sex"),
  patientDocument: text("patient_document"),
  patientAddress: text("patient_address"),
  originUnit: text("origin_unit"),
  vitalSigns: jsonb("vital_signs"), // { pa, fc, fr, spo2, temp }
  referralReason: text("referral_reason").notNull(),
  destination: text("destination").notNull(),
  clinicalHistory: text("clinical_history"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicalReferralSchema = createInsertSchema(medicalReferrals, {
  patientBirthDate: z.coerce.date().optional().nullable(),
}).omit({ id: true, createdAt: true });
export type MedicalReferral = typeof medicalReferrals.$inferSelect;
export type InsertMedicalReferral = z.infer<typeof insertMedicalReferralSchema>;

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

// --- AI Integration Tables ---

// User AI Credentials (Encrypted API keys)
export const userAiCredentials = pgTable("user_ai_credentials", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  provider: text("provider").default("openai"), // openai, anthropic, etc.
  encryptedApiKey: text("encrypted_api_key").notNull(), // AES-256-GCM encrypted
  keyIv: text("key_iv").notNull(), // Initialization vector for decryption
  keyAuthTag: text("key_auth_tag").notNull(), // Auth tag for verification
  model: text("model").default("gpt-4o"), // gpt-4, gpt-4o, gpt-3.5-turbo
  isEnabled: boolean("is_enabled").default(true),
  lastTestedAt: timestamp("last_tested_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserAiCredentialsSchema = createInsertSchema(userAiCredentials).omit({ id: true, createdAt: true, updatedAt: true });
export type UserAiCredentials = typeof userAiCredentials.$inferSelect;
export type InsertUserAiCredentials = z.infer<typeof insertUserAiCredentialsSchema>;

// AI Medical Prompts (Admin-managed)
export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  promptText: text("prompt_text").notNull(),
  category: text("category"), // conduta, resumo, diagnóstico, etc.
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({ id: true, createdAt: true, updatedAt: true });
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

// AI Settings (Global admin settings)
export const aiSettings = pgTable("ai_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiSettingSchema = createInsertSchema(aiSettings).omit({ id: true, updatedAt: true });
export type AiSetting = typeof aiSettings.$inferSelect;
export type InsertAiSetting = z.infer<typeof insertAiSettingSchema>;

// Request types for AI
export type CreateUserAiCredentialsRequest = Omit<InsertUserAiCredentials, 'encryptedApiKey' | 'keyIv' | 'keyAuthTag'> & { apiKey: string };
export type CreateAiPromptRequest = InsertAiPrompt;
export type UpdateAiPromptRequest = Partial<InsertAiPrompt>;

// User Preferences (Theme and customization)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id),
  theme: text("theme").default("system"), // light, dark, system
  colorScheme: text("color_scheme").default("blue"), // blue, green, purple, orange, rose
  fontSize: text("font_size").default("medium"), // small, medium, large
  compactMode: boolean("compact_mode").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
