/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const getUserId = (req: Request) => (req.user as any)?.claims?.sub;

export function registerUserProfileRoutes(app: Express) {
  // Get user display name
  app.get("/api/user/display-name", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const [user] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, userId));
      res.json({ displayName: user?.displayName || "" });
    } catch (error) {
      console.error("Error fetching display name:", error);
      res.status(500).json({ error: "Failed to fetch display name" });
    }
  });

  // Update user display name
  app.put("/api/user/display-name", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { displayName } = req.body;
    if (!displayName || typeof displayName !== "string") {
      return res.status(400).json({ error: "Invalid display name" });
    }

    try {
      const [updated] = await db
        .update(users)
        .set({ displayName: displayName.trim(), updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      res.json({ displayName: updated.displayName });
    } catch (error) {
      console.error("Error updating display name:", error);
      res.status(500).json({ error: "Failed to update display name" });
    }
  });
}
