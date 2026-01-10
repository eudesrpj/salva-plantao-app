import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, and, isNull } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStatus(id: string, status: string): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  activateUserWithSubscription(id: string, expiresAt: Date): Promise<User>;
  getAllUsers(): Promise<User[]>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email.toLowerCase().trim()), isNull(users.deletedAt)));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStatus(id: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activateUserWithSubscription(id: string, expiresAt: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        status: "active", 
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserChatTerms(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ chatTermsAcceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserUf(id: string, uf: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ uf, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
