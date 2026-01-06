import { 
  prescriptions, checklists, shifts, notes, libraryCategories, libraryItems, shiftChecklists, handovers, goals,
  type Prescription, type InsertPrescription, type UpdatePrescriptionRequest,
  type Checklist, type InsertChecklist, type UpdateChecklistRequest,
  type Shift, type InsertShift, type UpdateShiftRequest,
  type Note, type InsertNote, type UpdateNoteRequest,
  type LibraryCategory, type InsertLibraryCategory, type UpdateLibraryCategoryRequest,
  type LibraryItem, type InsertLibraryItem, type UpdateLibraryItemRequest,
  type ShiftChecklist, type InsertShiftChecklist,
  type Handover, type InsertHandover, type UpdateHandoverRequest,
  type Goal, type InsertGoal, type UpdateGoalRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Prescriptions
  getPrescriptions(userId?: string): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  createPrescription(item: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, item: UpdatePrescriptionRequest): Promise<Prescription>;
  deletePrescription(id: number): Promise<void>;

  // Checklists
  getChecklists(userId?: string): Promise<Checklist[]>;
  getChecklist(id: number): Promise<Checklist | undefined>;
  createChecklist(item: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, item: UpdateChecklistRequest): Promise<Checklist>;
  deleteChecklist(id: number): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
  // Prescriptions
  async getPrescriptions(userId?: string): Promise<Prescription[]> {
    if (userId) {
      return await db.select().from(prescriptions)
        .where(or(eq(prescriptions.isPublic, true), eq(prescriptions.userId, userId)))
        .orderBy(desc(prescriptions.createdAt));
    }
    return await db.select().from(prescriptions).where(eq(prescriptions.isPublic, true)).orderBy(desc(prescriptions.createdAt));
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

  // Checklists
  async getChecklists(userId?: string): Promise<Checklist[]> {
    if (userId) {
      return await db.select().from(checklists)
        .where(or(eq(checklists.isPublic, true), eq(checklists.userId, userId)))
        .orderBy(desc(checklists.createdAt));
    }
    return await db.select().from(checklists).where(eq(checklists.isPublic, true)).orderBy(desc(checklists.createdAt));
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
      if (shift.startTime && shift.endTime) {
         totalHours += 12; // Placeholder logic
      } else if (shift.type?.includes('12')) {
         totalHours += 12;
      } else if (shift.type?.includes('24')) {
         totalHours += 24;
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
    // Check if exists
    const existing = await this.getGoal(insertItem.userId, insertItem.month);
    if (existing) {
       const [updated] = await db.update(goals).set({ targetAmount: insertItem.targetAmount }).where(eq(goals.id, existing.id)).returning();
       return updated;
    }
    const [item] = await db.insert(goals).values(insertItem).returning();
    return item;
  }
}

export const storage = new DatabaseStorage();
