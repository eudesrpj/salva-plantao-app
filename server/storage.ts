import { 
  prescriptions, checklists, shifts, notes, tasks, libraryCategories, libraryItems, shiftChecklists, handovers, goals,
  protocols, flashcards, favorites, adminSettings, doctorProfiles, interconsultMessages, usageStats,
  pathologies, pathologyMedications, patientHistory, calculatorSettings, medications, userPreferences,
  drugInteractions, medicationContraindications, prescriptionFavorites, promoCoupons, couponUsages,
  evolutionModels, physicalExamTemplates, signsSymptoms, semiologicalSigns,
  medicalCertificates, attendanceDeclarations, medicalReferrals, referralDestinations, referralReasons,
  prescriptionModels, prescriptionModelMedications, monthlyExpenses, financialGoals,
  plans, subscriptions, payments,
  type Prescription, type InsertPrescription, type UpdatePrescriptionRequest,
  type Checklist, type InsertChecklist, type UpdateChecklistRequest,
  type Shift, type InsertShift, type UpdateShiftRequest,
  type Note, type InsertNote, type UpdateNoteRequest,
  type Task, type InsertTask,
  type LibraryCategory, type InsertLibraryCategory,
  type LibraryItem, type InsertLibraryItem,
  type ShiftChecklist, type InsertShiftChecklist,
  type Handover, type InsertHandover, type UpdateHandoverRequest,
  type Goal, type InsertGoal,
  type Protocol, type InsertProtocol, type UpdateProtocolRequest,
  type Flashcard, type InsertFlashcard, type UpdateFlashcardRequest,
  type Favorite, type InsertFavorite,
  type AdminSetting, type InsertAdminSetting,
  type DoctorProfile, type InsertDoctorProfile, type UpdateDoctorProfileRequest,
  type InterconsultMessage, type InsertInterconsultMessage,
  type UsageStat, type InsertUsageStat,
  type Pathology, type InsertPathology, type UpdatePathologyRequest,
  type PathologyMedication, type InsertPathologyMedication, type UpdatePathologyMedicationRequest,
  type PatientHistory, type InsertPatientHistory,
  type CalculatorSetting, type InsertCalculatorSetting, type UpdateCalculatorSettingRequest,
  type Medication, type InsertMedication,
  type UserPreferences, type InsertUserPreferences,
  type DrugInteraction, type InsertDrugInteraction,
  type MedicationContraindication, type InsertMedicationContraindication,
  type PrescriptionFavorite, type InsertPrescriptionFavorite,
  type EvolutionModel, type InsertEvolutionModel,
  type PhysicalExamTemplate, type InsertPhysicalExamTemplate,
  type SignsSymptoms, type InsertSignsSymptoms,
  type SemiologicalSigns, type InsertSemiologicalSigns,
  type MedicalCertificate, type InsertMedicalCertificate,
  type AttendanceDeclaration, type InsertAttendanceDeclaration,
  type MedicalReferral, type InsertMedicalReferral,
  type ReferralDestination, type InsertReferralDestination,
  type ReferralReason, type InsertReferralReason,
  type PrescriptionModel, type InsertPrescriptionModel,
  type PrescriptionModelMedication, type InsertPrescriptionModelMedication,
  type MonthlyExpense, type InsertMonthlyExpense,
  type FinancialGoal, type InsertFinancialGoal,
  type PromoCoupon, type InsertPromoCoupon,
  type CouponUsage, type InsertCouponUsage,
  type Plan, type InsertPlan,
  type Subscription, type InsertSubscription,
  type Payment, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Prescriptions
  getPrescriptions(userId?: string, ageGroup?: string): Promise<Prescription[]>;
  searchPrescriptions(query: string, userId?: string): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  createPrescription(item: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, item: UpdatePrescriptionRequest): Promise<Prescription>;
  deletePrescription(id: number): Promise<void>;

  // Protocols
  getProtocols(userId?: string, ageGroup?: string): Promise<Protocol[]>;
  searchProtocols(query: string, userId?: string): Promise<Protocol[]>;
  getProtocol(id: number): Promise<Protocol | undefined>;
  createProtocol(item: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, item: UpdateProtocolRequest): Promise<Protocol>;
  deleteProtocol(id: number): Promise<void>;

  // Checklists
  getChecklists(userId?: string, ageGroup?: string): Promise<Checklist[]>;
  searchChecklists(query: string, userId?: string): Promise<Checklist[]>;
  getChecklist(id: number): Promise<Checklist | undefined>;
  createChecklist(item: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, item: UpdateChecklistRequest): Promise<Checklist>;
  deleteChecklist(id: number): Promise<void>;

  // Flashcards
  getFlashcards(userId?: string): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(item: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, item: UpdateFlashcardRequest): Promise<Flashcard>;
  deleteFlashcard(id: number): Promise<void>;

  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(item: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, itemType: string, itemId: number): Promise<void>;

  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(key: string, value: string): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;

  // Doctor Profiles
  getDoctorProfile(userId: string): Promise<DoctorProfile | undefined>;
  upsertDoctorProfile(item: InsertDoctorProfile): Promise<DoctorProfile>;

  // Interconsult Messages
  getInterconsultMessages(userId: string, channel?: string): Promise<InterconsultMessage[]>;
  createInterconsultMessage(item: InsertInterconsultMessage): Promise<InterconsultMessage>;
  markMessageRead(id: number): Promise<void>;

  // Usage Stats
  logUsage(item: InsertUsageStat): Promise<void>;
  getUsageStats(days?: number): Promise<{ action: string; count: number }[]>;

  // Shifts
  getShifts(userId: string): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  createShift(item: InsertShift): Promise<Shift>;
  updateShift(id: number, item: UpdateShiftRequest): Promise<Shift>;
  deleteShift(id: number): Promise<void>;
  getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[], monthlyGoal: number | null }>;

  // Notes
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(item: InsertNote): Promise<Note>;
  updateNote(id: number, item: UpdateNoteRequest): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(item: InsertTask): Promise<Task>;
  updateTask(id: number, item: Partial<InsertTask>): Promise<Task>;
  toggleTask(id: number): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Library
  getLibraryCategories(): Promise<LibraryCategory[]>;
  createLibraryCategory(item: InsertLibraryCategory): Promise<LibraryCategory>;
  getLibraryItems(categoryId: number): Promise<LibraryItem[]>;
  createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem>;

  // Handovers
  getHandovers(userId: string): Promise<Handover[]>;
  getHandover(id: number): Promise<Handover | undefined>;
  createHandover(item: InsertHandover): Promise<Handover>;
  updateHandover(id: number, item: UpdateHandoverRequest): Promise<Handover>;
  deleteHandover(id: number): Promise<void>;

  // Goals
  getGoal(userId: string, month: string): Promise<Goal | undefined>;
  setGoal(item: InsertGoal): Promise<Goal>;

  // Pathologies
  getPathologies(userId?: string, ageGroup?: string): Promise<Pathology[]>;
  getPublicPathologies(ageGroup?: string): Promise<Pathology[]>;
  getUserPathologies(userId: string, ageGroup?: string): Promise<Pathology[]>;
  searchPathologies(query: string, userId?: string): Promise<Pathology[]>;
  getPathology(id: number): Promise<Pathology | undefined>;
  getPathologyByNameAndAgeGroup(name: string, ageGroup: string): Promise<Pathology | undefined>;
  createPathology(item: InsertPathology): Promise<Pathology>;
  createPathologiesBulk(items: InsertPathology[]): Promise<Pathology[]>;
  duplicatePathologyToAgeGroup(id: number, targetAgeGroup: string): Promise<Pathology | null>;
  updatePathology(id: number, item: UpdatePathologyRequest): Promise<Pathology>;
  deletePathology(id: number): Promise<void>;

  // Pathology Medications
  getPathologyMedications(pathologyId: number): Promise<PathologyMedication[]>;
  getPathologyMedicationById(id: number): Promise<PathologyMedication | undefined>;
  createPathologyMedication(item: InsertPathologyMedication): Promise<PathologyMedication>;
  updatePathologyMedication(id: number, item: UpdatePathologyMedicationRequest): Promise<PathologyMedication>;
  deletePathologyMedication(id: number): Promise<void>;

  // Patient History
  getPatientHistory(userId: string): Promise<PatientHistory[]>;
  searchPatientHistory(userId: string, patientName: string): Promise<PatientHistory[]>;
  createPatientHistory(item: InsertPatientHistory): Promise<PatientHistory>;
  deletePatientHistory(id: number): Promise<void>;

  // Calculator Settings
  getCalculatorSettings(): Promise<CalculatorSetting[]>;
  createCalculatorSetting(item: InsertCalculatorSetting): Promise<CalculatorSetting>;
  updateCalculatorSetting(id: number, item: UpdateCalculatorSettingRequest): Promise<CalculatorSetting>;
  deleteCalculatorSetting(id: number): Promise<void>;

  // Medications Library
  getMedications(ageGroup?: string): Promise<Medication[]>;
  searchMedications(query: string): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(item: InsertMedication): Promise<Medication>;
  updateMedication(id: number, item: Partial<InsertMedication>): Promise<Medication>;
  deleteMedication(id: number): Promise<void>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  // Drug Interactions
  getDrugInteractions(): Promise<DrugInteraction[]>;
  checkDrugInteraction(drug1: string, drug2: string): Promise<DrugInteraction | undefined>;
  createDrugInteraction(item: InsertDrugInteraction): Promise<DrugInteraction>;
  updateDrugInteraction(id: number, item: Partial<InsertDrugInteraction>): Promise<DrugInteraction>;
  deleteDrugInteraction(id: number): Promise<void>;

  // Medication Contraindications
  getMedicationContraindications(medicationName?: string): Promise<MedicationContraindication[]>;
  createMedicationContraindication(item: InsertMedicationContraindication): Promise<MedicationContraindication>;
  updateMedicationContraindication(id: number, item: Partial<InsertMedicationContraindication>): Promise<MedicationContraindication>;
  deleteMedicationContraindication(id: number): Promise<void>;

  // Promo Coupons
  getPromoCoupons(): Promise<PromoCoupon[]>;
  getPromoCouponByCode(code: string): Promise<PromoCoupon | undefined>;
  createPromoCoupon(item: InsertPromoCoupon): Promise<PromoCoupon>;
  updatePromoCoupon(id: number, item: Partial<InsertPromoCoupon>): Promise<PromoCoupon>;
  deletePromoCoupon(id: number): Promise<void>;
  useCoupon(couponId: number, userId: string): Promise<CouponUsage>;

  // Prescription Favorites
  getPrescriptionFavorites(userId: string): Promise<PrescriptionFavorite[]>;
  getPrescriptionFavorite(id: number): Promise<PrescriptionFavorite | undefined>;
  getPrescriptionFavoriteByToken(token: string): Promise<PrescriptionFavorite | undefined>;
  createPrescriptionFavorite(item: InsertPrescriptionFavorite): Promise<PrescriptionFavorite>;
  updatePrescriptionFavorite(id: number, item: Partial<InsertPrescriptionFavorite>): Promise<PrescriptionFavorite>;
  deletePrescriptionFavorite(id: number): Promise<void>;

  // Prescription Suggestions (Internal AI - no external API)
  searchPrescriptionSuggestions(params: {
    diagnosis?: string;
    ageGroup?: string;
    userId?: string;
  }): Promise<Array<Prescription & { relevanceScore: number }>>;

  // Evolution Models
  getEvolutionModels(userId?: string, category?: string): Promise<EvolutionModel[]>;
  createEvolutionModel(item: InsertEvolutionModel): Promise<EvolutionModel>;
  updateEvolutionModel(id: number, item: Partial<InsertEvolutionModel>): Promise<EvolutionModel>;
  deleteEvolutionModel(id: number): Promise<void>;

  // Physical Exam Templates
  getPhysicalExamTemplates(userId?: string): Promise<PhysicalExamTemplate[]>;
  createPhysicalExamTemplate(item: InsertPhysicalExamTemplate): Promise<PhysicalExamTemplate>;
  updatePhysicalExamTemplate(id: number, item: Partial<InsertPhysicalExamTemplate>): Promise<PhysicalExamTemplate>;
  deletePhysicalExamTemplate(id: number): Promise<void>;

  // Signs and Symptoms
  getSignsSymptoms(userId?: string, category?: string): Promise<SignsSymptoms[]>;
  createSignsSymptoms(item: InsertSignsSymptoms): Promise<SignsSymptoms>;
  updateSignsSymptoms(id: number, item: Partial<InsertSignsSymptoms>): Promise<SignsSymptoms>;
  deleteSignsSymptoms(id: number): Promise<void>;

  // Semiological Signs
  getSemiologicalSigns(userId?: string, category?: string): Promise<SemiologicalSigns[]>;
  createSemiologicalSigns(item: InsertSemiologicalSigns): Promise<SemiologicalSigns>;
  updateSemiologicalSigns(id: number, item: Partial<InsertSemiologicalSigns>): Promise<SemiologicalSigns>;
  deleteSemiologicalSigns(id: number): Promise<void>;

  // Medical Certificates
  getMedicalCertificates(userId: string): Promise<MedicalCertificate[]>;
  createMedicalCertificate(item: InsertMedicalCertificate): Promise<MedicalCertificate>;
  deleteMedicalCertificate(id: number): Promise<void>;

  // Attendance Declarations
  getAttendanceDeclarations(userId: string): Promise<AttendanceDeclaration[]>;
  createAttendanceDeclaration(item: InsertAttendanceDeclaration): Promise<AttendanceDeclaration>;
  deleteAttendanceDeclaration(id: number): Promise<void>;

  // Medical Referrals
  getMedicalReferrals(userId: string): Promise<MedicalReferral[]>;
  createMedicalReferral(item: InsertMedicalReferral): Promise<MedicalReferral>;
  deleteMedicalReferral(id: number): Promise<void>;

  // Referral Destinations
  getReferralDestinations(): Promise<ReferralDestination[]>;
  createReferralDestination(item: InsertReferralDestination): Promise<ReferralDestination>;
  updateReferralDestination(id: number, item: Partial<InsertReferralDestination>): Promise<ReferralDestination>;
  deleteReferralDestination(id: number): Promise<void>;

  // Referral Reasons
  getReferralReasons(): Promise<ReferralReason[]>;
  createReferralReason(item: InsertReferralReason): Promise<ReferralReason>;
  updateReferralReason(id: number, item: Partial<InsertReferralReason>): Promise<ReferralReason>;
  deleteReferralReason(id: number): Promise<void>;

  // Monthly Expenses
  getMonthlyExpenses(userId: string): Promise<MonthlyExpense[]>;
  createMonthlyExpense(item: InsertMonthlyExpense): Promise<MonthlyExpense>;
  updateMonthlyExpense(id: number, item: Partial<InsertMonthlyExpense>): Promise<MonthlyExpense>;
  deleteMonthlyExpense(id: number): Promise<void>;

  // Financial Goals
  getFinancialGoals(userId: string): Promise<FinancialGoal[]>;
  createFinancialGoal(item: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, item: Partial<InsertFinancialGoal>): Promise<FinancialGoal>;
  deleteFinancialGoal(id: number): Promise<void>;

  // Plans
  getPlans(): Promise<Plan[]>;
  getActivePlan(): Promise<Plan | undefined>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(item: InsertPlan): Promise<Plan>;
  updatePlan(id: number, item: Partial<InsertPlan>): Promise<Plan>;

  // Subscriptions
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(item: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, item: Partial<InsertSubscription>): Promise<Subscription>;

  // Payments
  getUserPayments(userId: string): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByProviderId(providerPaymentId: string): Promise<Payment | undefined>;
  createPayment(item: InsertPayment): Promise<Payment>;
  updatePayment(id: number, item: Partial<InsertPayment>): Promise<Payment>;
}

