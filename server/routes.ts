import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth & Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Helper to get userId
  const getUserId = (req: any) => req.user?.claims?.sub;

  // --- Prescriptions ---
  app.get(api.prescriptions.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getPrescriptions(getUserId(req));
    res.json(items);
  });

  app.get(api.prescriptions.get.path, isAuthenticated, async (req, res) => {
    const item = await storage.getPrescription(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.prescriptions.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.prescriptions.create.input.parse(req.body);
      // Enforce userId
      const item = await storage.createPrescription({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.prescriptions.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.prescriptions.update.input.parse(req.body);
      const item = await storage.updatePrescription(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.prescriptions.delete.path, isAuthenticated, async (req, res) => {
    await storage.deletePrescription(Number(req.params.id));
    res.status(204).send();
  });

  // --- Checklists ---
  app.get(api.checklists.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getChecklists(getUserId(req));
    res.json(items);
  });

  app.get(api.checklists.get.path, isAuthenticated, async (req, res) => {
    const item = await storage.getChecklist(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.checklists.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.checklists.create.input.parse(req.body);
      const item = await storage.createChecklist({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.checklists.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.checklists.update.input.parse(req.body);
      const item = await storage.updateChecklist(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.checklists.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteChecklist(Number(req.params.id));
    res.status(204).send();
  });

  // --- Shifts ---
  app.get(api.shifts.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getShifts(getUserId(req));
    res.json(items);
  });

  app.post(api.shifts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.shifts.create.input.parse(req.body);
      const item = await storage.createShift({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.shifts.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.shifts.update.input.parse(req.body);
      const item = await storage.updateShift(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.shifts.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteShift(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.shifts.stats.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getShiftStats(getUserId(req));
    res.json(stats);
  });

  // --- Notes ---
  app.get(api.notes.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getNotes(getUserId(req));
    res.json(items);
  });

  app.post(api.notes.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.notes.create.input.parse(req.body);
      const item = await storage.createNote({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.notes.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.notes.update.input.parse(req.body);
      const item = await storage.updateNote(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.notes.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteNote(Number(req.params.id));
    res.status(204).send();
  });

  // --- Library ---
  app.get(api.library.categories.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getLibraryCategories();
    res.json(items);
  });

  app.post(api.library.categories.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.library.categories.create.input.parse(req.body);
      const item = await storage.createLibraryCategory(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.get(api.library.items.list.path, isAuthenticated, async (req, res) => {
    const categoryId = Number(req.query.categoryId);
    const items = await storage.getLibraryItems(categoryId);
    res.json(items);
  });

  app.post(api.library.items.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.library.items.create.input.parse(req.body);
      const item = await storage.createLibraryItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // --- Seed Data ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getPrescriptions();
  if (existing.length === 0) {
    await storage.createPrescription({
      title: "Dipirona",
      content: "Dipirona 1g, IV, 6/6h, se dor ou febre.",
      category: "Analgesia",
      isPublic: true,
      userId: null,
    });
    await storage.createPrescription({
      title: "Ceftriaxona",
      content: "Ceftriaxona 1g, IV, 12/12h.",
      category: "Antibióticos",
      isPublic: true,
      userId: null,
    });
  }

  const categories = await storage.getLibraryCategories();
  if (categories.length === 0) {
    const cat = await storage.createLibraryCategory({ title: "Cardiologia", order: 1 });
    await storage.createLibraryItem({
      categoryId: cat.id,
      title: "Protocolo de SCA",
      type: "pdf",
      url: "https://example.com/sca.pdf",
      description: "Síndrome Coronariana Aguda",
      order: 1
    });
  }
}
