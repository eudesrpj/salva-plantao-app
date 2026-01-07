import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  userAiCredentials, 
  aiPrompts, 
  aiSettings,
  type UserAiCredentials,
  type InsertUserAiCredentials,
  type AiPrompt,
  type InsertAiPrompt,
  type AiSetting,
  type InsertAiSetting
} from "@shared/schema";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../utils/encryption";

export interface MaskedCredentials {
  id: number;
  userId: string;
  provider: string | null;
  maskedApiKey: string;
  model: string | null;
  isEnabled: boolean | null;
  lastTestedAt: Date | null;
}

class AiStorage {
  async getUserCredentials(userId: string): Promise<UserAiCredentials | undefined> {
    const [creds] = await db.select().from(userAiCredentials).where(eq(userAiCredentials.userId, userId));
    return creds;
  }

  async getMaskedCredentials(userId: string): Promise<MaskedCredentials | null> {
    const creds = await this.getUserCredentials(userId);
    if (!creds) return null;

    const decryptedKey = decryptApiKey(creds.encryptedApiKey, creds.keyIv, creds.keyAuthTag);
    
    return {
      id: creds.id,
      userId: creds.userId,
      provider: creds.provider,
      maskedApiKey: maskApiKey(decryptedKey),
      model: creds.model,
      isEnabled: creds.isEnabled,
      lastTestedAt: creds.lastTestedAt,
    };
  }

  async getDecryptedApiKey(userId: string): Promise<string | null> {
    const creds = await this.getUserCredentials(userId);
    if (!creds) return null;
    return decryptApiKey(creds.encryptedApiKey, creds.keyIv, creds.keyAuthTag);
  }

  async saveCredentials(userId: string, apiKey: string, provider: string = 'openai', model: string = 'gpt-4o'): Promise<MaskedCredentials> {
    const encrypted = encryptApiKey(apiKey);
    
    const [creds] = await db
      .insert(userAiCredentials)
      .values({
        userId,
        provider,
        model,
        encryptedApiKey: encrypted.encryptedData,
        keyIv: encrypted.iv,
        keyAuthTag: encrypted.authTag,
        isEnabled: true,
      })
      .onConflictDoUpdate({
        target: userAiCredentials.userId,
        set: {
          provider,
          model,
          encryptedApiKey: encrypted.encryptedData,
          keyIv: encrypted.iv,
          keyAuthTag: encrypted.authTag,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      id: creds.id,
      userId: creds.userId,
      provider: creds.provider,
      maskedApiKey: maskApiKey(apiKey),
      model: creds.model,
      isEnabled: creds.isEnabled,
      lastTestedAt: creds.lastTestedAt,
    };
  }

  async updateLastTested(userId: string): Promise<void> {
    await db
      .update(userAiCredentials)
      .set({ lastTestedAt: new Date(), updatedAt: new Date() })
      .where(eq(userAiCredentials.userId, userId));
  }

  async deleteCredentials(userId: string): Promise<void> {
    await db.delete(userAiCredentials).where(eq(userAiCredentials.userId, userId));
  }

  async getActivePrompts(): Promise<AiPrompt[]> {
    return await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.isActive, true))
      .orderBy(aiPrompts.order);
  }

  async getAllPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts).orderBy(aiPrompts.order);
  }

  async getPrompt(id: number): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(eq(aiPrompts.id, id));
    return prompt;
  }

  async getDefaultPrompt(): Promise<AiPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.isActive, true))
      .orderBy(aiPrompts.order)
      .limit(1);
    return prompt;
  }

  async createPrompt(data: InsertAiPrompt): Promise<AiPrompt> {
    const [prompt] = await db.insert(aiPrompts).values(data).returning();
    return prompt;
  }

  async updatePrompt(id: number, data: Partial<InsertAiPrompt>): Promise<AiPrompt> {
    const [prompt] = await db
      .update(aiPrompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiPrompts.id, id))
      .returning();
    return prompt;
  }

  async deletePrompt(id: number): Promise<void> {
    await db.delete(aiPrompts).where(eq(aiPrompts.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(aiSettings).where(eq(aiSettings.key, key));
    return setting?.value ?? null;
  }

  async setSetting(key: string, value: string, description?: string): Promise<AiSetting> {
    const [setting] = await db
      .insert(aiSettings)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: aiSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<AiSetting[]> {
    return await db.select().from(aiSettings);
  }
}

export const aiStorage = new AiStorage();
