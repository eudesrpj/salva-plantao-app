import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAiRoutes } from "./ai/routes";
import { authStorage } from "./replit_integrations/auth/storage";
import { notifyUser, notifyAllAdmins } from "./websocket";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAiRoutes(app);

  const getUserId = (req: any) => req.user?.claims?.sub;
  
  const checkAdmin = async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await authStorage.getUser(userId);
    if (user?.role !== "admin") return res.status(403).json({ message: "Forbidden: Admin only" });
    next();
  };

  const checkActive = async (req: any, res: any, next: any) => {
     const userId = getUserId(req);
     if (!userId) return res.status(401).json({ message: "Unauthorized" });
     const user = await authStorage.getUser(userId);
     if (user?.status !== "active" && user?.role !== "admin") {
        return res.status(403).json({ message: "Account pending payment or blocked" });
     }
     next();
  };

  const checkNotBlocked = async (req: any, res: any, next: any) => {
     const userId = getUserId(req);
     if (!userId) return res.status(401).json({ message: "Unauthorized" });
     const user = await authStorage.getUser(userId);
     if (user?.status === "blocked" && user?.role !== "admin") {
        return res.status(403).json({ message: "Account blocked" });
     }
     next();
  };

  // --- Admin Routes ---
  app.get("/api/admin/users", isAuthenticated, checkAdmin, async (req, res) => {
    const users = await authStorage.getAllUsers();
    res.json(users);
  });

  app.patch("/api/admin/users/:id/status", isAuthenticated, checkAdmin, async (req, res) => {
    const { status } = req.body;
    const user = await authStorage.updateUserStatus(req.params.id, status);
    res.json(user);
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, checkAdmin, async (req, res) => {
    const { role } = req.body;
    const user = await authStorage.updateUserRole(req.params.id, role);
    res.json(user);
  });

  // --- Admin Settings ---
  app.get(api.adminSettings.list.path, isAuthenticated, checkAdmin, async (req, res) => {
    const items = await storage.getAllAdminSettings();
    res.json(items);
  });

  app.get("/api/admin/settings/:key", isAuthenticated, async (req, res) => {
    const item = await storage.getAdminSetting(req.params.key);
    res.json(item || null);
  });

  app.post(api.adminSettings.set.path, isAuthenticated, checkAdmin, async (req, res) => {
    const { key, value } = req.body;
    const item = await storage.setAdminSetting(key, value);
    res.json(item);
  });

  // Public payment settings (for PaymentRequired page)
  app.get("/api/public/payment-settings", async (req, res) => {
    const pixKey = await storage.getAdminSetting("pix_key");
    const whatsapp = await storage.getAdminSetting("whatsapp_number");
    const instructions = await storage.getAdminSetting("payment_instructions");
    const price = await storage.getAdminSetting("subscription_price");
    res.json({
      pixKey: pixKey?.value || "00.000.000/0001-00",
      whatsapp: whatsapp?.value || "5500000000000",
      instructions: instructions?.value || "Após o pagamento, envie o comprovante para liberação.",
      price: price?.value || "29,90"
    });
  });

  // --- Admin AI Content Generation ---
  app.post("/api/admin/ai/generate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { contentType, context, title } = req.body;
      
      if (!contentType || !context) {
        return res.status(400).json({ message: "contentType e context são obrigatórios" });
      }

      const validTypes = ["protocol", "checklist", "flashcard", "prescription"];
      if (!validTypes.includes(contentType)) {
        return res.status(400).json({ message: "contentType inválido" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const systemPrompts: Record<string, string> = {
        protocol: `Você é um assistente médico especializado em criar protocolos clínicos. 
Gere um protocolo em português brasileiro, estruturado com seções claras.
Formato: JSON com campos { title, content, specialty, category, tags[] }.
O conteúdo deve incluir: indicações, contraindicações, condutas passo-a-passo, e referências quando apropriado.
IMPORTANTE: Este é um RASCUNHO que será revisado por um médico antes de publicação.`,
        
        checklist: `Você é um assistente médico especializado em criar checklists clínicos.
Gere um checklist em português brasileiro, com itens práticos e objetivos.
Formato: JSON com campos { title, items[], category, specialty, ageGroup }.
Os items devem ser strings curtas e acionáveis para uso rápido no plantão.
IMPORTANTE: Este é um RASCUNHO que será revisado por um médico antes de publicação.`,
        
        flashcard: `Você é um assistente médico especializado em criar material de estudo.
Gere um flashcard em português brasileiro para revisão rápida.
Formato: JSON com campos { title, front (pergunta/termo), back (resposta/explicação), type, category, specialty }.
Types válidos: resumo, mnemonico, dica, checkpoint.
IMPORTANTE: Este é um RASCUNHO que será revisado por um médico antes de publicação.`,
        
        prescription: `Você é um assistente médico especializado em modelos de prescrição.
Gere um modelo de prescrição em português brasileiro.
Formato: JSON com campos { title, medication, dose, interval, duration, route, pharmaceuticalForm, patientNotes, orientations, category, ageGroup }.
Inclua doses padrão e orientações ao paciente.
IMPORTANTE: Este é um RASCUNHO que será revisado por um médico antes de publicação.`,
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompts[contentType] },
          { role: "user", content: `Título sugerido: ${title || "A definir"}\n\nContexto/Descrição: ${context}` }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const generatedContent = response.choices[0]?.message?.content || "{}";
      
      res.json({
        draft: JSON.parse(generatedContent),
        contentType,
        message: "Rascunho gerado. Revise antes de salvar.",
        isAIDraft: true,
      });
    } catch (err) {
      console.error("Admin AI generation error:", err);
      res.status(500).json({ message: "Erro ao gerar conteúdo com IA" });
    }
  });

  // --- Prescriptions ---
  app.get(api.prescriptions.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const items = await storage.getPrescriptions(getUserId(req), ageGroup);
    res.json(items);
  });

  app.get("/api/prescriptions/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const query = req.query.q as string || "";
    const items = await storage.searchPrescriptions(query, getUserId(req));
    res.json(items);
  });

  app.get(api.prescriptions.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getPrescription(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.prescriptions.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.prescriptions.create.input.parse(req.body);
      const userId = getUserId(req);
      
      if (input.isPublic || input.isLocked) {
         const user = await authStorage.getUser(userId);
         if (user?.role !== "admin") return res.status(403).json({ message: "Only admins can create official prescriptions" });
      }

      const item = await storage.createPrescription({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.prescriptions.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.prescriptions.update.input.parse(req.body);
      const item = await storage.updatePrescription(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.prescriptions.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deletePrescription(Number(req.params.id));
    res.status(204).send();
  });

  // --- Prescription Suggestions (Internal AI - no external API) ---
  app.get("/api/prescriptions/suggestions", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const diagnosis = req.query.diagnosis as string | undefined;
      const ageGroup = req.query.ageGroup as string | undefined;
      const userId = getUserId(req);
      
      const suggestions = await storage.searchPrescriptionSuggestions({
        diagnosis,
        ageGroup,
        userId
      });
      
      res.json(suggestions);
    } catch (err) {
      console.error("Error getting prescription suggestions:", err);
      res.status(500).json({ message: "Erro ao buscar sugestões" });
    }
  });

  // --- Protocols ---
  app.get(api.protocols.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const items = await storage.getProtocols(getUserId(req), ageGroup);
    res.json(items);
  });

  app.get("/api/protocols/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const query = req.query.q as string || "";
    const items = await storage.searchProtocols(query, getUserId(req));
    res.json(items);
  });

  app.get(api.protocols.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getProtocol(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.protocols.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.protocols.create.input.parse(req.body);
      const userId = getUserId(req);
      
      if (input.isPublic || input.isLocked) {
         const user = await authStorage.getUser(userId);
         if (user?.role !== "admin") return res.status(403).json({ message: "Only admins can create official protocols" });
      }

      const item = await storage.createProtocol({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.protocols.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.protocols.update.input.parse(req.body);
      const item = await storage.updateProtocol(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.protocols.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteProtocol(Number(req.params.id));
    res.status(204).send();
  });

  // --- Checklists ---
  app.get(api.checklists.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const items = await storage.getChecklists(getUserId(req), ageGroup);
    res.json(items);
  });

  app.get("/api/checklists/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const query = req.query.q as string || "";
    const items = await storage.searchChecklists(query, getUserId(req));
    res.json(items);
  });

  app.get(api.checklists.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getChecklist(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.checklists.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.checklists.create.input.parse(req.body);
      const userId = getUserId(req);

      if (input.isPublic || input.isLocked) {
         const user = await authStorage.getUser(userId);
         if (user?.role !== "admin") return res.status(403).json({ message: "Only admins can create official checklists" });
      }

      const item = await storage.createChecklist({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.checklists.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.checklists.update.input.parse(req.body);
      const item = await storage.updateChecklist(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.checklists.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteChecklist(Number(req.params.id));
    res.status(204).send();
  });

  // --- Flashcards ---
  app.get(api.flashcards.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getFlashcards(getUserId(req));
    res.json(items);
  });

  app.get(api.flashcards.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getFlashcard(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.flashcards.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.flashcards.create.input.parse(req.body);
      const userId = getUserId(req);
      
      if (input.isPublic) {
         const user = await authStorage.getUser(userId);
         if (user?.role !== "admin") return res.status(403).json({ message: "Only admins can create public flashcards" });
      }

      const item = await storage.createFlashcard({ ...input, userId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.flashcards.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.flashcards.update.input.parse(req.body);
      const item = await storage.updateFlashcard(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.flashcards.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteFlashcard(Number(req.params.id));
    res.status(204).send();
  });

  // --- Favorites ---
  app.get(api.favorites.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getFavorites(getUserId(req));
    res.json(items);
  });

  app.post(api.favorites.add.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.favorites.add.input.parse(req.body);
      const item = await storage.addFavorite({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.delete("/api/favorites/:itemType/:itemId", isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.removeFavorite(getUserId(req), req.params.itemType, Number(req.params.itemId));
    res.status(204).send();
  });

  // --- Doctor Profile ---
  app.get(api.doctorProfile.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getDoctorProfile(getUserId(req));
    res.json(item || null);
  });

  app.post(api.doctorProfile.upsert.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.doctorProfile.upsert.input.parse(req.body);
      const item = await storage.upsertDoctorProfile({ ...input, userId: getUserId(req) });
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // --- Interconsult Messages ---
  app.get(api.interconsult.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const channel = req.query.channel as string | undefined;
    const items = await storage.getInterconsultMessages(getUserId(req), channel);
    res.json(items);
  });

  app.post(api.interconsult.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.interconsult.create.input.parse(req.body);
      const senderId = getUserId(req);
      const item = await storage.createInterconsultMessage({ ...input, senderId });
      
      // Send real-time notification
      const sender = await authStorage.getUser(senderId);
      const senderName = sender?.firstName || sender?.email?.split("@")[0] || "Usuário";
      
      if (input.receiverId) {
        // Direct message to specific user
        notifyUser(input.receiverId, {
          type: "new_message",
          title: "Nova mensagem",
          message: input.message.substring(0, 100) + (input.message.length > 100 ? "..." : ""),
          channel: input.channel,
          senderId,
          senderName,
          data: { messageId: item.id }
        });
      } else if (input.channel === "admin_support") {
        // Message to admin support - notify all admins
        const allUsers = await authStorage.getAllUsers();
        const adminIds = allUsers.filter(u => u.role === "admin").map(u => u.id);
        notifyAllAdmins({
          type: "new_support_message",
          title: "Nova mensagem de suporte",
          message: `${senderName}: ${input.message.substring(0, 80)}...`,
          data: { messageId: item.id, senderId, channel: input.channel }
        }, adminIds);
      }
      
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // --- Shifts ---
  app.get(api.shifts.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getShifts(getUserId(req));
    res.json(items);
  });

  app.post(api.shifts.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.shifts.create.input.parse(req.body);
      const item = await storage.createShift({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.shifts.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.shifts.update.input.parse(req.body);
      const item = await storage.updateShift(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.shifts.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteShift(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.shifts.stats.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const stats = await storage.getShiftStats(getUserId(req));
    res.json(stats);
  });

  // --- Notes ---
  app.get(api.notes.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getNotes(getUserId(req));
    res.json(items);
  });

  app.post(api.notes.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.notes.create.input.parse(req.body);
      const item = await storage.createNote({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.notes.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.notes.update.input.parse(req.body);
      const item = await storage.updateNote(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.notes.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteNote(Number(req.params.id));
    res.status(204).send();
  });

  // --- Tasks ---
  app.get(api.tasks.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getTasks(getUserId(req));
    res.json(items);
  });

  app.post(api.tasks.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const item = await storage.createTask({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.tasks.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const item = await storage.updateTask(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.post(api.tasks.toggle.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const item = await storage.toggleTask(Number(req.params.id));
      res.json(item);
    } catch (err) {
      res.status(404).json({ message: "Task not found" });
    }
  });

  app.delete(api.tasks.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // --- Library ---
  app.get(api.library.categories.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getLibraryCategories();
    res.json(items);
  });

  app.post(api.library.categories.create.path, isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const input = api.library.categories.create.input.parse(req.body);
      const item = await storage.createLibraryCategory(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.get(api.library.items.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const categoryId = Number(req.query.categoryId);
    const items = await storage.getLibraryItems(categoryId);
    res.json(items);
  });

  app.post(api.library.items.create.path, isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const input = api.library.items.create.input.parse(req.body);
      const item = await storage.createLibraryItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // --- Handovers ---
  app.get(api.handovers.list.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getHandovers(getUserId(req));
    res.json(items);
  });

  app.post(api.handovers.create.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.handovers.create.input.parse(req.body);
      const item = await storage.createHandover({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.put(api.handovers.update.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.handovers.update.input.parse(req.body);
      const item = await storage.updateHandover(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete(api.handovers.delete.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteHandover(Number(req.params.id));
    res.status(204).send();
  });

  // --- Goals ---
  app.get(api.goals.get.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const item = await storage.getGoal(getUserId(req), currentMonth);
    res.json(item || null);
  });

  app.post(api.goals.set.path, isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = api.goals.set.input.parse(req.body);
      const item = await storage.setGoal({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // --- Pathologies ---
  app.get("/api/pathologies", isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const scope = req.query.scope as string | undefined;
    const userId = getUserId(req);
    
    if (scope === "mine") {
      const items = await storage.getUserPathologies(userId, ageGroup);
      res.json(items);
    } else {
      const items = await storage.getPathologies(userId, ageGroup);
      res.json(items);
    }
  });

  app.get("/api/pathologies/my", isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const items = await storage.getUserPathologies(getUserId(req), ageGroup);
    res.json(items);
  });

  app.get("/api/pathologies/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const query = req.query.q as string || "";
    const items = await storage.searchPathologies(query, getUserId(req));
    res.json(items);
  });

  app.get("/api/pathologies/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const item = await storage.getPathology(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = item.userId === userId;
    const isAdminUser = user?.role === "admin";
    const isOfficialContent = item.isPublic === true;
    
    if (!isOfficialContent && !isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    
    res.json(item);
  });

  app.get("/api/pathologies/:id/medications", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const pathology = await storage.getPathology(Number(req.params.id));
    if (!pathology) return res.status(404).json({ message: "Patologia não encontrada" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    const isOfficialContent = pathology.isPublic === true;
    
    if (!isOfficialContent && !isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    
    const items = await storage.getPathologyMedications(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/pathologies", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const { isPublic, isLocked, ...data } = req.body;
    const user = await authStorage.getUser(userId);
    const item = await storage.createPathology({
      ...data,
      isPublic: user?.role === "admin" ? isPublic : false,
      isLocked: user?.role === "admin" ? isLocked : false,
      userId
    });
    res.status(201).json(item);
  });

  app.put("/api/pathologies/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const pathology = await storage.getPathology(Number(req.params.id));
    if (!pathology) return res.status(404).json({ message: "Not found" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    if (pathology.isLocked && !isAdminUser) {
      return res.status(403).json({ message: "Patologia bloqueada" });
    }
    
    const item = await storage.updatePathology(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/pathologies/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const pathology = await storage.getPathology(Number(req.params.id));
    if (!pathology) return res.status(404).json({ message: "Not found" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    if (pathology.isLocked && !isAdminUser) {
      return res.status(403).json({ message: "Patologia bloqueada" });
    }
    
    await storage.deletePathology(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/pathologies/:id/medications", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const pathology = await storage.getPathology(Number(req.params.id));
    if (!pathology) return res.status(404).json({ message: "Patologia não encontrada" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    if (pathology.isLocked && !isAdminUser) {
      return res.status(403).json({ message: "Patologia bloqueada" });
    }
    
    const item = await storage.createPathologyMedication({
      ...req.body,
      pathologyId: Number(req.params.id)
    });
    res.status(201).json(item);
  });

  app.put("/api/pathology-medications/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const medication = await storage.getPathologyMedicationById(Number(req.params.id));
    if (!medication) return res.status(404).json({ message: "Medicação não encontrada" });
    
    const pathology = await storage.getPathology(medication.pathologyId);
    if (!pathology) return res.status(404).json({ message: "Patologia não encontrada" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    if (pathology.isLocked && !isAdminUser) {
      return res.status(403).json({ message: "Patologia bloqueada" });
    }
    
    const item = await storage.updatePathologyMedication(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/pathology-medications/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const medication = await storage.getPathologyMedicationById(Number(req.params.id));
    if (!medication) return res.status(404).json({ message: "Medicação não encontrada" });
    
    const pathology = await storage.getPathology(medication.pathologyId);
    if (!pathology) return res.status(404).json({ message: "Patologia não encontrada" });
    
    const user = await authStorage.getUser(userId);
    const isOwner = pathology.userId === userId;
    const isAdminUser = user?.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    if (pathology.isLocked && !isAdminUser) {
      return res.status(403).json({ message: "Patologia bloqueada" });
    }
    
    await storage.deletePathologyMedication(Number(req.params.id));
    res.status(204).send();
  });

  // --- Medications Library ---
  app.get("/api/medications", isAuthenticated, checkNotBlocked, async (req, res) => {
    const ageGroup = req.query.ageGroup as string | undefined;
    const items = await storage.getMedications(ageGroup);
    res.json(items);
  });

  app.get("/api/medications/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const query = req.query.q as string || "";
    const items = await storage.searchMedications(query);
    res.json(items);
  });

  app.get("/api/medications/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getMedication(Number(req.params.id));
    res.json(item);
  });

  app.post("/api/medications", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createMedication(req.body);
    res.status(201).json(item);
  });

  app.put("/api/medications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateMedication(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/medications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteMedication(Number(req.params.id));
    res.status(204).send();
  });

  // --- Patient History ---
  app.get("/api/patient-history", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getPatientHistory(getUserId(req));
    res.json(items);
  });

  app.get("/api/patient-history/search", isAuthenticated, checkNotBlocked, async (req, res) => {
    const patientName = req.query.name as string || "";
    const items = await storage.searchPatientHistory(getUserId(req), patientName);
    res.json(items);
  });

  app.post("/api/patient-history", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.createPatientHistory({ ...req.body, userId: getUserId(req) });
    res.status(201).json(item);
  });

  app.delete("/api/patient-history/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deletePatientHistory(Number(req.params.id));
    res.status(204).send();
  });

  // --- Calculator Settings ---
  app.get("/api/calculator-settings", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getCalculatorSettings();
    res.json(items);
  });

  app.post("/api/calculator-settings", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createCalculatorSetting(req.body);
    res.status(201).json(item);
  });

  app.put("/api/calculator-settings/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateCalculatorSetting(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/calculator-settings/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteCalculatorSetting(Number(req.params.id));
    res.status(204).send();
  });

  // --- User Preferences ---
  app.get("/api/user-preferences", isAuthenticated, async (req, res) => {
    const prefs = await storage.getUserPreferences(getUserId(req));
    res.json(prefs || { theme: "system", colorScheme: "blue", fontSize: "medium", compactMode: false });
  });

  app.put("/api/user-preferences", isAuthenticated, async (req, res) => {
    const prefs = await storage.upsertUserPreferences(getUserId(req), req.body);
    res.json(prefs);
  });

  // --- Drug Interactions (Admin configurable) ---
  app.get("/api/drug-interactions", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getDrugInteractions();
    res.json(items);
  });

  app.get("/api/drug-interactions/check", isAuthenticated, checkNotBlocked, async (req, res) => {
    const drug1 = req.query.drug1 as string;
    const drug2 = req.query.drug2 as string;
    if (!drug1 || !drug2) {
      return res.status(400).json({ message: "Parâmetros drug1 e drug2 são obrigatórios" });
    }
    const interaction = await storage.checkDrugInteraction(drug1, drug2);
    res.json({ hasInteraction: !!interaction, interaction: interaction || null });
  });

  app.post("/api/drug-interactions", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createDrugInteraction(req.body);
    res.status(201).json(item);
  });

  app.put("/api/drug-interactions/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateDrugInteraction(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/drug-interactions/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteDrugInteraction(Number(req.params.id));
    res.status(204).send();
  });

  // --- Medication Contraindications (Admin configurable) ---
  app.get("/api/medication-contraindications", isAuthenticated, checkNotBlocked, async (req, res) => {
    const medicationName = req.query.medication as string | undefined;
    const items = await storage.getMedicationContraindications(medicationName);
    res.json(items);
  });

  app.post("/api/medication-contraindications", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createMedicationContraindication(req.body);
    res.status(201).json(item);
  });

  app.put("/api/medication-contraindications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateMedicationContraindication(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/medication-contraindications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteMedicationContraindication(Number(req.params.id));
    res.status(204).send();
  });

  // --- Prescription Favorites (User personalized copies) ---
  app.get("/api/prescription-favorites", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getPrescriptionFavorites(getUserId(req));
    res.json(items);
  });

  app.get("/api/prescription-favorites/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getPrescriptionFavorite(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Favorito não encontrado" });
    if (item.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    res.json(item);
  });

  // Import a shared prescription by token (public endpoint for logged-in users)
  app.get("/api/prescription-favorites/import/:token", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getPrescriptionFavoriteByToken(req.params.token);
    if (!item) return res.status(404).json({ message: "Prescrição não encontrada ou token inválido" });
    // Return the prescription data for import (without user info)
    res.json({
      title: item.title,
      medication: item.medication,
      dose: item.dose,
      pharmaceuticalForm: item.pharmaceuticalForm,
      interval: item.interval,
      quantity: item.quantity,
      duration: item.duration,
      route: item.route,
      timing: item.timing,
      patientNotes: item.patientNotes,
      orientations: item.orientations
    });
  });

  app.post("/api/prescription-favorites", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.createPrescriptionFavorite({ ...req.body, userId: getUserId(req) });
    res.status(201).json(item);
  });

  app.put("/api/prescription-favorites/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getPrescriptionFavorite(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Favorito não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    const item = await storage.updatePrescriptionFavorite(Number(req.params.id), req.body);
    res.json(item);
  });

  // Generate export token for sharing
  app.post("/api/prescription-favorites/:id/share", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getPrescriptionFavorite(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Favorito não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    
    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const item = await storage.updatePrescriptionFavorite(Number(req.params.id), { exportToken: token });
    res.json({ token: item.exportToken });
  });

  app.delete("/api/prescription-favorites/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getPrescriptionFavorite(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Favorito não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deletePrescriptionFavorite(Number(req.params.id));
    res.status(204).send();
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
      medication: "Dipirona",
      dose: "1g",
      interval: "6/6h",
      quantity: "1 ampola",
      duration: "Se dor ou febre",
      content: "Dipirona 1g, IV, 6/6h, se dor ou febre.",
      category: "Analgesia",
      ageGroup: "adulto",
      isPublic: true,
      isLocked: true,
      userId: null,
    });
    await storage.createPrescription({
      title: "Ceftriaxona",
      medication: "Ceftriaxona",
      dose: "1g",
      interval: "12/12h",
      quantity: "1 frasco-ampola",
      duration: "7 dias",
      content: "Ceftriaxona 1g, IV, 12/12h.",
      category: "Antibióticos",
      ageGroup: "adulto",
      isPublic: true,
      isLocked: true,
      userId: null,
    });
    await storage.createPrescription({
      title: "Amoxicilina Pediátrica",
      medication: "Amoxicilina suspensão",
      dose: "50mg/kg/dia",
      interval: "8/8h",
      quantity: "1 frasco",
      duration: "7 dias",
      content: "Amoxicilina 50mg/kg/dia, VO, 8/8h por 7 dias.",
      category: "Antibióticos",
      ageGroup: "pediatrico",
      isPublic: true,
      isLocked: true,
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

  // Seed default admin settings
  const pixSetting = await storage.getAdminSetting("pix_key");
  if (!pixSetting) {
    await storage.setAdminSetting("pix_key", "00.000.000/0001-00");
    await storage.setAdminSetting("whatsapp_number", "5500000000000");
    await storage.setAdminSetting("payment_instructions", "Após o pagamento, envie o comprovante via WhatsApp para liberação imediata.");
    await storage.setAdminSetting("subscription_price", "29,90");
    await storage.setAdminSetting("ai_prompt", "Você é um assistente médico especializado. Responda de forma clara e objetiva, sempre recomendando buscar um profissional de saúde para diagnósticos e tratamentos.");
  }
}
