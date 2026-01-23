/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com

INDEPENDENT AUTHENTICATION SYSTEM
- Email + Password authentication
- HttpOnly secure cookies
- NO Replit dependency
- Production-grade implementation
*/

import type { Express, Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { storage } from "../storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

// Cookie name for auth token
const AUTH_COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";

// Secrets - MUST be set in production via environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET and JWT_REFRESH_SECRET must be set in production environment. Configure them in Render environment variables."
    );
  }
  // In development, log a warning but allow with placeholder values
  console.warn(
    "⚠️  JWT_SECRET and JWT_REFRESH_SECRET not set. Using temporary development values. Set them in .env for production."
  );
}

const JWT_EXPIRY = "15m";
const REFRESH_JWT_EXPIRY = "7d";

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

/**
 * Create JWT token
 */
export function createToken(userId: string, isRefresh = false): string {
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets not configured. Check environment variables.");
  }
  const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
  const expiresIn = isRefresh ? REFRESH_JWT_EXPIRY : JWT_EXPIRY;
  
  return jwt.sign(
    { userId, isRefresh },
    secret,
    { expiresIn }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, isRefresh = false): { userId: string } | null {
  try {
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets not configured. Check environment variables.");
    }
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret) as { userId: string; isRefresh: boolean };
    
    // Ensure token type matches what we expect
    if (decoded.isRefresh !== isRefresh) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Set auth cookies
 */
export function setAuthCookies(res: Response, userId: string): void {
  const token = createToken(userId, false);
  const refreshToken = createToken(userId, true);
  
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = isProduction ? "strict" : "lax";
  const secure = isProduction;
  
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}

/**
 * Extract user from request (from cookies or header)
 */
export function extractUser(req: Request): { userId: string } | null {
  // Try cookie first
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token, false);
    if (payload) {
      return payload;
    }
  }
  
  // Try authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, false);
    if (payload) {
      return payload;
    }
  }
  
  return null;
}

/**
 * Middleware: Authenticate request
 * Sets req.userId and req.user if authentication succeeds
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const userPayload = extractUser(req);
  
  if (!userPayload) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  req.userId = userPayload.userId;
  next();
};

/**
 * Middleware: Authenticate or continue (optional auth)
 * Sets req.userId if authentication succeeds, but doesn't fail
 */
export const authenticateOptional = (req: Request, _res: Response, next: NextFunction): void => {
  const userPayload = extractUser(req);
  if (userPayload) {
    req.userId = userPayload.userId;
  }
  next();
};

/**
 * Middleware: Check admin role
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userPayload = extractUser(req);
  
  if (!userPayload) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const user = await storage.getUser(userPayload.userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Forbidden: Admin access required" });
    return;
  }
  
  req.userId = userPayload.userId;
  req.user = user;
  next();
};

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Setup authentication middleware on express app
 */
export function setupAuthMiddleware(app: Express): void {
  // Parse cookies
  app.use(cookieParser());
  
  // Trust proxy headers from Replit load balancer
  app.set("trust proxy", 1);
}

/**
 * Initialize auth routes
 */
export function registerIndependentAuthRoutes(app: Express): void {
  // POST /api/auth/signup - Register new user
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password required" });
        return;
      }
      
      // Check if user exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: "User already exists" });
        return;
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
        profileImageUrl: null,
      });
      
      // Set cookies
      setAuthCookies(res, user.id);
      
      res.status(201).json({
        success: true,
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/auth/login - Login with email and password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password required" });
        return;
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      
      // Verify password
      if (!user.passwordHash) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      
      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      
      // Set cookies
      setAuthCookies(res, user.id);
      
      res.json({
        success: true,
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/auth/refresh - Refresh access token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token missing" });
        return;
      }
      
      const payload = verifyToken(refreshToken, true);
      if (!payload) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }
      
      // Verify user still exists
      const user = await storage.getUser(payload.userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      
      // Set new cookies
      setAuthCookies(res, payload.userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/auth/logout - Clear auth cookies
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    clearAuthCookies(res);
    res.json({ success: true });
  });
  
  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      res.json({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
