import { users, shifts, prescriptions, calculatorSettings, type User, type InsertUser, type Shift, type InsertShift, type Prescription, type InsertPrescription, type CalculatorSetting, type InsertCalculator } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: number, status: string, expiresAt?: Date): Promise<User>;

  // Plantões
  getShifts(userId: number): Promise<Shift[]>;
  createShift(userId: number, shift: InsertShift): Promise<Shift>;

  // Prescrições
  getPrescriptions(userId: number): Promise<Prescription[]>;
  createPrescription(userId: number, prescription: InsertPrescription): Promise<Prescription>;

  // Calculadora
  getCalculatorSettings(userId: number): Promise<CalculatorSetting[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // ATUALIZADO: Agora salva a data de expiração da assinatura
  async updateUserStatus(id: number, status: string, expiresAt?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        status, 
        subscriptionExpiresAt: expiresAt 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getShifts(userId: number): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.userId, userId));
  }

  async createShift(userId: number, insertShift: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values({ ...insertShift, userId }).returning();
    return shift;
  }

  async getPrescriptions(userId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.userId, userId));
  }

  async createPrescription(userId: number, insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values({ ...insertPrescription, userId }).returning();
    return prescription;
  }

  async getCalculatorSettings(userId: number): Promise<CalculatorSetting[]> {
    // Retorna configurações públicas ou criadas pelo próprio usuário
    return await db.select().from(calculatorSettings);
  }
}

export const storage = new DatabaseStorage();