export class DatabaseStorage implements IStorage {
  // Prescriptions
  async getPrescriptions(userId?: string, ageGroup?: string): Promise<Prescription[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    } else {
      conditions.push(eq(prescriptions.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(prescriptions.ageGroup, ageGroup));
    }
    
    return await db.select().from(prescriptions)
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt));
  }

  async searchPrescriptions(query: string, userId?: string): Promise<Prescription[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(prescriptions.title, searchPattern),
        ilike(prescriptions.medication, searchPattern),
        ilike(prescriptions.category, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    }
    
    return await db.select().from(prescriptions)
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [item] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return item;
  }

  async createPrescription(insertItem: InsertPrescription): Promise<Prescription> {
    const [item] = await db.insert(prescriptions).values(insertItem).returning();
    return item;
  }

  async updatePrescription(id: number, updateItem: UpdatePrescriptionRequest): Promise<Prescription> {
    const [item] = await db.update(prescriptions).set(updateItem).where(eq(prescriptions.id, id)).returning();
    return item;
  }

  async deletePrescription(id: number): Promise<void> {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
  }

  // Protocols
  async getProtocols(userId?: string, ageGroup?: string): Promise<Protocol[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(protocols.isPublic, true), eq(protocols.userId, userId)));
    } else {
      conditions.push(eq(protocols.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(protocols.ageGroup, ageGroup));
    }
    
    return await db.select().from(protocols)
      .where(and(...conditions))
      .orderBy(desc(protocols.createdAt));
  }

  async searchProtocols(query: string, userId?: string): Promise<Protocol[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(protocols.title, searchPattern),
        ilike(protocols.description, searchPattern),
        ilike(protocols.specialty, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(protocols.isPublic, true), eq(protocols.userId, userId)));
    }
    
    return await db.select().from(protocols)
      .where(and(...conditions))
      .orderBy(desc(protocols.createdAt));
  }

  async getProtocol(id: number): Promise<Protocol | undefined> {
    const [item] = await db.select().from(protocols).where(eq(protocols.id, id));
    return item;
  }

  async createProtocol(insertItem: InsertProtocol): Promise<Protocol> {
    const [item] = await db.insert(protocols).values(insertItem).returning();
    return item;
  }

  async updateProtocol(id: number, updateItem: UpdateProtocolRequest): Promise<Protocol> {
    const [item] = await db.update(protocols).set({ ...updateItem, updatedAt: new Date() }).where(eq(protocols.id, id)).returning();
    return item;
  }

  async deleteProtocol(id: number): Promise<void> {
    await db.delete(protocols).where(eq(protocols.id, id));
  }

  // Checklists
  async getChecklists(userId?: string, ageGroup?: string): Promise<Checklist[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(or(eq(checklists.isPublic, true), eq(checklists.userId, userId)));
    } else {
      conditions.push(eq(checklists.isPublic, true));
    }
    
    if (ageGroup) {
      conditions.push(eq(checklists.ageGroup, ageGroup));
    }
    
    return await db.select().from(checklists)
      .where(and(...conditions))
      .orderBy(desc(checklists.createdAt));
  }

  async searchChecklists(query: string, userId?: string): Promise<Checklist[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(checklists.title, searchPattern),
        ilike(checklists.category, searchPattern),
        ilike(checklists.specialty, searchPattern)
      )
    ];
    
    if (userId) {
      conditions.push(or(eq(checklists.isPublic, true), eq(checklists.userId, userId)));
    }
    
    return await db.select().from(checklists)
      .where(and(...conditions))
      .orderBy(desc(checklists.createdAt));
  }

  async getChecklist(id: number): Promise<Checklist | undefined> {
    const [item] = await db.select().from(checklists).where(eq(checklists.id, id));
    return item;
  }

  async createChecklist(insertItem: InsertChecklist): Promise<Checklist> {
    const [item] = await db.insert(checklists).values(insertItem).returning();
    return item;
  }

  async updateChecklist(id: number, updateItem: UpdateChecklistRequest): Promise<Checklist> {
    const [item] = await db.update(checklists).set(updateItem).where(eq(checklists.id, id)).returning();
    return item;
  }

  async deleteChecklist(id: number): Promise<void> {
    await db.delete(checklists).where(eq(checklists.id, id));
  }

  // Flashcards
  async getFlashcards(userId?: string): Promise<Flashcard[]> {
    if (userId) {
      return await db.select().from(flashcards)
        .where(or(eq(flashcards.isPublic, true), eq(flashcards.userId, userId)))
        .orderBy(desc(flashcards.createdAt));
    }
    return await db.select().from(flashcards).where(eq(flashcards.isPublic, true)).orderBy(desc(flashcards.createdAt));
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [item] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return item;
  }

  async createFlashcard(insertItem: InsertFlashcard): Promise<Flashcard> {
    const [item] = await db.insert(flashcards).values(insertItem).returning();
    return item;
  }

  async updateFlashcard(id: number, updateItem: UpdateFlashcardRequest): Promise<Flashcard> {
    const [item] = await db.update(flashcards).set(updateItem).where(eq(flashcards.id, id)).returning();
    return item;
  }

  async deleteFlashcard(id: number): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async addFavorite(item: InsertFavorite): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values(item).returning();
    return fav;
  }

  async removeFavorite(userId: string, itemType: string, itemId: number): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.itemType, itemType), eq(favorites.itemId, itemId))
    );
  }

  // Admin Settings
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [item] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return item;
  }

  async setAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(key);
    if (existing) {
      const [item] = await db.update(adminSettings).set({ value, updatedAt: new Date() }).where(eq(adminSettings.key, key)).returning();
      return item;
    }
    const [item] = await db.insert(adminSettings).values({ key, value }).returning();
    return item;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  // Doctor Profiles
  async getDoctorProfile(userId: string): Promise<DoctorProfile | undefined> {
    const [item] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
    return item;
  }

  async upsertDoctorProfile(item: InsertDoctorProfile): Promise<DoctorProfile> {
    const existing = await this.getDoctorProfile(item.userId);
    if (existing) {
      const [updated] = await db.update(doctorProfiles)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(doctorProfiles.userId, item.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(doctorProfiles).values(item).returning();
    return created;
  }

  // Interconsult Messages
  async getInterconsultMessages(userId: string, channel?: string): Promise<InterconsultMessage[]> {
    const conditions = [
      or(eq(interconsultMessages.senderId, userId), eq(interconsultMessages.receiverId, userId))
    ];
    if (channel) {
      conditions.push(eq(interconsultMessages.channel, channel));
    }
    return await db.select().from(interconsultMessages)
      .where(and(...conditions))
      .orderBy(desc(interconsultMessages.createdAt));
  }

  async createInterconsultMessage(item: InsertInterconsultMessage): Promise<InterconsultMessage> {
    const [msg] = await db.insert(interconsultMessages).values(item).returning();
    return msg;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(interconsultMessages).set({ isRead: true }).where(eq(interconsultMessages.id, id));
  }

  // Usage Stats
  async logUsage(item: InsertUsageStat): Promise<void> {
    await db.insert(usageStats).values(item);
  }

  async getUsageStats(days: number = 30): Promise<{ action: string; count: number }[]> {
    const result = await db.select({
      action: usageStats.action,
      count: sql<number>`count(*)::int`
    }).from(usageStats)
      .groupBy(usageStats.action);
    return result;
  }

  // Shifts
  async getShifts(userId: string): Promise<Shift[]> {
    return await db.select().from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.date));
  }

  async getShift(id: number): Promise<Shift | undefined> {
    const [item] = await db.select().from(shifts).where(eq(shifts.id, id));
    return item;
  }

  async createShift(insertItem: InsertShift): Promise<Shift> {
    const [item] = await db.insert(shifts).values(insertItem).returning();
    return item;
  }

  async updateShift(id: number, updateItem: UpdateShiftRequest): Promise<Shift> {
    const [item] = await db.update(shifts).set(updateItem).where(eq(shifts.id, id)).returning();
    return item;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[], monthlyGoal: number | null }> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const userShifts = await db.select().from(shifts).where(eq(shifts.userId, userId));
    const userGoal = await this.getGoal(userId, currentMonth);
    
    let totalEarnings = 0;
    let totalHours = 0;
    const upcomingShifts: Shift[] = [];

    for (const shift of userShifts) {
      if (shift.value) {
        totalEarnings += Number(shift.value);
      }
      if (new Date(shift.date) >= now) {
        upcomingShifts.push(shift);
      }
      if (shift.type?.includes('12')) {
        totalHours += 12;
      } else if (shift.type?.includes('24')) {
        totalHours += 24;
      } else if (shift.type?.includes('6')) {
        totalHours += 6;
      }
    }

    upcomingShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
      totalEarnings, 
      totalHours, 
      upcomingShifts,
      monthlyGoal: userGoal ? Number(userGoal.targetAmount) : null
    };
  }

  // Notes
  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [item] = await db.select().from(notes).where(eq(notes.id, id));
    return item;
  }

  async createNote(insertItem: InsertNote): Promise<Note> {
    const [item] = await db.insert(notes).values(insertItem).returning();
    return item;
  }

  async updateNote(id: number, updateItem: UpdateNoteRequest): Promise<Note> {
    const [item] = await db.update(notes).set(updateItem).where(eq(notes.id, id)).returning();
    return item;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [item] = await db.select().from(tasks).where(eq(tasks.id, id));
    return item;
  }

  async createTask(insertItem: InsertTask): Promise<Task> {
    const [item] = await db.insert(tasks).values(insertItem).returning();
    return item;
  }

  async updateTask(id: number, updateItem: Partial<InsertTask>): Promise<Task> {
    const [item] = await db.update(tasks).set(updateItem).where(eq(tasks.id, id)).returning();
    return item;
  }

  async toggleTask(id: number): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) throw new Error("Task not found");
    
    const isCompleted = !task.isCompleted;
    const [item] = await db.update(tasks).set({ 
      isCompleted,
      completedAt: isCompleted ? new Date() : null 
    }).where(eq(tasks.id, id)).returning();
    return item;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Library
  async getLibraryCategories(): Promise<LibraryCategory[]> {
    return await db.select().from(libraryCategories).orderBy(libraryCategories.order);
  }

  async createLibraryCategory(insertItem: InsertLibraryCategory): Promise<LibraryCategory> {
    const [item] = await db.insert(libraryCategories).values(insertItem).returning();
    return item;
  }

  async getLibraryItems(categoryId: number): Promise<LibraryItem[]> {
    return await db.select().from(libraryItems).where(eq(libraryItems.categoryId, categoryId)).orderBy(libraryItems.order);
  }

  async createLibraryItem(insertItem: InsertLibraryItem): Promise<LibraryItem> {
    const [item] = await db.insert(libraryItems).values(insertItem).returning();
    return item;
  }

  // Handovers
  async getHandovers(userId: string): Promise<Handover[]> {
    return await db.select().from(handovers).where(eq(handovers.userId, userId)).orderBy(desc(handovers.createdAt));
  }

  async getHandover(id: number): Promise<Handover | undefined> {
    const [item] = await db.select().from(handovers).where(eq(handovers.id, id));
    return item;
  }

  async createHandover(insertItem: InsertHandover): Promise<Handover> {
    const [item] = await db.insert(handovers).values(insertItem).returning();
    return item;
  }

  async updateHandover(id: number, updateItem: UpdateHandoverRequest): Promise<Handover> {
    const [item] = await db.update(handovers).set(updateItem).where(eq(handovers.id, id)).returning();
    return item;
  }

  async deleteHandover(id: number): Promise<void> {
    await db.delete(handovers).where(eq(handovers.id, id));
  }

  // Goals
  async getGoal(userId: string, month: string): Promise<Goal | undefined> {
    const [item] = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.month, month)));
    return item;
  }

  async setGoal(insertItem: InsertGoal): Promise<Goal> {
    const existing = await this.getGoal(insertItem.userId, insertItem.month);
    if (existing) {
       const [updated] = await db.update(goals).set({ targetAmount: insertItem.targetAmount }).where(eq(goals.id, existing.id)).returning();
       return updated;
    }
    const [item] = await db.insert(goals).values(insertItem).returning();
    return item;
  }

  // Pathologies
  async getPathologies(userId?: string, ageGroup?: string): Promise<Pathology[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(pathologies.isPublic, true), eq(pathologies.userId, userId)));
    } else {
      conditions.push(eq(pathologies.isPublic, true));
    }
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async getPublicPathologies(ageGroup?: string): Promise<Pathology[]> {
    const conditions = [eq(pathologies.isPublic, true)];
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.clinicalCategory, pathologies.name);
  }

  async getUserPathologies(userId: string, ageGroup?: string): Promise<Pathology[]> {
    const conditions = [
      eq(pathologies.userId, userId),
      eq(pathologies.isPublic, false)
    ];
    if (ageGroup) {
      conditions.push(eq(pathologies.ageGroup, ageGroup));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async searchPathologies(query: string, userId?: string): Promise<Pathology[]> {
    const searchPattern = `%${query}%`;
    const conditions = [or(ilike(pathologies.name, searchPattern), ilike(pathologies.category, searchPattern))];
    if (userId) {
      conditions.push(or(eq(pathologies.isPublic, true), eq(pathologies.userId, userId)));
    }
    return await db.select().from(pathologies).where(and(...conditions)).orderBy(pathologies.name);
  }

  async getPathology(id: number): Promise<Pathology | undefined> {
    const [item] = await db.select().from(pathologies).where(eq(pathologies.id, id));
    return item;
  }

  async getPathologyByNameAndAgeGroup(name: string, ageGroup: string): Promise<Pathology | undefined> {
    const [item] = await db.select().from(pathologies).where(
      and(eq(pathologies.name, name), eq(pathologies.ageGroup, ageGroup))
    );
    return item;
  }

  async createPathology(insertItem: InsertPathology): Promise<Pathology> {
    const [item] = await db.insert(pathologies).values(insertItem).returning();
    return item;
  }

  async createPathologiesBulk(items: InsertPathology[]): Promise<Pathology[]> {
    if (items.length === 0) return [];
    const inserted = await db.insert(pathologies).values(items).returning();
    return inserted;
  }

  async duplicatePathologyToAgeGroup(id: number, targetAgeGroup: string): Promise<Pathology | null> {
    const original = await this.getPathology(id);
    if (!original) return null;
    
    const existing = await this.getPathologyByNameAndAgeGroup(original.name, targetAgeGroup);
    if (existing) return null;
    
    const sourceGroup = targetAgeGroup === 'adulto' ? 'duplicado_de_pediatrico' : 'duplicado_de_adulto';
    const newPathology: InsertPathology = {
      name: original.name,
      description: original.description,
      ageGroup: targetAgeGroup,
      clinicalCategory: original.clinicalCategory,
      sourceGroup: sourceGroup,
      category: original.category,
      specialty: original.specialty,
      tags: original.tags,
      isPublic: original.isPublic,
      isLocked: original.isLocked,
      userId: original.userId,
    };
    
    return await this.createPathology(newPathology);
  }

  async updatePathology(id: number, updateItem: UpdatePathologyRequest): Promise<Pathology> {
    const [item] = await db.update(pathologies).set(updateItem).where(eq(pathologies.id, id)).returning();
    return item;
  }

  async deletePathology(id: number): Promise<void> {
    await db.delete(pathologyMedications).where(eq(pathologyMedications.pathologyId, id));
    await db.delete(pathologies).where(eq(pathologies.id, id));
  }

  // Pathology Medications
  async getPathologyMedications(pathologyId: number): Promise<PathologyMedication[]> {
    return await db.select().from(pathologyMedications).where(eq(pathologyMedications.pathologyId, pathologyId)).orderBy(pathologyMedications.order);
  }

  async getPathologyMedicationById(id: number): Promise<PathologyMedication | undefined> {
    const [item] = await db.select().from(pathologyMedications).where(eq(pathologyMedications.id, id));
    return item;
  }

  async createPathologyMedication(insertItem: InsertPathologyMedication): Promise<PathologyMedication> {
    const [item] = await db.insert(pathologyMedications).values(insertItem).returning();
    return item;
  }

  async updatePathologyMedication(id: number, updateItem: UpdatePathologyMedicationRequest): Promise<PathologyMedication> {
    const [item] = await db.update(pathologyMedications).set(updateItem).where(eq(pathologyMedications.id, id)).returning();
    return item;
  }

  async deletePathologyMedication(id: number): Promise<void> {
    await db.delete(pathologyMedications).where(eq(pathologyMedications.id, id));
  }

  // Patient History
  async getPatientHistory(userId: string): Promise<PatientHistory[]> {
    return await db.select().from(patientHistory).where(eq(patientHistory.userId, userId)).orderBy(desc(patientHistory.createdAt));
  }

  async searchPatientHistory(userId: string, patientName: string): Promise<PatientHistory[]> {
    return await db.select().from(patientHistory).where(and(eq(patientHistory.userId, userId), ilike(patientHistory.patientName, `%${patientName}%`))).orderBy(desc(patientHistory.createdAt));
  }

  async createPatientHistory(insertItem: InsertPatientHistory): Promise<PatientHistory> {
    const [item] = await db.insert(patientHistory).values(insertItem).returning();
    return item;
  }

  async deletePatientHistory(id: number): Promise<void> {
    await db.delete(patientHistory).where(eq(patientHistory.id, id));
  }

  // Calculator Settings
  async getCalculatorSettings(): Promise<CalculatorSetting[]> {
    return await db.select().from(calculatorSettings).where(eq(calculatorSettings.isActive, true)).orderBy(calculatorSettings.medication);
  }

  async createCalculatorSetting(insertItem: InsertCalculatorSetting): Promise<CalculatorSetting> {
    const [item] = await db.insert(calculatorSettings).values(insertItem).returning();
    return item;
  }

  async updateCalculatorSetting(id: number, updateItem: UpdateCalculatorSettingRequest): Promise<CalculatorSetting> {
    const [item] = await db.update(calculatorSettings).set(updateItem).where(eq(calculatorSettings.id, id)).returning();
    return item;
  }

  async deleteCalculatorSetting(id: number): Promise<void> {
    await db.delete(calculatorSettings).where(eq(calculatorSettings.id, id));
  }

  // Medications Library
  async getMedications(ageGroup?: string): Promise<Medication[]> {
    const conditions = [eq(medications.isActive, true)];
    if (ageGroup) {
      conditions.push(eq(medications.ageGroup, ageGroup));
    }
    return await db.select().from(medications).where(and(...conditions)).orderBy(medications.name);
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(medications)
      .where(and(
        eq(medications.isActive, true),
        or(ilike(medications.name, searchPattern), ilike(medications.category, searchPattern))
      ))
      .orderBy(medications.name);
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [item] = await db.select().from(medications).where(eq(medications.id, id));
    return item;
  }

  async createMedication(insertItem: InsertMedication): Promise<Medication> {
    const [item] = await db.insert(medications).values(insertItem).returning();
    return item;
  }

  async updateMedication(id: number, updateItem: Partial<InsertMedication>): Promise<Medication> {
    const [item] = await db.update(medications).set(updateItem).where(eq(medications.id, id)).returning();
    return item;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [item] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return item;
  }

  async upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const [item] = await db.update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return item;
    } else {
      const [item] = await db.insert(userPreferences)
        .values({ userId, ...prefs })
        .returning();
      return item;
    }
  }

  // Drug Interactions
  async getDrugInteractions(): Promise<DrugInteraction[]> {
    return await db.select().from(drugInteractions).where(eq(drugInteractions.isActive, true)).orderBy(drugInteractions.drug1);
  }

  async checkDrugInteraction(drug1: string, drug2: string): Promise<DrugInteraction | undefined> {
    const d1Lower = drug1.toLowerCase();
    const d2Lower = drug2.toLowerCase();
    const [item] = await db.select().from(drugInteractions)
      .where(and(
        eq(drugInteractions.isActive, true),
        or(
          and(ilike(drugInteractions.drug1, d1Lower), ilike(drugInteractions.drug2, d2Lower)),
          and(ilike(drugInteractions.drug1, d2Lower), ilike(drugInteractions.drug2, d1Lower))
        )
      ));
    return item;
  }

  async createDrugInteraction(insertItem: InsertDrugInteraction): Promise<DrugInteraction> {
    const [item] = await db.insert(drugInteractions).values(insertItem).returning();
    return item;
  }

  async updateDrugInteraction(id: number, updateItem: Partial<InsertDrugInteraction>): Promise<DrugInteraction> {
    const [item] = await db.update(drugInteractions).set(updateItem).where(eq(drugInteractions.id, id)).returning();
    return item;
  }

  async deleteDrugInteraction(id: number): Promise<void> {
    await db.delete(drugInteractions).where(eq(drugInteractions.id, id));
  }

  // Medication Contraindications
  async getMedicationContraindications(medicationName?: string): Promise<MedicationContraindication[]> {
    if (medicationName) {
      return await db.select().from(medicationContraindications)
        .where(and(
          eq(medicationContraindications.isActive, true),
          ilike(medicationContraindications.medicationName, medicationName)
        ))
        .orderBy(medicationContraindications.medicationName);
    }
    return await db.select().from(medicationContraindications)
      .where(eq(medicationContraindications.isActive, true))
      .orderBy(medicationContraindications.medicationName);
  }

  async createMedicationContraindication(insertItem: InsertMedicationContraindication): Promise<MedicationContraindication> {
    const [item] = await db.insert(medicationContraindications).values(insertItem).returning();
    return item;
  }

  async updateMedicationContraindication(id: number, updateItem: Partial<InsertMedicationContraindication>): Promise<MedicationContraindication> {
    const [item] = await db.update(medicationContraindications).set(updateItem).where(eq(medicationContraindications.id, id)).returning();
    return item;
  }

  async deleteMedicationContraindication(id: number): Promise<void> {
    await db.delete(medicationContraindications).where(eq(medicationContraindications.id, id));
  }

  // Promo Coupons
  async getPromoCoupons(): Promise<PromoCoupon[]> {
    return await db.select().from(promoCoupons).orderBy(desc(promoCoupons.createdAt));
  }

  async getPromoCouponByCode(code: string): Promise<PromoCoupon | undefined> {
    const [item] = await db.select().from(promoCoupons).where(eq(promoCoupons.code, code.toUpperCase()));
    return item;
  }

  async createPromoCoupon(insertItem: InsertPromoCoupon): Promise<PromoCoupon> {
    const [item] = await db.insert(promoCoupons).values({
      ...insertItem,
      code: insertItem.code.toUpperCase()
    }).returning();
    return item;
  }

  async updatePromoCoupon(id: number, updateItem: Partial<InsertPromoCoupon>): Promise<PromoCoupon> {
    const [item] = await db.update(promoCoupons).set({
      ...updateItem,
      ...(updateItem.code ? { code: updateItem.code.toUpperCase() } : {})
    }).where(eq(promoCoupons.id, id)).returning();
    return item;
  }

  async deletePromoCoupon(id: number): Promise<void> {
    await db.delete(couponUsages).where(eq(couponUsages.couponId, id));
    await db.delete(promoCoupons).where(eq(promoCoupons.id, id));
  }

  async useCoupon(couponId: number, userId: string): Promise<CouponUsage> {
    const [usage] = await db.insert(couponUsages).values({ couponId, userId }).returning();
    await db.update(promoCoupons).set({ 
      currentUses: sql`${promoCoupons.currentUses} + 1` 
    }).where(eq(promoCoupons.id, couponId));
    return usage;
  }

  // Prescription Favorites
  async getPrescriptionFavorites(userId: string): Promise<PrescriptionFavorite[]> {
    return await db.select().from(prescriptionFavorites)
      .where(eq(prescriptionFavorites.userId, userId))
      .orderBy(desc(prescriptionFavorites.createdAt));
  }

  async getPrescriptionFavorite(id: number): Promise<PrescriptionFavorite | undefined> {
    const [item] = await db.select().from(prescriptionFavorites).where(eq(prescriptionFavorites.id, id));
    return item;
  }

  async getPrescriptionFavoriteByToken(token: string): Promise<PrescriptionFavorite | undefined> {
    const [item] = await db.select().from(prescriptionFavorites).where(eq(prescriptionFavorites.exportToken, token));
    return item;
  }

  async createPrescriptionFavorite(insertItem: InsertPrescriptionFavorite): Promise<PrescriptionFavorite> {
    const [item] = await db.insert(prescriptionFavorites).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionFavorite(id: number, updateItem: Partial<InsertPrescriptionFavorite>): Promise<PrescriptionFavorite> {
    const [item] = await db.update(prescriptionFavorites).set({ ...updateItem, updatedAt: new Date() }).where(eq(prescriptionFavorites.id, id)).returning();
    return item;
  }

  async deletePrescriptionFavorite(id: number): Promise<void> {
    await db.delete(prescriptionFavorites).where(eq(prescriptionFavorites.id, id));
  }

  // Prescription Suggestions (Internal AI - uses existing data only)
  async searchPrescriptionSuggestions(params: {
    diagnosis?: string;
    ageGroup?: string;
    userId?: string;
  }): Promise<Array<Prescription & { relevanceScore: number }>> {
    const { diagnosis, ageGroup, userId } = params;
    
    // Build base conditions for access control
    const accessConditions = [];
    if (userId) {
      accessConditions.push(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)));
    } else {
      accessConditions.push(eq(prescriptions.isPublic, true));
    }
    
    // Filter by age group if provided
    if (ageGroup) {
      accessConditions.push(eq(prescriptions.ageGroup, ageGroup));
    }
    
    // Get all accessible prescriptions
    const allPrescriptions = await db.select().from(prescriptions)
      .where(and(...accessConditions))
      .orderBy(desc(prescriptions.createdAt));
    
    // If no diagnosis search term, return all with neutral score
    if (!diagnosis || diagnosis.trim() === "") {
      return allPrescriptions.map(p => ({ ...p, relevanceScore: 50 }));
    }
    
    // Score and rank by relevance to diagnosis
    const searchTerms = diagnosis.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = allPrescriptions.map(p => {
      let score = 0;
      const titleLower = (p.title || "").toLowerCase();
      const categoryLower = (p.category || "").toLowerCase();
      const medicationLower = (p.medication || "").toLowerCase();
      const specialtyLower = (p.specialty || "").toLowerCase();
      const tagsLower = (p.tags || []).map(t => t.toLowerCase());
      
      for (const term of searchTerms) {
        // Exact match in title (highest weight)
        if (titleLower.includes(term)) score += 40;
        // Category match
        if (categoryLower.includes(term)) score += 30;
        // Medication match
        if (medicationLower.includes(term)) score += 25;
        // Specialty match
        if (specialtyLower.includes(term)) score += 20;
        // Tags match
        if (tagsLower.some(tag => tag.includes(term))) score += 15;
      }
      
      // Bonus for official/public prescriptions
      if (p.isPublic) score += 10;
      
      return { ...p, relevanceScore: Math.min(score, 100) };
    });
    
    // Filter out zero-score results and sort by relevance
    return scored
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Evolution Models
  async getEvolutionModel(id: number): Promise<EvolutionModel | undefined> {
    const [item] = await db.select().from(evolutionModels).where(eq(evolutionModels.id, id));
    return item;
  }

  async getEvolutionModels(userId?: string, category?: string): Promise<EvolutionModel[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(evolutionModels.isPublic, true), eq(evolutionModels.userId, userId)));
    } else {
      conditions.push(eq(evolutionModels.isPublic, true));
    }
    if (category) {
      conditions.push(eq(evolutionModels.category, category));
    }
    return await db.select().from(evolutionModels)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(evolutionModels.createdAt));
  }

  async createEvolutionModel(insertItem: InsertEvolutionModel): Promise<EvolutionModel> {
    const [item] = await db.insert(evolutionModels).values(insertItem).returning();
    return item;
  }

  async updateEvolutionModel(id: number, updateItem: Partial<InsertEvolutionModel>): Promise<EvolutionModel> {
    const [item] = await db.update(evolutionModels).set(updateItem).where(eq(evolutionModels.id, id)).returning();
    return item;
  }

  async deleteEvolutionModel(id: number): Promise<void> {
    await db.delete(evolutionModels).where(eq(evolutionModels.id, id));
  }

  // Physical Exam Templates
  async getPhysicalExamTemplate(id: number): Promise<PhysicalExamTemplate | undefined> {
    const [item] = await db.select().from(physicalExamTemplates).where(eq(physicalExamTemplates.id, id));
    return item;
  }

  async getPhysicalExamTemplates(userId?: string): Promise<PhysicalExamTemplate[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(physicalExamTemplates.isPublic, true), eq(physicalExamTemplates.userId, userId)));
    } else {
      conditions.push(eq(physicalExamTemplates.isPublic, true));
    }
    return await db.select().from(physicalExamTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(physicalExamTemplates.order);
  }

  async createPhysicalExamTemplate(insertItem: InsertPhysicalExamTemplate): Promise<PhysicalExamTemplate> {
    const [item] = await db.insert(physicalExamTemplates).values(insertItem).returning();
    return item;
  }

  async updatePhysicalExamTemplate(id: number, updateItem: Partial<InsertPhysicalExamTemplate>): Promise<PhysicalExamTemplate> {
    const [item] = await db.update(physicalExamTemplates).set(updateItem).where(eq(physicalExamTemplates.id, id)).returning();
    return item;
  }

  async deletePhysicalExamTemplate(id: number): Promise<void> {
    await db.delete(physicalExamTemplates).where(eq(physicalExamTemplates.id, id));
  }

  // Signs and Symptoms
  async getSignsSymptoms(userId?: string, category?: string): Promise<SignsSymptoms[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(signsSymptoms.isPublic, true), eq(signsSymptoms.userId, userId)));
    } else {
      conditions.push(eq(signsSymptoms.isPublic, true));
    }
    if (category) {
      conditions.push(eq(signsSymptoms.category, category));
    }
    return await db.select().from(signsSymptoms)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(signsSymptoms.createdAt));
  }

  async createSignsSymptoms(insertItem: InsertSignsSymptoms): Promise<SignsSymptoms> {
    const [item] = await db.insert(signsSymptoms).values(insertItem).returning();
    return item;
  }

  async updateSignsSymptoms(id: number, updateItem: Partial<InsertSignsSymptoms>): Promise<SignsSymptoms> {
    const [item] = await db.update(signsSymptoms).set(updateItem).where(eq(signsSymptoms.id, id)).returning();
    return item;
  }

  async deleteSignsSymptoms(id: number): Promise<void> {
    await db.delete(signsSymptoms).where(eq(signsSymptoms.id, id));
  }

  // Semiological Signs
  async getSemiologicalSigns(userId?: string, category?: string): Promise<SemiologicalSigns[]> {
    const conditions = [];
    if (userId) {
      conditions.push(or(eq(semiologicalSigns.isPublic, true), eq(semiologicalSigns.userId, userId)));
    } else {
      conditions.push(eq(semiologicalSigns.isPublic, true));
    }
    if (category) {
      conditions.push(eq(semiologicalSigns.category, category));
    }
    return await db.select().from(semiologicalSigns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(semiologicalSigns.createdAt));
  }

  async createSemiologicalSigns(insertItem: InsertSemiologicalSigns): Promise<SemiologicalSigns> {
    const [item] = await db.insert(semiologicalSigns).values(insertItem).returning();
    return item;
  }

  async updateSemiologicalSigns(id: number, updateItem: Partial<InsertSemiologicalSigns>): Promise<SemiologicalSigns> {
    const [item] = await db.update(semiologicalSigns).set(updateItem).where(eq(semiologicalSigns.id, id)).returning();
    return item;
  }

  async deleteSemiologicalSigns(id: number): Promise<void> {
    await db.delete(semiologicalSigns).where(eq(semiologicalSigns.id, id));
  }

  // Medical Certificates
  async getMedicalCertificate(id: number): Promise<MedicalCertificate | undefined> {
    const [item] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
    return item;
  }

  async getMedicalCertificates(userId: string): Promise<MedicalCertificate[]> {
    return await db.select().from(medicalCertificates)
      .where(eq(medicalCertificates.userId, userId))
      .orderBy(desc(medicalCertificates.createdAt));
  }

  async createMedicalCertificate(insertItem: InsertMedicalCertificate): Promise<MedicalCertificate> {
    const [item] = await db.insert(medicalCertificates).values(insertItem).returning();
    return item;
  }

  async deleteMedicalCertificate(id: number): Promise<void> {
    await db.delete(medicalCertificates).where(eq(medicalCertificates.id, id));
  }

  // Attendance Declarations
  async getAttendanceDeclaration(id: number): Promise<AttendanceDeclaration | undefined> {
    const [item] = await db.select().from(attendanceDeclarations).where(eq(attendanceDeclarations.id, id));
    return item;
  }

  async getAttendanceDeclarations(userId: string): Promise<AttendanceDeclaration[]> {
    return await db.select().from(attendanceDeclarations)
      .where(eq(attendanceDeclarations.userId, userId))
      .orderBy(desc(attendanceDeclarations.createdAt));
  }

  async createAttendanceDeclaration(insertItem: InsertAttendanceDeclaration): Promise<AttendanceDeclaration> {
    const [item] = await db.insert(attendanceDeclarations).values(insertItem).returning();
    return item;
  }

  async deleteAttendanceDeclaration(id: number): Promise<void> {
    await db.delete(attendanceDeclarations).where(eq(attendanceDeclarations.id, id));
  }

  // Medical Referrals
  async getMedicalReferral(id: number): Promise<MedicalReferral | undefined> {
    const [item] = await db.select().from(medicalReferrals).where(eq(medicalReferrals.id, id));
    return item;
  }

  async getMedicalReferrals(userId: string): Promise<MedicalReferral[]> {
    return await db.select().from(medicalReferrals)
      .where(eq(medicalReferrals.userId, userId))
      .orderBy(desc(medicalReferrals.createdAt));
  }

  async createMedicalReferral(insertItem: InsertMedicalReferral): Promise<MedicalReferral> {
    const [item] = await db.insert(medicalReferrals).values(insertItem).returning();
    return item;
  }

  async deleteMedicalReferral(id: number): Promise<void> {
    await db.delete(medicalReferrals).where(eq(medicalReferrals.id, id));
  }

  // Referral Destinations
  async getReferralDestinations(): Promise<ReferralDestination[]> {
    return await db.select().from(referralDestinations)
      .where(eq(referralDestinations.isActive, true))
      .orderBy(referralDestinations.name);
  }

  async createReferralDestination(insertItem: InsertReferralDestination): Promise<ReferralDestination> {
    const [item] = await db.insert(referralDestinations).values(insertItem).returning();
    return item;
  }

  async updateReferralDestination(id: number, updateItem: Partial<InsertReferralDestination>): Promise<ReferralDestination> {
    const [item] = await db.update(referralDestinations).set(updateItem).where(eq(referralDestinations.id, id)).returning();
    return item;
  }

  async deleteReferralDestination(id: number): Promise<void> {
    await db.delete(referralDestinations).where(eq(referralDestinations.id, id));
  }

  // Referral Reasons
  async getReferralReasons(): Promise<ReferralReason[]> {
    return await db.select().from(referralReasons)
      .where(eq(referralReasons.isActive, true))
      .orderBy(referralReasons.description);
  }

  async createReferralReason(insertItem: InsertReferralReason): Promise<ReferralReason> {
    const [item] = await db.insert(referralReasons).values(insertItem).returning();
    return item;
  }

  async updateReferralReason(id: number, updateItem: Partial<InsertReferralReason>): Promise<ReferralReason> {
    const [item] = await db.update(referralReasons).set(updateItem).where(eq(referralReasons.id, id)).returning();
    return item;
  }

  async deleteReferralReason(id: number): Promise<void> {
    await db.delete(referralReasons).where(eq(referralReasons.id, id));
  }

  // Prescription Models (Official admin-created models)
  async getPrescriptionModels(pathologyId?: number): Promise<PrescriptionModel[]> {
    if (pathologyId) {
      return await db.select().from(prescriptionModels)
        .where(and(eq(prescriptionModels.pathologyId, pathologyId), eq(prescriptionModels.isActive, true)))
        .orderBy(prescriptionModels.order);
    }
    return await db.select().from(prescriptionModels)
      .where(eq(prescriptionModels.isActive, true))
      .orderBy(prescriptionModels.order);
  }

  async getPrescriptionModel(id: number): Promise<PrescriptionModel | undefined> {
    const [item] = await db.select().from(prescriptionModels).where(eq(prescriptionModels.id, id));
    return item;
  }

  async createPrescriptionModel(insertItem: InsertPrescriptionModel): Promise<PrescriptionModel> {
    const [item] = await db.insert(prescriptionModels).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionModel(id: number, updateItem: Partial<InsertPrescriptionModel>): Promise<PrescriptionModel> {
    const [item] = await db.update(prescriptionModels).set(updateItem).where(eq(prescriptionModels.id, id)).returning();
    return item;
  }

  async deletePrescriptionModel(id: number): Promise<void> {
    await db.delete(prescriptionModelMedications).where(eq(prescriptionModelMedications.prescriptionModelId, id));
    await db.delete(prescriptionModels).where(eq(prescriptionModels.id, id));
  }

  // Prescription Model Medications
  async getPrescriptionModelMedications(prescriptionModelId: number): Promise<PrescriptionModelMedication[]> {
    return await db.select().from(prescriptionModelMedications)
      .where(eq(prescriptionModelMedications.prescriptionModelId, prescriptionModelId))
      .orderBy(prescriptionModelMedications.order);
  }

  async createPrescriptionModelMedication(insertItem: InsertPrescriptionModelMedication): Promise<PrescriptionModelMedication> {
    const [item] = await db.insert(prescriptionModelMedications).values(insertItem).returning();
    return item;
  }

  async updatePrescriptionModelMedication(id: number, updateItem: Partial<InsertPrescriptionModelMedication>): Promise<PrescriptionModelMedication> {
    const [item] = await db.update(prescriptionModelMedications).set(updateItem).where(eq(prescriptionModelMedications.id, id)).returning();
    return item;
  }

  async deletePrescriptionModelMedication(id: number): Promise<void> {
    await db.delete(prescriptionModelMedications).where(eq(prescriptionModelMedications.id, id));
  }

  // Monthly Expenses
  async getMonthlyExpenses(userId: string): Promise<MonthlyExpense[]> {
    return await db.select().from(monthlyExpenses)
      .where(eq(monthlyExpenses.userId, userId))
      .orderBy(desc(monthlyExpenses.createdAt));
  }

  async createMonthlyExpense(insertItem: InsertMonthlyExpense): Promise<MonthlyExpense> {
    const [item] = await db.insert(monthlyExpenses).values(insertItem).returning();
    return item;
  }

  async updateMonthlyExpense(id: number, updateItem: Partial<InsertMonthlyExpense>): Promise<MonthlyExpense> {
    const [item] = await db.update(monthlyExpenses).set(updateItem).where(eq(monthlyExpenses.id, id)).returning();
    return item;
  }

  async deleteMonthlyExpense(id: number): Promise<void> {
    await db.delete(monthlyExpenses).where(eq(monthlyExpenses.id, id));
  }

  // Financial Goals
  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    return await db.select().from(financialGoals)
      .where(eq(financialGoals.userId, userId))
      .orderBy(desc(financialGoals.createdAt));
  }

  async createFinancialGoal(insertItem: InsertFinancialGoal): Promise<FinancialGoal> {
    const [item] = await db.insert(financialGoals).values(insertItem).returning();
    return item;
  }

  async updateFinancialGoal(id: number, updateItem: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    const [item] = await db.update(financialGoals).set(updateItem).where(eq(financialGoals.id, id)).returning();
    return item;
  }

  async deleteFinancialGoal(id: number): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  // Plans
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans).orderBy(desc(plans.createdAt));
  }

  async getActivePlan(): Promise<Plan | undefined> {
    const [item] = await db.select().from(plans).where(eq(plans.isActive, true)).limit(1);
    return item;
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [item] = await db.select().from(plans).where(eq(plans.id, id));
    return item;
  }

  async createPlan(insertItem: InsertPlan): Promise<Plan> {
    const [item] = await db.insert(plans).values(insertItem).returning();
    return item;
  }

  async updatePlan(id: number, updateItem: Partial<InsertPlan>): Promise<Plan> {
    const [item] = await db.update(plans).set(updateItem).where(eq(plans.id, id)).returning();
    return item;
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return item;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .limit(1);
    return item;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return item;
  }

  async getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | undefined> {
    const [item] = await db.select().from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId));
    return item;
  }

  async createSubscription(insertItem: InsertSubscription): Promise<Subscription> {
    const [item] = await db.insert(subscriptions).values(insertItem).returning();
    return item;
  }

  async updateSubscription(id: number, updateItem: Partial<InsertSubscription>): Promise<Subscription> {
    const [item] = await db.update(subscriptions).set({
      ...updateItem,
      updatedAt: new Date()
    }).where(eq(subscriptions.id, id)).returning();
    return item;
  }

  // Payments
  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [item] = await db.select().from(payments).where(eq(payments.id, id));
    return item;
  }

  async getPaymentByProviderId(providerPaymentId: string): Promise<Payment | undefined> {
    const [item] = await db.select().from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId));
    return item;
  }

  async createPayment(insertItem: InsertPayment): Promise<Payment> {
    const [item] = await db.insert(payments).values(insertItem).returning();
    return item;
  }

  async updatePayment(id: number, updateItem: Partial<InsertPayment>): Promise<Payment> {
    const [item] = await db.update(payments).set(updateItem).where(eq(payments.id, id)).returning();
    return item;
  }
}

export const storage = new DatabaseStorage();
