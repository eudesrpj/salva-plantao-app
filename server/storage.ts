import { 
  prescriptions, checklists, shifts, notes, libraryCategories, libraryItems, shiftChecklists, handovers, goals,
  protocols, flashcards, favorites, adminSettings, doctorProfiles, interconsultMessages, usageStats,
  pathologies, pathologyMedications, patientHistory, calculatorSettings, medications,
  type Prescription, type InsertPrescription, type UpdatePrescriptionRequest,
  type Checklist, type InsertChecklist, type UpdateChecklistRequest,
  type Shift, type InsertShift, type UpdateShiftRequest,
  type Note, type InsertNote, type UpdateNoteRequest,
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
  type Medication, type InsertMedication
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
  searchPathologies(query: string, userId?: string): Promise<Pathology[]>;
  getPathology(id: number): Promise<Pathology | undefined>;
  createPathology(item: InsertPathology): Promise<Pathology>;
  updatePathology(id: number, item: UpdatePathologyRequest): Promise<Pathology>;
  deletePathology(id: number): Promise<void>;

  // Pathology Medications
  getPathologyMedications(pathologyId: number): Promise<PathologyMedication[]>;
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

  async createPathology(insertItem: InsertPathology): Promise<Pathology> {
    const [item] = await db.insert(pathologies).values(insertItem).returning();
    return item;
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
}

export const storage = new DatabaseStorage();
