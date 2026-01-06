import { 
  prescriptions, checklists, shifts, notes, libraryCategories, libraryItems, shiftChecklists,
  type Prescription, type InsertPrescription, type UpdatePrescriptionRequest,
  type Checklist, type InsertChecklist, type UpdateChecklistRequest,
  type Shift, type InsertShift, type UpdateShiftRequest,
  type Note, type InsertNote, type UpdateNoteRequest,
  type LibraryCategory, type InsertLibraryCategory, type UpdateLibraryCategoryRequest,
  type LibraryItem, type InsertLibraryItem, type UpdateLibraryItemRequest,
  type ShiftChecklist, type InsertShiftChecklist
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
  getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[] }>;

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
  async getShiftStats(userId: string): Promise<{ totalEarnings: number, totalHours: number, upcomingShifts: Shift[] }> {
    const now = new Date();
    // Simple calculation for now
    const userShifts = await db.select().from(shifts).where(eq(shifts.userId, userId));
    
    let totalEarnings = 0;
    let totalHours = 0;
    const upcomingShifts: Shift[] = [];

    for (const shift of userShifts) {
      // Calculate earnings
      if (shift.value) {
        totalEarnings += Number(shift.value);
      }
      
      // Calculate upcoming
      if (new Date(shift.date) >= now) {
        upcomingShifts.push(shift);
      }

      // Estimate hours (rough parsing)
      if (shift.startTime && shift.endTime) {
         // rough estimation, would need proper parsing library
         totalHours += 12; // Placeholder
      } else if (shift.type?.includes('12')) {
         totalHours += 12;
      } else if (shift.type?.includes('24')) {
         totalHours += 24;
      }
    }

    upcomingShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { totalEarnings, totalHours, upcomingShifts };
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
}

export const storage = new DatabaseStorage();
