import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { authStorage } from "../replit_integrations/auth/storage";
import { generateCode, generateToken, sendAuthEmail } from "./emailService";

const TOKEN_EXPIRY_MINUTES = 10;

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function requestEmailAuth(email: string, baseUrl: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const code = generateCode();
  const token = generateToken();
  
  const codeHash = await bcrypt.hash(code, 10);
  const tokenHash = await bcrypt.hash(token, 10);
  
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  await storage.createEmailAuthToken({
    email: normalizedEmail,
    codeHash,
    tokenHash,
    expiresAt
  });
  
  const emailSent = await sendAuthEmail(normalizedEmail, code, token, baseUrl);
  
  if (!emailSent) {
    return { success: false, error: "Falha ao enviar email" };
  }
  
  return { success: true };
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const authToken = await storage.getValidEmailAuthToken(normalizedEmail);
  
  if (!authToken) {
    return { success: false, error: "Código expirado ou não encontrado" };
  }
  
  const isValidCode = await bcrypt.compare(code, authToken.codeHash);
  
  if (!isValidCode) {
    return { success: false, error: "Código inválido" };
  }
  
  await storage.markEmailAuthTokenUsed(authToken.id);
  
  const user = await findOrCreateUserByEmail(normalizedEmail);
  
  return { success: true, userId: user.id };
}

export async function verifyMagicLink(token: string): Promise<AuthResult> {
  const authTokens = await findTokenByMagicLink(token);
  
  if (!authTokens) {
    return { success: false, error: "Link expirado ou inválido" };
  }
  
  await storage.markEmailAuthTokenUsed(authTokens.id);
  
  const user = await findOrCreateUserByEmail(authTokens.email);
  
  return { success: true, userId: user.id };
}

async function findTokenByMagicLink(token: string) {
  const { db } = await import("../db");
  const { emailAuthTokens } = await import("@shared/models/auth");
  const { and, isNull, gt } = await import("drizzle-orm");
  
  const tokens = await db.select().from(emailAuthTokens)
    .where(and(
      isNull(emailAuthTokens.usedAt),
      gt(emailAuthTokens.expiresAt, new Date())
    ));
  
  for (const authToken of tokens) {
    const isValid = await bcrypt.compare(token, authToken.tokenHash);
    if (isValid) {
      return authToken;
    }
  }
  
  return null;
}

async function findOrCreateUserByEmail(email: string) {
  const identity = await storage.getAuthIdentityByProvider("email", email);
  
  if (identity) {
    const user = await authStorage.getUser(identity.userId);
    if (user) return user;
  }
  
  const existingUser = await authStorage.getUserByEmail(email);
  if (existingUser) {
    const existingIdentity = await storage.getAuthIdentityByProvider("email", email);
    if (!existingIdentity) {
      await storage.createAuthIdentity({
        userId: existingUser.id,
        provider: "email",
        providerUserId: email,
        email
      });
    }
    return existingUser;
  }
  
  const newUser = await authStorage.upsertUser({
    email,
    authProvider: "email",
    status: "pending"
  });
  
  await storage.createAuthIdentity({
    userId: newUser.id,
    provider: "email",
    providerUserId: email,
    email
  });
  
  return newUser;
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await import("../db");
    const { users } = await import("@shared/models/auth");
    const { eq } = await import("drizzle-orm");
    
    await db.update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return { success: false, error: "Erro ao excluir conta" };
  }
}
