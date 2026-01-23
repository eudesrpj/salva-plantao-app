/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertUserMedicationSchema, insertUserPreferencesSchema, insertAdminFeatureFlagSchema, insertAdminQuickAccessConfigSchema, insertMessageOfDayMessageSchema } from "@shared/schema";
import { z } from "zod";

const getUserId = (req: Request) => (req.user as any)?.claims?.sub;
const isAdmin = (req: Request) => (req.user as any)?.claims?.role === 'admin';

export function registerNewFeaturesRoutes(app: Express) {
  // =============== USER MEDICATIONS ===============
  
  // Get all user medications
  app.get("/api/user-medications", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const meds = await storage.getUserMedications(userId);
      res.json(meds);
    } catch (error) {
      console.error("Error fetching user medications:", error);
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  // Create user medication
  app.post("/api/user-medications", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertUserMedicationSchema.parse(req.body);
      const med = await storage.createUserMedication({ ...data, userId });
      res.status(201).json(med);
    } catch (error) {
      console.error("Error creating user medication:", error);
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  // Update user medication
  app.put("/api/user-medications/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid medication ID" });
    
    try {
      const med = await storage.getUserMedication(id);
      if (!med || med.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const data = insertUserMedicationSchema.partial().parse(req.body);
      const updated = await storage.updateUserMedication(id, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user medication:", error);
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  // Delete user medication
  app.delete("/api/user-medications/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid medication ID" });
    
    try {
      await storage.deleteUserMedication(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user medication:", error);
      res.status(403).json({ error: "Failed to delete medication" });
    }
  });

  // Search user medications
  app.get("/api/user-medications/search", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Search query required" });
    
    try {
      const results = await storage.searchUserMedications(userId, query);
      res.json(results);
    } catch (error) {
      console.error("Error searching user medications:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // =============== USER PREFERENCES ===============
  
  // Get user preferences
  app.get("/api/user-preferences", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      let prefs = await storage.getUserPreferences(userId);
      if (!prefs) {
        // Create default preferences if they don't exist
        prefs = await storage.createUserPreferences(userId, {
          messageOfDayEnabled: true,
          messageOfDayVerses: true,
          messageOfDayMotivation: true,
          messageOfDayTips: true,
          messageOfDayWeather: false,
          theme: "light",
          language: "pt-BR",
          lastMessageOfDayDate: null,
        });
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Update user preferences
  app.put("/api/user-preferences", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertUserPreferencesSchema.partial().parse(req.body);
      const updated = await storage.updateUserPreferences(userId, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  // =============== ADMIN FEATURE FLAGS ===============
  
  // Get all feature flags
  app.get("/api/admin/feature-flags", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    try {
      const flags = await storage.getAdminFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ error: "Failed to fetch flags" });
    }
  });

  // Create feature flag
  app.post("/api/admin/feature-flags", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    try {
      const data = insertAdminFeatureFlagSchema.parse(req.body);
      const flag = await storage.createAdminFeatureFlag(data);
      res.status(201).json(flag);
    } catch (error) {
      console.error("Error creating feature flag:", error);
      res.status(400).json({ error: "Invalid flag data" });
    }
  });

  // Update feature flag
  app.put("/api/admin/feature-flags/:key", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const key = req.params.key;
    
    try {
      const data = insertAdminFeatureFlagSchema.partial().parse(req.body);
      const updated = await storage.updateAdminFeatureFlag(key, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating feature flag:", error);
      res.status(400).json({ error: "Invalid flag data" });
    }
  });

  // Check if feature is enabled (public endpoint for frontend)
  app.get("/api/features/:key", async (req: Request, res: Response) => {
    const key = req.params.key;
    
    try {
      const enabled = await storage.isFeatureEnabled(key);
      res.json({ enabled });
    } catch (error) {
      console.error("Error checking feature:", error);
      res.status(500).json({ error: "Failed to check feature" });
    }
  });

  // =============== ADMIN QUICK ACCESS CONFIG ===============
  
  // Get quick access configs for a tab
  app.get("/api/admin/quick-access-config", async (req: Request, res: Response) => {
    const tab = req.query.tab as string | undefined;
    
    try {
      const configs = await storage.getAdminQuickAccessConfigs(tab);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching quick access configs:", error);
      res.status(500).json({ error: "Failed to fetch configs" });
    }
  });

  // Create quick access config (admin only)
  app.post("/api/admin/quick-access-config", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    try {
      const data = insertAdminQuickAccessConfigSchema.parse(req.body);
      const config = await storage.createAdminQuickAccessConfig(data);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating quick access config:", error);
      res.status(400).json({ error: "Invalid config data" });
    }
  });

  // Update quick access config (admin only)
  app.put("/api/admin/quick-access-config/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid config ID" });
    
    try {
      const data = insertAdminQuickAccessConfigSchema.partial().parse(req.body);
      const updated = await storage.updateAdminQuickAccessConfig(id, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating quick access config:", error);
      res.status(400).json({ error: "Invalid config data" });
    }
  });

  // Reorder quick access configs (admin only)
  app.post("/api/admin/quick-access-config/reorder", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    try {
      const { tab, items } = req.body as { tab: string; items: { id: number; displayOrder: number }[] };
      if (!tab || !Array.isArray(items)) {
        return res.status(400).json({ error: "Missing tab or items" });
      }
      
      await storage.reorderAdminQuickAccessConfigs(tab, items);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering configs:", error);
      res.status(400).json({ error: "Failed to reorder configs" });
    }
  });

  // =============== MESSAGE OF THE DAY ===============
  
  // Get random message of the day
  app.get("/api/message-of-day", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      // Check if feature is enabled
      const enabled = await storage.isFeatureEnabled("message_of_day_enabled");
      if (!enabled) {
        return res.json({ message: null, reason: "Feature disabled" });
      }
      
      // Get user preferences
      const prefs = await storage.getUserPreferences(userId);
      if (!prefs || !prefs.messageOfDayEnabled) {
        return res.json({ message: null, reason: "User disabled" });
      }
      
      // Check if already shown today
      const today = new Date().toISOString().split('T')[0];
      if (prefs.lastMessageOfDayDate === today) {
        return res.json({ message: null, reason: "Already shown today" });
      }
      
      // Pick a random message based on user preferences
      let message = null;
      if (prefs.messageOfDayVerses) {
        message = await storage.getRandomMessageOfDay("verse");
      }
      if (!message && prefs.messageOfDayMotivation) {
        message = await storage.getRandomMessageOfDay("motivation");
      }
      if (!message && prefs.messageOfDayTips) {
        message = await storage.getRandomMessageOfDay("tip");
      }
      
      if (message) {
        // Update last shown date
        await storage.updateUserPreferences(userId, { lastMessageOfDayDate: today });
      }
      
      res.json({ message });
    } catch (error) {
      console.error("Error fetching message of the day:", error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  // Get all messages of the day (admin only)
  app.get("/api/admin/message-of-day", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const type = req.query.type as string | undefined;
    const source = req.query.source as string | undefined;
    
    try {
      const messages = await storage.getMessageOfDayMessages(type, source);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Create message of the day (admin only)
  app.post("/api/admin/message-of-day", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const userId = getUserId(req);
    
    try {
      const data = insertMessageOfDayMessageSchema.parse(req.body);
      const message = await storage.createMessageOfDayMessage(data, userId);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Update message of the day (admin only)
  app.put("/api/admin/message-of-day/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid message ID" });
    
    try {
      const data = insertMessageOfDayMessageSchema.partial().parse(req.body);
      const updated = await storage.updateMessageOfDayMessage(id, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Delete message of the day (admin only)
  app.delete("/api/admin/message-of-day/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid message ID" });
    
    try {
      await storage.deleteMessageOfDayMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });
}
