import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertMonthlyExpenseSchema, insertFinancialGoalSchema } from "@shared/schema";
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

  // --- Monthly Expenses ---
  app.get("/api/monthly-expenses", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getMonthlyExpenses(getUserId(req));
    res.json(items);
  });

  app.post("/api/monthly-expenses", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = insertMonthlyExpenseSchema.parse({ ...req.body, userId: getUserId(req) });
      const item = await storage.createMonthlyExpense(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message || "Dados inválidos" });
      console.error("Error creating monthly expense:", err);
      res.status(500).json({ message: "Erro ao criar gasto" });
    }
  });

  app.put("/api/monthly-expenses/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const item = await storage.updateMonthlyExpense(Number(req.params.id), req.body);
      res.json(item);
    } catch (err) {
      console.error("Error updating monthly expense:", err);
      res.status(500).json({ message: "Erro ao atualizar gasto" });
    }
  });

  app.delete("/api/monthly-expenses/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteMonthlyExpense(Number(req.params.id));
    res.status(204).send();
  });

  // --- Financial Goals ---
  app.get("/api/financial-goals", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getFinancialGoals(getUserId(req));
    res.json(items);
  });

  app.post("/api/financial-goals", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const input = insertFinancialGoalSchema.parse({ ...req.body, userId: getUserId(req) });
      const item = await storage.createFinancialGoal(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message || "Dados inválidos" });
      console.error("Error creating financial goal:", err);
      res.status(500).json({ message: "Erro ao criar meta" });
    }
  });

  app.put("/api/financial-goals/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const item = await storage.updateFinancialGoal(Number(req.params.id), req.body);
      res.json(item);
    } catch (err) {
      console.error("Error updating financial goal:", err);
      res.status(500).json({ message: "Erro ao atualizar meta" });
    }
  });

  app.delete("/api/financial-goals/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    await storage.deleteFinancialGoal(Number(req.params.id));
    res.status(204).send();
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

  app.post("/api/pathologies/bulk", isAuthenticated, checkAdmin, async (req, res) => {
    const { pathologies: items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Array de patologias vazio ou inválido" });
    }
    
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const toInsert: any[] = [];
    
    for (const item of items) {
      if (!item.name || !item.ageGroup) {
        results.errors.push(`Patologia inválida: ${item.name || 'sem nome'}`);
        continue;
      }
      
      const existing = await storage.getPathologyByNameAndAgeGroup(item.name, item.ageGroup);
      if (existing) {
        results.skipped++;
        continue;
      }
      
      toInsert.push({
        name: item.name,
        description: item.description || null,
        ageGroup: item.ageGroup,
        clinicalCategory: item.clinicalCategory || null,
        sourceGroup: item.sourceGroup || null,
        category: item.category || null,
        specialty: item.specialty || null,
        tags: item.tags || null,
        isPublic: true,
        isLocked: true,
        userId: null,
      });
    }
    
    if (toInsert.length > 0) {
      await storage.createPathologiesBulk(toInsert);
      results.created = toInsert.length;
    }
    
    res.status(201).json(results);
  });

  app.post("/api/pathologies/:id/duplicate", isAuthenticated, checkAdmin, async (req, res) => {
    const { targetAgeGroup } = req.body;
    if (!targetAgeGroup || !['adulto', 'pediatrico'].includes(targetAgeGroup)) {
      return res.status(400).json({ message: "targetAgeGroup deve ser 'adulto' ou 'pediatrico'" });
    }
    
    const duplicated = await storage.duplicatePathologyToAgeGroup(Number(req.params.id), targetAgeGroup);
    if (!duplicated) {
      return res.status(409).json({ message: "Patologia já existe no grupo de idade alvo ou original não encontrada" });
    }
    
    res.status(201).json(duplicated);
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

  // --- Promo Coupons (Admin only) ---
  app.get("/api/promo-coupons", isAuthenticated, checkAdmin, async (req, res) => {
    const items = await storage.getPromoCoupons();
    res.json(items);
  });

  app.get("/api/promo-coupons/validate/:code", isAuthenticated, checkNotBlocked, async (req, res) => {
    const coupon = await storage.getPromoCouponByCode(req.params.code);
    if (!coupon) return res.status(404).json({ message: "Cupom não encontrado" });
    if (!coupon.isActive) return res.status(400).json({ message: "Cupom inativo" });
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({ message: "Cupom expirado" });
    }
    if (coupon.maxUses && coupon.currentUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ message: "Cupom esgotado" });
    }
    res.json({ 
      valid: true, 
      discountType: coupon.discountType, 
      discountValue: coupon.discountValue,
      discountMonths: coupon.discountMonths 
    });
  });

  app.post("/api/promo-coupons", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createPromoCoupon(req.body);
    res.status(201).json(item);
  });

  app.put("/api/promo-coupons/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updatePromoCoupon(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/promo-coupons/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deletePromoCoupon(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/promo-coupons/:id/use", isAuthenticated, checkNotBlocked, async (req, res) => {
    const usage = await storage.useCoupon(Number(req.params.id), getUserId(req));
    res.status(201).json(usage);
  });

  // --- Subscription System ---
  
  // Get current plan
  app.get("/api/subscription/plan", async (req, res) => {
    const plan = await storage.getActivePlan();
    if (!plan) {
      return res.json({ 
        name: "Salva Plantão Premium", 
        priceCents: 2990, 
        billingPeriod: "monthly" 
      });
    }
    res.json(plan);
  });

  // Get user subscription status
  app.get("/api/subscription/status", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const subscription = await storage.getActiveSubscription(userId);
    
    res.json({
      hasActiveSubscription: !!subscription,
      subscription,
      userStatus: user?.status || "pending",
      isAdmin: user?.role === "admin"
    });
  });

  // Validate coupon for subscription
  app.post("/api/subscription/validate-coupon", isAuthenticated, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Código do cupom é obrigatório" });
    
    const coupon = await storage.getPromoCouponByCode(code.toUpperCase().trim());
    if (!coupon) return res.status(404).json({ message: "Cupom não encontrado" });
    if (!coupon.isActive) return res.status(400).json({ message: "Cupom inativo" });
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({ message: "Cupom expirado" });
    }
    if (coupon.maxUses && coupon.currentUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ message: "Cupom esgotado" });
    }
    
    res.json({
      valid: true,
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountMonths: coupon.discountMonths
    });
  });

  // Create subscription with payment
  app.post("/api/subscription/create", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

      const { paymentMethod, couponCode, name, cpfCnpj, phone } = req.body;
      
      if (!paymentMethod || !['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Método de pagamento inválido" });
      }

      const plan = await storage.getActivePlan();
      let priceCents = plan?.priceCents || 2990;
      let discountCents = 0;
      let couponId: number | null = null;

      if (couponCode) {
        const coupon = await storage.getPromoCouponByCode(couponCode.toUpperCase().trim());
        if (coupon && coupon.isActive) {
          if (coupon.discountType === 'percentage') {
            discountCents = Math.floor(priceCents * (Number(coupon.discountValue) / 100));
          } else {
            discountCents = Math.floor(Number(coupon.discountValue) * 100);
          }
          couponId = coupon.id;
          await storage.updatePromoCoupon(coupon.id, { 
            currentUses: (coupon.currentUses || 0) + 1 
          });
        }
      }

      const finalAmount = Math.max(priceCents - discountCents, 0);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const subscription = await storage.createSubscription({
        userId,
        planId: plan?.id || 1,
        status: 'pending',
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        nextBillingDate: nextMonth,
        appliedCouponId: couponId
      });

      const asaasService = await import('./services/asaas');
      
      if (asaasService.isAsaasConfigured()) {
        const customer = await asaasService.getOrCreateCustomer({
          name: name || user.firstName || 'Usuário',
          email: user.email || `${userId}@salvaplantao.app`,
          cpfCnpj,
          phone
        });

        await storage.updateSubscription(subscription.id, {
          providerCustomerId: customer.id
        });

        const dueDate = asaasService.formatDateForAsaas(new Date());
        const asaasPayment = await asaasService.createPayment({
          customer: customer.id,
          billingType: paymentMethod as 'PIX' | 'CREDIT_CARD',
          value: finalAmount / 100,
          dueDate,
          description: `Assinatura Salva Plantão - ${plan?.name || 'Premium'}`,
          externalReference: `subscription-${subscription.id}`
        });

        let pixData = null;
        if (paymentMethod === 'PIX') {
          pixData = await asaasService.getPixQrCode(asaasPayment.id);
        }

        const payment = await storage.createPayment({
          subscriptionId: subscription.id,
          userId,
          providerPaymentId: asaasPayment.id,
          amountCents: finalAmount,
          discountCents,
          status: 'pending',
          method: paymentMethod,
          pixQrCode: pixData?.encodedImage,
          pixCopyPaste: pixData?.payload,
          pixExpiresAt: pixData ? new Date(pixData.expirationDate) : null,
          invoiceUrl: asaasPayment.invoiceUrl
        });

        res.json({
          subscription,
          payment,
          pixQrCode: pixData?.encodedImage,
          pixCopyPaste: pixData?.payload,
          invoiceUrl: asaasPayment.invoiceUrl
        });
      } else {
        const payment = await storage.createPayment({
          subscriptionId: subscription.id,
          userId,
          amountCents: finalAmount,
          discountCents,
          status: 'pending',
          method: paymentMethod
        });

        res.json({
          subscription,
          payment,
          message: 'Sistema de pagamento não configurado. Entre em contato com o suporte.'
        });
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: error.message || 'Erro ao criar assinatura' });
    }
  });

  // ASAAS Webhook for payment status updates
  app.post("/api/webhooks/asaas", async (req, res) => {
    try {
      const { event, payment: paymentData } = req.body;
      
      if (!paymentData?.id) {
        return res.status(400).json({ message: 'Invalid webhook data' });
      }

      const existingPayment = await storage.getPaymentByProviderId(paymentData.id);
      if (!existingPayment) {
        console.log('Payment not found for webhook:', paymentData.id);
        return res.status(200).json({ message: 'Payment not found, ignoring' });
      }

      let newStatus = existingPayment.status;
      switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          newStatus = 'paid';
          break;
        case 'PAYMENT_OVERDUE':
          newStatus = 'overdue';
          break;
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          newStatus = 'refunded';
          break;
        case 'PAYMENT_UPDATED':
          newStatus = paymentData.status?.toLowerCase() || existingPayment.status;
          break;
      }

      await storage.updatePayment(existingPayment.id, {
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : null
      });

      if (newStatus === 'paid' && existingPayment.subscriptionId) {
        const subscription = await storage.getSubscription(existingPayment.subscriptionId);
        if (subscription) {
          await storage.updateSubscription(subscription.id, {
            status: 'active',
            lastPaymentStatus: 'paid'
          });
          await authStorage.updateUserStatus(subscription.userId, 'active');
          notifyUser(subscription.userId, { 
            type: 'subscription_activated', 
            message: 'Sua assinatura foi ativada com sucesso!' 
          });
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Manual payment confirmation
  app.post("/api/admin/subscription/confirm-payment/:paymentId", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const paymentId = Number(req.params.paymentId);
      const payment = await storage.getPayment(paymentId);
      if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });

      await storage.updatePayment(paymentId, {
        status: 'paid',
        paidAt: new Date()
      });

      if (payment.subscriptionId) {
        const subscription = await storage.getSubscription(payment.subscriptionId);
        if (subscription) {
          await storage.updateSubscription(subscription.id, {
            status: 'active',
            lastPaymentStatus: 'paid'
          });
          await authStorage.updateUserStatus(subscription.userId, 'active');
          notifyUser(subscription.userId, { 
            type: 'subscription_activated', 
            message: 'Sua assinatura foi ativada pelo administrador!' 
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Get all subscriptions
  app.get("/api/admin/subscriptions", isAuthenticated, checkAdmin, async (req, res) => {
    const subs = await storage.getAllSubscriptions();
    res.json(subs);
  });

  // Admin: Get user payments
  app.get("/api/admin/payments/:userId", isAuthenticated, checkAdmin, async (req, res) => {
    const payments = await storage.getUserPayments(req.params.userId);
    res.json(payments);
  });

  // User: Get my payments
  app.get("/api/subscription/payments", isAuthenticated, async (req, res) => {
    const payments = await storage.getUserPayments(getUserId(req));
    res.json(payments);
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

  // --- Evolution Models ---
  app.get("/api/evolution-models", isAuthenticated, checkNotBlocked, async (req, res) => {
    const category = req.query.category as string | undefined;
    const items = await storage.getEvolutionModels(getUserId(req), category);
    res.json(items);
  });

  app.post("/api/evolution-models", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createEvolutionModel({ ...validated, userId: getUserId(req), isPublic: false });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/evolution-models/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getEvolutionModel(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Modelo não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    try {
      const schema = z.object({
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updateEvolutionModel(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/evolution-models/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getEvolutionModel(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Modelo não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deleteEvolutionModel(Number(req.params.id));
    res.status(204).send();
  });

  // --- Physical Exam Templates ---
  app.get("/api/physical-exam-templates", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getPhysicalExamTemplates(getUserId(req));
    res.json(items);
  });

  app.post("/api/physical-exam-templates", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const schema = z.object({
        section: z.string().min(1).max(100),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        order: z.number().optional(),
        isPublic: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createPhysicalExamTemplate({ ...validated, userId: getUserId(req), isPublic: false });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/physical-exam-templates/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getPhysicalExamTemplate(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Template não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    try {
      const schema = z.object({
        section: z.string().min(1).max(100).optional(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        order: z.number().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updatePhysicalExamTemplate(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/physical-exam-templates/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getPhysicalExamTemplate(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Template não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deletePhysicalExamTemplate(Number(req.params.id));
    res.status(204).send();
  });

  // --- Signs and Symptoms (Admin only for creation) ---
  app.get("/api/signs-symptoms", isAuthenticated, checkNotBlocked, async (req, res) => {
    const category = req.query.category as string | undefined;
    const items = await storage.getSignsSymptoms(getUserId(req), category);
    res.json(items);
  });

  app.post("/api/admin/signs-symptoms", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createSignsSymptoms({ ...validated, userId: getUserId(req), isPublic: true });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/signs-symptoms/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updateSignsSymptoms(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/signs-symptoms/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteSignsSymptoms(Number(req.params.id));
    res.status(204).send();
  });

  // --- Semiological Signs (Admin only for creation) ---
  app.get("/api/semiological-signs", isAuthenticated, checkNotBlocked, async (req, res) => {
    const category = req.query.category as string | undefined;
    const items = await storage.getSemiologicalSigns(getUserId(req), category);
    res.json(items);
  });

  app.post("/api/admin/semiological-signs", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createSemiologicalSigns({ ...validated, userId: getUserId(req), isPublic: true });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/semiological-signs/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updateSemiologicalSigns(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/semiological-signs/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteSemiologicalSigns(Number(req.params.id));
    res.status(204).send();
  });

  // --- Medical Certificates ---
  app.get("/api/medical-certificates", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getMedicalCertificates(getUserId(req));
    res.json(items);
  });

  app.post("/api/medical-certificates", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const schema = z.object({
        patientName: z.string().min(1).max(255),
        patientDocument: z.string().optional(),
        daysOff: z.number().min(1).max(365),
        startDate: z.coerce.date(),
        reason: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createMedicalCertificate({ ...validated, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/medical-certificates/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getMedicalCertificate(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Atestado não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deleteMedicalCertificate(Number(req.params.id));
    res.status(204).send();
  });

  // --- Attendance Declarations ---
  app.get("/api/attendance-declarations", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getAttendanceDeclarations(getUserId(req));
    res.json(items);
  });

  app.post("/api/attendance-declarations", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const schema = z.object({
        patientName: z.string().min(1).max(255),
        patientDocument: z.string().optional(),
        attendanceDate: z.coerce.date(),
        period: z.string().min(1).max(50),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createAttendanceDeclaration({ ...validated, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/attendance-declarations/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getAttendanceDeclaration(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Declaração não encontrada" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deleteAttendanceDeclaration(Number(req.params.id));
    res.status(204).send();
  });

  // --- Medical Referrals ---
  app.get("/api/medical-referrals", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getMedicalReferrals(getUserId(req));
    res.json(items);
  });

  app.post("/api/medical-referrals", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const schema = z.object({
        patientName: z.string().min(1).max(255),
        patientBirthDate: z.coerce.date().nullable().optional(),
        patientAge: z.string().optional(),
        patientSex: z.string().optional(),
        patientDocument: z.string().optional(),
        patientAddress: z.string().optional(),
        originUnit: z.string().optional(),
        vitalSigns: z.any().optional(),
        referralReason: z.string().min(1),
        destination: z.string().min(1),
        clinicalHistory: z.string().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createMedicalReferral({ ...validated, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/medical-referrals/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const existing = await storage.getMedicalReferral(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Encaminhamento não encontrado" });
    if (existing.userId !== getUserId(req)) return res.status(403).json({ message: "Não autorizado" });
    await storage.deleteMedicalReferral(Number(req.params.id));
    res.status(204).send();
  });

  // --- Referral Destinations (Admin) ---
  app.get("/api/referral-destinations", isAuthenticated, async (req, res) => {
    const items = await storage.getReferralDestinations();
    res.json(items);
  });

  app.post("/api/admin/referral-destinations", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255),
        address: z.string().optional(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createReferralDestination(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/referral-destinations/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updateReferralDestination(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/referral-destinations/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteReferralDestination(Number(req.params.id));
    res.status(204).send();
  });

  // --- Referral Reasons (Admin) ---
  app.get("/api/referral-reasons", isAuthenticated, async (req, res) => {
    const items = await storage.getReferralReasons();
    res.json(items);
  });

  app.post("/api/admin/referral-reasons", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1).max(255),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createReferralReason(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/referral-reasons/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1).max(255).optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updateReferralReason(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/referral-reasons/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteReferralReason(Number(req.params.id));
    res.status(204).send();
  });

  // --- Prescription Models (Admin) ---
  app.get("/api/prescription-models", isAuthenticated, checkNotBlocked, async (req, res) => {
    const pathologyId = req.query.pathologyId ? Number(req.query.pathologyId) : undefined;
    const items = await storage.getPrescriptionModels(pathologyId);
    res.json(items);
  });

  app.get("/api/prescription-models/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getPrescriptionModel(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Modelo não encontrado" });
    res.json(item);
  });

  app.get("/api/prescription-models/:id/medications", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getPrescriptionModelMedications(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/admin/prescription-models", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        pathologyId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        orientations: z.string().optional(),
        observations: z.string().optional(),
        ageGroup: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createPrescriptionModel(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/prescription-models/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        pathologyId: z.number().optional(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        orientations: z.string().optional(),
        observations: z.string().optional(),
        ageGroup: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updatePrescriptionModel(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/prescription-models/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deletePrescriptionModel(Number(req.params.id));
    res.status(204).send();
  });

  // --- Prescription Model Medications (Admin) ---
  app.post("/api/admin/prescription-model-medications", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        prescriptionModelId: z.number(),
        medicationId: z.number().optional(),
        medication: z.string().min(1).max(255),
        pharmaceuticalForm: z.string().optional(),
        dose: z.string().optional(),
        dosePerKg: z.string().optional(),
        maxDose: z.string().optional(),
        interval: z.string().optional(),
        duration: z.string().optional(),
        route: z.string().optional(),
        quantity: z.string().optional(),
        timing: z.string().optional(),
        observations: z.string().optional(),
        order: z.number().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.createPrescriptionModelMedication(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/admin/prescription-model-medications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const schema = z.object({
        medication: z.string().min(1).max(255).optional(),
        pharmaceuticalForm: z.string().optional(),
        dose: z.string().optional(),
        dosePerKg: z.string().optional(),
        maxDose: z.string().optional(),
        interval: z.string().optional(),
        duration: z.string().optional(),
        route: z.string().optional(),
        quantity: z.string().optional(),
        timing: z.string().optional(),
        observations: z.string().optional(),
        order: z.number().optional(),
      });
      const validated = schema.parse(req.body);
      const item = await storage.updatePrescriptionModelMedication(Number(req.params.id), validated);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.delete("/api/admin/prescription-model-medications/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deletePrescriptionModelMedication(Number(req.params.id));
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
