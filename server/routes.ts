/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

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
import { notifyUser, notifyAllAdmins, broadcastToRoom } from "./websocket";
import { chatRooms, chatRoomMembers, chatMessages, chatContacts, chatBlockedMessages, chatUserBans, chatBannedWords } from "@shared/schema";
import { registerAuthRoutes as registerNewAuthRoutes } from "./auth/authRoutes";
import { registerBillingRoutes } from "./auth/billingRoutes";
import { registerNewFeaturesRoutes } from "./routes/newFeaturesRoutes";
import { registerUserProfileRoutes } from "./routes/userProfileRoutes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerNewAuthRoutes(app);
  registerBillingRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAiRoutes(app);
  registerNewFeaturesRoutes(app);
  registerUserProfileRoutes(app);
  
  // Seed default plans on startup
  await storage.upsertPlans().catch(err => console.error('Failed to seed plans:', err));
  await storage.seedBillingPlans().catch(err => console.error('Failed to seed billing plans:', err));

  const getUserId = (req: any) => req.user?.claims?.sub;
  
  // Track user activity (lastSeen, sessions) - called on authenticated routes
  const trackUserActivity = async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    if (userId) {
      // Check if this is a new session (check session flag)
      const sessionKey = `tracked_session_${userId}`;
      if (!req.session?.[sessionKey]) {
        // New session - increment session count
        await storage.incrementSessionCount(userId).catch(() => {});
        if (req.session) {
          req.session[sessionKey] = true;
        }
      } else {
        // Just update lastSeen
        await storage.updateLastSeen(userId).catch(() => {});
      }
    }
    next();
  };
  
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
     
     // Admin always has access
     if (user?.role === "admin") {
        return next();
     }
     
     // Check if user is active
     if (user?.status !== "active") {
        return res.status(403).json({ 
          message: "Conta pendente de pagamento ou bloqueada",
          status: user?.status,
          subscriptionExpired: false
        });
     }
     
     // Check subscription expiration
     if (user?.subscriptionExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(user.subscriptionExpiresAt);
        if (expiresAt < now) {
           return res.status(403).json({ 
             message: "Assinatura expirada",
             status: user.status,
             subscriptionExpired: true,
             expiresAt: user.subscriptionExpiresAt
           });
        }
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

  // Activate user with subscription (sets status to active and subscription expiration)
  app.patch("/api/admin/users/:id/activate", isAuthenticated, checkAdmin, async (req, res) => {
    const { days = 30 } = req.body; // Default 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const user = await authStorage.activateUserWithSubscription(req.params.id, expiresAt);
    res.json(user);
  });

  // --- Enhanced User Management ---
  // Get detailed user info (profile, usage stats, coupons, billing)
  app.get("/api/admin/users/:id/details", isAuthenticated, checkAdmin, async (req, res) => {
    const userId = req.params.id;
    const user = await authStorage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const [adminProfile, usageStats, couponUsage, billingStatus] = await Promise.all([
      storage.getUserAdminProfile(userId),
      storage.getUserUsageStats(userId),
      storage.getUserCouponUsage(userId),
      storage.getUserBillingStatus(userId)
    ]);
    
    res.json({
      user,
      adminProfile,
      usageStats,
      couponUsage,
      billingStatus
    });
  });

  // Update user admin profile (tags, flags, notes)
  app.patch("/api/admin/users/:id/profile", isAuthenticated, checkAdmin, async (req, res) => {
    const { tags, isGoodUser, isRiskUser, adminNotes, isBlocked } = req.body;
    const profile = await storage.upsertUserAdminProfile({
      userId: req.params.id,
      tags: tags || [],
      isGoodUser: isGoodUser ?? false,
      isRiskUser: isRiskUser ?? false,
      adminNotes: adminNotes || "",
      isBlocked: isBlocked ?? false
    });
    res.json(profile);
  });

  // Add coupon usage for a user
  app.post("/api/admin/users/:id/coupon", isAuthenticated, checkAdmin, async (req, res) => {
    const { couponCode, campaign } = req.body;
    if (!couponCode) return res.status(400).json({ message: "couponCode required" });
    const usage = await storage.createUserCouponUsage({
      userId: req.params.id,
      couponCode,
      campaign
    });
    res.json(usage);
  });

  // Get all unique coupon codes for dropdown
  app.get("/api/admin/coupons", isAuthenticated, checkAdmin, async (req, res) => {
    const codes = await storage.getAllCouponCodes();
    res.json(codes);
  });

  // Update user billing status (read-only cache from ASAAS)
  app.patch("/api/admin/users/:id/billing", isAuthenticated, checkAdmin, async (req, res) => {
    const { asaasCustomerId, asaasSubscriptionId, planName, nextDueDate, lastPaymentDate, status, overdueDays } = req.body;
    const billing = await storage.upsertUserBillingStatus({
      userId: req.params.id,
      asaasCustomerId,
      asaasSubscriptionId,
      planName,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate) : null,
      status,
      overdueDays
    });
    res.json(billing);
  });

  // Get all users with enhanced details for list view (optimized with bulk queries and pagination)
  app.get("/api/admin/users-enhanced", isAuthenticated, checkAdmin, trackUserActivity, async (req, res) => {
    const { search, status, role, tag, hasQualityFlag, sortBy, sortOrder, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 200); // Max 200 per page
    
    const allUsers = await authStorage.getAllUsers();
    
    // Apply basic filters first to reduce the dataset before fetching auxiliary data
    let filtered = allUsers;
    
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        u.firstName?.toLowerCase().includes(searchLower) ||
        u.lastName?.toLowerCase().includes(searchLower)
      );
    }
    if (status && typeof status === "string") {
      filtered = filtered.filter(u => u.status === status);
    }
    if (role && typeof role === "string") {
      filtered = filtered.filter(u => u.role === role);
    }
    
    // Extract IDs of filtered users only and fetch auxiliary data in bulk
    const userIds = filtered.map(u => u.id);
    const [usageStatsMap, adminProfilesMap] = await Promise.all([
      storage.getUserUsageStatsBulk(userIds),
      storage.getUserAdminProfilesBulk(userIds)
    ]);
    
    let enhanced = filtered.map(u => ({
      ...u,
      usageStats: usageStatsMap.get(u.id) || null,
      adminProfile: adminProfilesMap.get(u.id) || null
    }));
    
    // Apply filters that require auxiliary data
    if (tag && typeof tag === "string") {
      enhanced = enhanced.filter(u => u.adminProfile?.tags?.includes(tag));
    }
    if (hasQualityFlag && typeof hasQualityFlag === "string") {
      const flag = hasQualityFlag === "isGoodUser" ? "isGoodUser" : hasQualityFlag === "isRiskUser" ? "isRiskUser" : null;
      if (flag) {
        enhanced = enhanced.filter(u => u.adminProfile?.[flag] === true);
      }
    }
    
    // Sorting
    if (sortBy && typeof sortBy === "string") {
      enhanced.sort((a, b) => {
        let aVal: number, bVal: number;
        if (sortBy === "lastSeen") {
          aVal = a.usageStats?.lastSeenAt ? new Date(a.usageStats.lastSeenAt).getTime() : 0;
          bVal = b.usageStats?.lastSeenAt ? new Date(b.usageStats.lastSeenAt).getTime() : 0;
        } else if (sortBy === "sessions") {
          aVal = a.usageStats?.sessionsCount || 0;
          bVal = b.usageStats?.sessionsCount || 0;
        } else if (sortBy === "createdAt") {
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        } else {
          return 0;
        }
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }
    
    // Calculate aggregate stats on the full filtered dataset before pagination
    const stats = {
      total: enhanced.length,
      active: enhanced.filter(u => u.status === "active").length,
      pending: enhanced.filter(u => u.status === "pending").length,
      blocked: enhanced.filter(u => u.status === "blocked").length,
      goodUsers: enhanced.filter(u => u.adminProfile?.isGoodUser).length,
      riskUsers: enhanced.filter(u => u.adminProfile?.isRiskUser).length
    };
    
    // Pagination
    const totalCount = enhanced.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = enhanced.slice(startIndex, startIndex + limitNum);
    
    res.json({
      users: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      },
      stats
    });
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

  // --- Admin Bulk Import ---
  // Bulk import pathologies
  app.post("/api/admin/import/pathologies", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { data, upsert = false, format = "csv" } = req.body;
      
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: "Campo 'data' é obrigatório (texto)" });
      }

      const items: any[] = [];
      const parseErrors: string[] = [];

      if (format === "json") {
        try {
          const parsed = JSON.parse(data);
          const pathologies = parsed.pathologies || parsed;
          if (!Array.isArray(pathologies)) {
            return res.status(400).json({ message: "JSON deve conter array 'pathologies'" });
          }
          for (let i = 0; i < pathologies.length; i++) {
            const p = pathologies[i];
            if (!p.name && !p.pathology_name) {
              parseErrors.push(`Item ${i + 1}: nome obrigatório`);
              continue;
            }
            items.push({
              name: p.name || p.pathology_name,
              description: p.description || null,
              ageGroup: p.ageGroup || p.age_group || "adulto",
              specialty: p.specialty || null,
              tags: p.tags || [],
              isPublic: true,
              isLocked: true,
            });
          }
        } catch (e) {
          return res.status(400).json({ message: "JSON inválido" });
        }
      } else {
        const lines = data.trim().split('\n').filter((line: string) => line.trim());
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(';').map((p: string) => p.trim());
          const name = parts[0];
          
          if (!name) {
            parseErrors.push(`Linha ${i + 1}: nome obrigatório`);
            continue;
          }
          
          items.push({
            name,
            description: parts[1] || null,
            ageGroup: parts[2] || "adulto",
            specialty: parts[3] || null,
            tags: parts[4] ? parts[4].split(',').map((t: string) => t.trim()) : [],
            isPublic: true,
            isLocked: true,
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "Nenhum item válido para importar", errors: parseErrors });
      }

      const result = await storage.bulkImportPathologies(items, upsert);
      res.json({
        created: result.created,
        updated: result.updated,
        errors: [...parseErrors, ...result.errors],
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao importar patologias", error: String(error) });
    }
  });

  // Bulk import protocols
  app.post("/api/admin/import/protocols", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { data, upsert = false, format = "csv" } = req.body;
      
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: "Campo 'data' é obrigatório (texto)" });
      }

      const items: any[] = [];
      const parseErrors: string[] = [];

      if (format === "json") {
        try {
          const parsed = JSON.parse(data);
          const protocols = parsed.protocols || parsed;
          if (!Array.isArray(protocols)) {
            return res.status(400).json({ message: "JSON deve conter array 'protocols'" });
          }
          for (let i = 0; i < protocols.length; i++) {
            const p = protocols[i];
            if (!p.title && !p.protocol_title) {
              parseErrors.push(`Item ${i + 1}: título obrigatório`);
              continue;
            }
            items.push({
              title: p.title || p.protocol_title,
              content: p.content || p.body || p.protocol_body || { text: "" },
              description: p.description || null,
              ageGroup: p.ageGroup || p.age_group || "adulto",
              specialty: p.specialty || null,
              category: p.category || null,
              tags: p.tags || [],
              isPublic: true,
              isLocked: true,
            });
          }
        } catch (e) {
          return res.status(400).json({ message: "JSON inválido" });
        }
      } else {
        const lines = data.trim().split('\n').filter((line: string) => line.trim());
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(';').map((p: string) => p.trim());
          const title = parts[0];
          
          if (!title) {
            parseErrors.push(`Linha ${i + 1}: título obrigatório`);
            continue;
          }
          
          items.push({
            title,
            content: { text: parts[1] || "" },
            description: parts[2] || null,
            ageGroup: parts[3] || "adulto",
            specialty: parts[4] || null,
            category: parts[5] || null,
            tags: parts[6] ? parts[6].split(',').map((t: string) => t.trim()) : [],
            isPublic: true,
            isLocked: true,
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "Nenhum item válido para importar", errors: parseErrors });
      }

      const result = await storage.bulkImportProtocols(items, upsert);
      res.json({
        created: result.created,
        updated: result.updated,
        errors: [...parseErrors, ...result.errors],
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao importar protocolos", error: String(error) });
    }
  });

  // Bulk import checklists (Admin - official)
  app.post("/api/admin/import/checklists", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { data, upsert = false, format = "csv" } = req.body;
      
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: "Campo 'data' é obrigatório (texto)" });
      }

      const items: any[] = [];
      const parseErrors: string[] = [];

      if (format === "json") {
        try {
          const parsed = JSON.parse(data);
          const checklists = parsed.checklists || parsed;
          if (!Array.isArray(checklists)) {
            return res.status(400).json({ message: "JSON deve conter array 'checklists'" });
          }
          for (let i = 0; i < checklists.length; i++) {
            const c = checklists[i];
            if (!c.title && !c.checklist_title) {
              parseErrors.push(`Item ${i + 1}: título obrigatório`);
              continue;
            }
            items.push({
              title: c.title || c.checklist_title,
              content: c.content || c.body || { items: (c.checklist_body || "").split('\n').filter((l: string) => l.trim()) },
              description: c.description || null,
              ageGroup: c.ageGroup || c.age_group || "adulto",
              specialty: c.specialty || null,
              category: c.category || null,
              pathologyName: c.pathologyName || c.pathology_name || null,
              tags: c.tags || [],
              sortOrder: c.sortOrder || c.sort_order || 0,
              isPublic: true,
              isLocked: true,
            });
          }
        } catch (e) {
          return res.status(400).json({ message: "JSON inválido" });
        }
      } else {
        const lines = data.trim().split('\n').filter((line: string) => line.trim());
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(';').map((p: string) => p.trim());
          const title = parts[0];
          
          if (!title) {
            parseErrors.push(`Linha ${i + 1}: título obrigatório`);
            continue;
          }
          
          const bodyText = (parts[1] || "").replace(/\\n/g, '\n');
          items.push({
            title,
            content: { items: bodyText.split('\n').filter((l: string) => l.trim()) },
            description: parts[2] || null,
            ageGroup: parts[3] || "adulto",
            specialty: parts[4] || null,
            category: parts[5] || null,
            pathologyName: parts[6] || null,
            tags: parts[7] ? parts[7].split(',').map((t: string) => t.trim()) : [],
            sortOrder: parseInt(parts[8]) || 0,
            isPublic: true,
            isLocked: true,
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "Nenhum item válido para importar", errors: parseErrors });
      }

      const result = await storage.bulkImportChecklists(items, upsert);
      res.json({
        created: result.created,
        updated: result.updated,
        errors: [...parseErrors, ...result.errors],
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao importar checklists", error: String(error) });
    }
  });

  // Calculator Allowed Meds (Admin)
  app.get("/api/calculator-allowed-meds", isAuthenticated, async (req, res) => {
    try {
      const patientType = req.query.patientType as string | undefined;
      const meds = await storage.getCalculatorAllowedMeds(patientType);
      res.json(meds);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar medicamentos autorizados" });
    }
  });

  app.post("/api/admin/calculator-allowed-meds", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const med = await storage.createCalculatorAllowedMed(req.body);
      res.json(med);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar medicamento autorizado" });
    }
  });

  app.delete("/api/admin/calculator-allowed-meds/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      await storage.deleteCalculatorAllowedMed(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover medicamento autorizado" });
    }
  });

  // Dashboard Config
  app.get("/api/dashboard-config", isAuthenticated, async (req, res) => {
    try {
      const scope = req.query.scope as string || "user_default";
      const config = await storage.getDashboardConfig(scope);
      res.json(config || { widgets: [] });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar config do dashboard" });
    }
  });

  app.get("/api/admin/dashboard-config", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const config = await storage.getDashboardConfig("user_default");
      res.json(config?.widgets || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar config do dashboard" });
    }
  });

  app.post("/api/admin/dashboard-config", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const config = await storage.upsertDashboardConfig({ scope: "user_default", widgets: req.body.widgets || req.body });
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar config do dashboard" });
    }
  });

  // Quick Access Config
  app.get("/api/quick-access-config", isAuthenticated, async (req, res) => {
    try {
      const patientType = req.query.patientType as string | undefined;
      const configs = await storage.getQuickAccessConfigs(patientType);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar config de acesso rápido" });
    }
  });

  app.get("/api/admin/quick-access-config", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const configs = await storage.getQuickAccessConfigs();
      const config = configs.find(c => c.patientType === "ambos") || configs[0];
      res.json(config?.items || []);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar config de acesso rápido" });
    }
  });

  app.post("/api/admin/quick-access-config", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const config = await storage.upsertQuickAccessConfig({ patientType: "ambos", items: req.body.items || req.body, isActive: true });
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar config de acesso rápido" });
    }
  });

  // Donation Causes
  app.get("/api/donation-causes", isAuthenticated, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const causes = await storage.getDonationCauses(activeOnly);
      res.json(causes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar causas de doação" });
    }
  });

  app.get("/api/donation-causes/:id", isAuthenticated, async (req, res) => {
    try {
      const cause = await storage.getDonationCause(parseInt(req.params.id));
      if (!cause) return res.status(404).json({ message: "Causa não encontrada" });
      res.json(cause);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar causa" });
    }
  });

  app.post("/api/admin/donation-causes", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const cause = await storage.createDonationCause(req.body);
      res.json(cause);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar causa" });
    }
  });

  app.patch("/api/admin/donation-causes/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const cause = await storage.updateDonationCause(parseInt(req.params.id), req.body);
      res.json(cause);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar causa" });
    }
  });

  app.delete("/api/admin/donation-causes/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      await storage.deleteDonationCause(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir causa" });
    }
  });

  // Emergency Panel Items
  app.get("/api/emergency-panel-items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getEmergencyPanelItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar itens de emergência" });
    }
  });

  app.get("/api/emergency-panel-items/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getEmergencyPanelItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Item não encontrado" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar item" });
    }
  });

  app.post("/api/admin/emergency-panel-items", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const item = await storage.createEmergencyPanelItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar item de emergência" });
    }
  });

  app.patch("/api/admin/emergency-panel-items/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const item = await storage.updateEmergencyPanelItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar item" });
    }
  });

  app.delete("/api/admin/emergency-panel-items/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      await storage.deleteEmergencyPanelItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir item" });
    }
  });

  app.post("/api/admin/emergency-panel-items/reorder", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ message: "items deve ser um array" });
      await storage.reorderEmergencyPanelItems(items);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao reordenar itens" });
    }
  });

  // Donations
  app.get("/api/donations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user?.role === "admin";
      const donations = await storage.getDonations(isAdmin ? undefined : user.id);
      res.json(donations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar doações" });
    }
  });

  app.get("/api/donations/:id", isAuthenticated, async (req, res) => {
    try {
      const donation = await storage.getDonation(parseInt(req.params.id));
      if (!donation) return res.status(404).json({ message: "Doação não encontrada" });
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar doação" });
    }
  });

  app.post("/api/donations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const donation = await storage.createDonation({ ...req.body, userId: user.id });
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar doação" });
    }
  });

  app.patch("/api/admin/donations/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const donation = await storage.updateDonation(parseInt(req.params.id), req.body);
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar doação" });
    }
  });

  // Donation Receipts
  app.get("/api/donations/:id/receipts", isAuthenticated, async (req, res) => {
    try {
      const receipts = await storage.getDonationReceipts(parseInt(req.params.id));
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comprovantes" });
    }
  });

  app.post("/api/admin/donations/:id/receipts", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const receipt = await storage.createDonationReceipt({ ...req.body, donationId: parseInt(req.params.id) });
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar comprovante" });
    }
  });

  // Batch Operations (Admin only)
  app.post("/api/admin/batch/medications/activate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateMedication(id, { isActive: true })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao ativar medicamentos" });
    }
  });

  app.post("/api/admin/batch/medications/deactivate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateMedication(id, { isActive: false })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao desativar medicamentos" });
    }
  });

  app.post("/api/admin/batch/medications/delete", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      await Promise.all(ids.map(id => storage.deleteMedication(id)));
      res.json({ deleted: ids.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir medicamentos" });
    }
  });

  app.post("/api/admin/batch/pathologies/activate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updatePathology(id, { isPublic: true })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao ativar patologias" });
    }
  });

  app.post("/api/admin/batch/pathologies/deactivate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updatePathology(id, { isPublic: false })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao desativar patologias" });
    }
  });

  app.post("/api/admin/batch/pathologies/delete", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      await Promise.all(ids.map(id => storage.deletePathology(id)));
      res.json({ deleted: ids.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir patologias" });
    }
  });

  app.post("/api/admin/batch/protocols/activate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateProtocol(id, { isPublic: true })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao ativar protocolos" });
    }
  });

  app.post("/api/admin/batch/protocols/deactivate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateProtocol(id, { isPublic: false })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao desativar protocolos" });
    }
  });

  app.post("/api/admin/batch/protocols/delete", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      await Promise.all(ids.map(id => storage.deleteProtocol(id)));
      res.json({ deleted: ids.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir protocolos" });
    }
  });

  app.post("/api/admin/batch/checklists/activate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateChecklist(id, { isPublic: true })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao ativar checklists" });
    }
  });

  app.post("/api/admin/batch/checklists/deactivate", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      const results = await Promise.all(ids.map(id => storage.updateChecklist(id, { isPublic: false })));
      res.json({ updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao desativar checklists" });
    }
  });

  app.post("/api/admin/batch/checklists/delete", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs são obrigatórios" });
      }
      await Promise.all(ids.map(id => storage.deleteChecklist(id)));
      res.json({ deleted: ids.length });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir checklists" });
    }
  });

  // Export selected items
  app.post("/api/admin/batch/export", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { entityType, ids, format = "json" } = req.body;
      if (!entityType || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "entityType e ids são obrigatórios" });
      }

      let items: any[] = [];
      switch (entityType) {
        case "medications":
          items = await Promise.all(ids.map(id => storage.getMedication(id)));
          break;
        case "pathologies":
          items = await Promise.all(ids.map(id => storage.getPathology(id)));
          break;
        case "protocols":
          items = await Promise.all(ids.map(id => storage.getProtocol(id)));
          break;
        case "checklists":
          items = await Promise.all(ids.map(id => storage.getChecklist(id)));
          break;
        default:
          return res.status(400).json({ message: "Tipo de entidade inválido" });
      }

      items = items.filter(Boolean);

      if (format === "csv") {
        if (items.length === 0) {
          return res.status(404).json({ message: "Nenhum item encontrado" });
        }
        const headers = Object.keys(items[0]).join(";");
        const rows = items.map(item => Object.values(item).map(v => typeof v === "object" ? JSON.stringify(v) : v).join(";"));
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${entityType}_export.csv`);
        res.send([headers, ...rows].join("\n"));
      } else {
        res.json({ [entityType]: items });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao exportar dados" });
    }
  });

  // User bulk import checklists (personal)
  app.post("/api/user/import/checklists", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { data, upsert = false, format = "csv" } = req.body;
      
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: "Campo 'data' é obrigatório (texto)" });
      }

      const items: any[] = [];
      const parseErrors: string[] = [];

      if (format === "json") {
        try {
          const parsed = JSON.parse(data);
          const checklists = parsed.checklists || parsed;
          if (!Array.isArray(checklists)) {
            return res.status(400).json({ message: "JSON deve conter array 'checklists'" });
          }
          for (let i = 0; i < checklists.length; i++) {
            const c = checklists[i];
            if (!c.title) {
              parseErrors.push(`Item ${i + 1}: título obrigatório`);
              continue;
            }
            items.push({
              title: c.title,
              content: c.content || { items: [] },
              description: c.description || null,
              ageGroup: c.ageGroup || "adulto",
              specialty: c.specialty || null,
              category: c.category || null,
              pathologyName: c.pathologyName || null,
              tags: c.tags || [],
              sortOrder: c.sortOrder || 0,
              isPublic: false,
              isLocked: false,
              userId,
            });
          }
        } catch (e) {
          return res.status(400).json({ message: "JSON inválido" });
        }
      } else {
        const lines = data.trim().split('\n').filter((line: string) => line.trim());
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(';').map((p: string) => p.trim());
          const title = parts[0];
          
          if (!title) {
            parseErrors.push(`Linha ${i + 1}: título obrigatório`);
            continue;
          }
          
          const bodyText = (parts[1] || "").replace(/\\n/g, '\n');
          items.push({
            title,
            content: { items: bodyText.split('\n').filter((l: string) => l.trim()) },
            description: parts[2] || null,
            ageGroup: parts[3] || "adulto",
            specialty: parts[4] || null,
            category: parts[5] || null,
            pathologyName: parts[6] || null,
            tags: parts[7] ? parts[7].split(',').map((t: string) => t.trim()) : [],
            sortOrder: parseInt(parts[8]) || 0,
            isPublic: false,
            isLocked: false,
            userId,
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "Nenhum item válido para importar", errors: parseErrors });
      }

      let created = 0;
      const errors: string[] = [];
      for (const item of items) {
        try {
          await storage.createChecklist(item);
          created++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : 'Erro desconhecido');
        }
      }

      res.json({
        created,
        updated: 0,
        errors: [...parseErrors, ...errors],
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao importar checklists", error: String(error) });
    }
  });

  // Checklist user copy endpoints
  app.post("/api/checklists/:id/copy", isAuthenticated, checkNotBlocked, async (req, res) => {
    try {
      const userId = getUserId(req);
      const sourceId = Number(req.params.id);
      
      // Check if user already has a copy
      const existingCopy = await storage.getUserChecklistCopy(userId, sourceId);
      if (existingCopy) {
        return res.json(existingCopy);
      }
      
      const copy = await storage.createUserChecklistCopy(userId, sourceId, req.body);
      res.status(201).json(copy);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar cópia do checklist", error: String(error) });
    }
  });

  app.get("/api/checklists/:id/user-copy", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const sourceId = Number(req.params.id);
    const copy = await storage.getUserChecklistCopy(userId, sourceId);
    res.json(copy || null);
  });

  app.delete("/api/checklists/:id/user-copy", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const sourceId = Number(req.params.id);
    await storage.deleteUserChecklistCopy(userId, sourceId);
    res.status(204).send();
  });

  // --- Prescriptions ---
  app.get(api.prescriptions.list.path, isAuthenticated, checkNotBlocked, trackUserActivity, async (req, res) => {
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

  app.post("/api/prescriptions/bulk-import", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { prescriptions: prescList, mode = "create" } = req.body;
      const userId = getUserId(req);
      
      if (!Array.isArray(prescList) || prescList.length === 0) {
        return res.status(400).json({ message: "Forneça uma lista de prescrições" });
      }

      const results = { success: 0, errors: [] as string[], imported: [] as any[] };
      
      for (let i = 0; i < prescList.length; i++) {
        const presc = prescList[i];
        try {
          if (!presc.title && !presc.medication) {
            results.errors.push(`Linha ${i + 1}: Título ou medicação é obrigatório`);
            continue;
          }

          const importData = {
            userId,
            title: presc.title || presc.medication || '',
            medication: presc.medication || presc.title || '',
            dose: presc.dose || null,
            interval: presc.interval || null,
            duration: presc.duration || null,
            route: presc.route || 'VO',
            quantity: presc.quantity || null,
            category: presc.category || null,
            ageGroup: presc.ageGroup || 'adulto',
            orientation: presc.orientation || null,
            observations: presc.observations || null,
            isPublic: true,
            isLocked: true
          };

          const item = await storage.createPrescription(importData);
          results.imported.push(item);
          results.success++;
        } catch (err: any) {
          results.errors.push(`Linha ${i + 1}: ${err.message || 'Erro desconhecido'}`);
        }
      }

      res.json({
        message: `Importação concluída: ${results.success} de ${prescList.length} prescrições processadas`,
        success: results.success,
        total: prescList.length,
        errors: results.errors,
        imported: results.imported
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erro ao importar prescrições" });
    }
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
  app.get(api.protocols.list.path, isAuthenticated, checkNotBlocked, trackUserActivity, async (req, res) => {
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
  app.get(api.checklists.list.path, isAuthenticated, checkNotBlocked, trackUserActivity, async (req, res) => {
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

  app.post("/api/medications/bulk-import", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { medications, mode = "upsert" } = req.body;
      
      if (!Array.isArray(medications) || medications.length === 0) {
        return res.status(400).json({ message: "Forneça uma lista de medicações" });
      }

      const results = { success: 0, errors: [] as string[], imported: [] as any[] };
      
      for (let i = 0; i < medications.length; i++) {
        const med = medications[i];
        try {
          if (!med.name) {
            results.errors.push(`Linha ${i + 1}: Nome é obrigatório`);
            continue;
          }

          const importData = {
            name: med.name.trim(),
            nameNormalized: med.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
            category: med.category || null,
            ageGroup: med.ageGroup || 'adulto',
            dose: med.dose || null,
            dosePerKg: med.dosePerKg || null,
            maxDose: med.maxDose || null,
            interval: med.interval || null,
            duration: med.duration || null,
            route: med.route || null,
            quantity: med.quantity || null,
            timing: med.timing || null,
            observations: med.observations || null,
            isActive: true
          };

          let item;
          if (mode === "upsert") {
            item = await storage.upsertMedication(importData);
          } else {
            item = await storage.createMedication(importData);
          }
          results.imported.push(item);
          results.success++;
        } catch (err: any) {
          results.errors.push(`Linha ${i + 1}: ${err.message || 'Erro desconhecido'}`);
        }
      }

      res.json({
        message: `Importação concluída: ${results.success} de ${medications.length} medicações processadas`,
        success: results.success,
        total: medications.length,
        errors: results.errors,
        imported: results.imported
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erro ao importar medicações" });
    }
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

  // --- Dose Rules (Admin configurable) ---
  app.get("/api/dose-rules", isAuthenticated, checkNotBlocked, async (req, res) => {
    const context = req.query.context as string | undefined;
    const items = await storage.getDoseRules(context);
    res.json(items);
  });

  app.get("/api/dose-rules/medication/:name", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getDoseRulesByMedication(req.params.name);
    res.json(items);
  });

  app.post("/api/dose-rules", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createDoseRule(req.body);
    res.status(201).json(item);
  });

  app.put("/api/dose-rules/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateDoseRule(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/dose-rules/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteDoseRule(Number(req.params.id));
    res.status(204).send();
  });

  // --- Formulations (Admin configurable) ---
  app.get("/api/formulations", isAuthenticated, checkNotBlocked, async (req, res) => {
    const medicationName = req.query.medication as string | undefined;
    const items = await storage.getFormulations(medicationName);
    res.json(items);
  });

  app.post("/api/formulations", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createFormulation(req.body);
    res.status(201).json(item);
  });

  app.put("/api/formulations/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateFormulation(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/formulations/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteFormulation(Number(req.params.id));
    res.status(204).send();
  });

  // --- User Preferences (now handled in newFeaturesRoutes.ts) ---
  // Removed old endpoints - using new ones from newFeaturesRoutes.ts

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

  // --- Medication Dilutions (Admin configurable) ---
  app.get("/api/medication-dilutions", isAuthenticated, checkNotBlocked, async (req, res) => {
    const medicationName = req.query.medication as string | undefined;
    const items = await storage.getMedicationDilutions(medicationName ? Number(medicationName) : undefined);
    res.json(items);
  });

  app.get("/api/medication-dilutions/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getMedicationDilution(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Diluição não encontrada" });
    res.json(item);
  });

  app.get("/api/medication-dilutions/by-name/:name", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getMedicationDilutionByName(req.params.name);
    res.json(item || null);
  });

  app.post("/api/medication-dilutions", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.createMedicationDilution(req.body);
    res.status(201).json(item);
  });

  app.put("/api/medication-dilutions/:id", isAuthenticated, checkAdmin, async (req, res) => {
    const item = await storage.updateMedicationDilution(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/medication-dilutions/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteMedicationDilution(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/medication-dilutions/bulk-import", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: "Campo 'data' é obrigatório (texto CSV)" });
      }

      const lines = data.trim().split('\n').filter((line: string) => line.trim());
      const items: any[] = [];
      const parseErrors: string[] = [];

      // Formato: medicationName;route;dilutionNeeded;dilutionHow;infusionTime;compatibility;administrationNotes
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        const parts = line.split(';').map((p: string) => p.trim());
        if (parts.length < 2) {
          parseErrors.push(`Linha ${i + 1}: formato inválido (mínimo: medicationName;route)`);
          continue;
        }

        items.push({
          medicationName: parts[0],
          route: parts[1] || 'IV',
          dilutionNeeded: parts[2]?.toLowerCase() === 'sim' || parts[2]?.toLowerCase() === 'true',
          dilutionHow: parts[3] || null,
          infusionTime: parts[4] || null,
          compatibility: parts[5] || null,
          administrationNotes: parts[6] || null,
        });
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "Nenhum item válido para importar", errors: parseErrors });
      }

      const result = await storage.bulkImportMedicationDilutions(items);
      res.json({ 
        imported: result.imported, 
        errors: [...parseErrors, ...result.errors] 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao importar diluições", error: String(error) });
    }
  });

  // --- Memorization System ---
  // Decks
  app.get("/api/memorize/decks", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const items = await storage.getMemorizeDecks(userId);
    res.json(items);
  });

  app.get("/api/memorize/decks/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getMemorizeDeck(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Deck não encontrado" });
    res.json(item);
  });

  app.post("/api/memorize/decks", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const isAdmin = user?.role === "admin";
    const item = await storage.createMemorizeDeck({
      ...req.body,
      userId: isAdmin ? null : userId,
      isPublic: isAdmin,
      isLocked: isAdmin,
    });
    res.status(201).json(item);
  });

  app.put("/api/memorize/decks/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const deck = await storage.getMemorizeDeck(Number(req.params.id));
    if (!deck) return res.status(404).json({ message: "Deck não encontrado" });
    if (deck.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para edição" });
    }
    if (deck.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Sem permissão para editar este deck" });
    }
    const item = await storage.updateMemorizeDeck(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/memorize/decks/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const deck = await storage.getMemorizeDeck(Number(req.params.id));
    if (!deck) return res.status(404).json({ message: "Deck não encontrado" });
    if (deck.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para exclusão" });
    }
    if (deck.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Sem permissão para excluir este deck" });
    }
    await storage.deleteMemorizeDeck(Number(req.params.id));
    res.status(204).send();
  });

  // Cards
  app.get("/api/memorize/decks/:deckId/cards", isAuthenticated, checkNotBlocked, async (req, res) => {
    const items = await storage.getMemorizeCards(Number(req.params.deckId));
    res.json(items);
  });

  app.get("/api/memorize/cards/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const item = await storage.getMemorizeCard(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Card não encontrado" });
    res.json(item);
  });

  app.post("/api/memorize/decks/:deckId/cards", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const deck = await storage.getMemorizeDeck(Number(req.params.deckId));
    if (!deck) return res.status(404).json({ message: "Deck não encontrado" });
    if (deck.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para edição" });
    }
    const item = await storage.createMemorizeCard({
      ...req.body,
      deckId: Number(req.params.deckId),
    });
    res.status(201).json(item);
  });

  app.post("/api/memorize/decks/:deckId/cards/bulk", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const deckId = Number(req.params.deckId);
    const deck = await storage.getMemorizeDeck(deckId);
    if (!deck) return res.status(404).json({ message: "Deck não encontrado" });
    if (deck.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para edição" });
    }

    const { data } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ message: "Campo 'data' é obrigatório (texto)" });
    }

    const lines = data.trim().split('\n').filter((line: string) => line.trim());
    const items: any[] = [];
    const errors: string[] = [];

    // Format: front;back;hint;tags (tags comma-separated)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      const parts = line.split(';').map((p: string) => p.trim());
      if (parts.length < 2) {
        errors.push(`Linha ${i + 1}: formato inválido (mínimo: frente;verso)`);
        continue;
      }

      items.push({
        deckId,
        front: parts[0],
        back: parts[1],
        hint: parts[2] || null,
        tags: parts[3] ? parts[3].split(',').map((t: string) => t.trim()) : null,
      });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "Nenhum card válido para importar", errors });
    }

    const created = await storage.createMemorizeCardsBulk(items);
    res.json({ imported: created.length, errors });
  });

  app.put("/api/memorize/cards/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const card = await storage.getMemorizeCard(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card não encontrado" });
    const deck = await storage.getMemorizeDeck(card.deckId);
    if (deck?.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para edição" });
    }
    const item = await storage.updateMemorizeCard(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/memorize/cards/:id", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const card = await storage.getMemorizeCard(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card não encontrado" });
    const deck = await storage.getMemorizeDeck(card.deckId);
    if (deck?.isLocked && user?.role !== "admin") {
      return res.status(403).json({ message: "Deck bloqueado para exclusão" });
    }
    await storage.deleteMemorizeCard(Number(req.params.id));
    res.status(204).send();
  });

  // Study / Spaced Repetition
  app.get("/api/memorize/decks/:deckId/study", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const cards = await storage.getCardsToReview(userId, Number(req.params.deckId));
    res.json(cards);
  });

  app.post("/api/memorize/cards/:cardId/review", isAuthenticated, checkNotBlocked, async (req, res) => {
    const userId = getUserId(req);
    const { quality } = req.body; // 0-5 SM-2 quality rating

    const existing = await storage.getCardProgress(userId, Number(req.params.cardId));
    
    // SM-2 Algorithm
    let ease = existing ? Number(existing.ease) : 2.5;
    let interval = existing?.interval || 1;
    let repetitions = existing?.repetitions || 0;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions++;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
    }

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    const progress = await storage.upsertCardProgress({
      userId,
      cardId: Number(req.params.cardId),
      ease: String(ease),
      interval,
      repetitions,
      nextReviewAt,
    });

    res.json(progress);
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
  
  // Get current plan (legacy)
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

  // Get all available plans
  app.get("/api/subscription/plans", async (_req, res) => {
    const allPlans = await storage.getPlans();
    const activePlans = allPlans.filter(p => p.isActive);
    
    if (activePlans.length === 0) {
      // Return default plans if none exist
      return res.json([
        { id: 0, slug: 'mensal', name: 'Plano Mensal', priceCents: 2990, billingPeriod: 'monthly', cycle: 'MONTHLY' },
        { id: 0, slug: 'semestral', name: 'Plano Semestral', priceCents: 14990, billingPeriod: 'semiannually', cycle: 'SEMIANNUALLY' },
        { id: 0, slug: 'anual', name: 'Plano Anual', priceCents: 27990, billingPeriod: 'yearly', cycle: 'YEARLY' },
      ]);
    }
    res.json(activePlans);
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

      const { paymentMethod, couponCode, name, cpfCnpj, phone, planSlug } = req.body;
      
      if (!paymentMethod || !['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Método de pagamento inválido" });
      }

      if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
        return res.status(400).json({ message: "CPF inválido" });
      }

      // Lookup plan by slug or fall back to monthly plan
      const planSlugToUse = planSlug || 'mensal';
      let plan = await storage.getPlanBySlug(planSlugToUse);
      
      if (!plan) {
        // If plan not found, try to seed plans and retry
        await storage.upsertPlans();
        plan = await storage.getPlanBySlug(planSlugToUse);
      }
      
      if (!plan) {
        return res.status(400).json({ message: `Plano '${planSlugToUse}' não encontrado. Contate o suporte.` });
      }

      let priceCents = plan.priceCents;
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
          // Use coupon tracking (currentUses is managed separately)
          await storage.useCoupon(coupon.id, userId);
        }
      }

      const finalAmount = Math.max(priceCents - discountCents, 0);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const subscription = await storage.createSubscription({
        userId,
        planId: plan.id,
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
          description: `Assinatura Salva Plantão - ${plan.name}`,
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
            title: 'Assinatura Ativada',
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
            title: 'Assinatura Ativada',
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

  // --- Admin Asaas Integration ---
  app.get("/api/admin/asaas/status", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const asaasService = await import('./services/asaas');
      const isConfigured = asaasService.isAsaasConfigured();
      const lastSync = await storage.getAdminSetting("asaas_last_sync");
      const lastSyncCount = await storage.getAdminSetting("asaas_last_sync_count");
      const apiKeyMask = process.env.ASAAS_API_KEY ? 
        `****${process.env.ASAAS_API_KEY.slice(-4)}` : null;
      
      res.json({
        isConfigured,
        apiKeyMask,
        lastSync: lastSync?.value || null,
        lastSyncCount: lastSyncCount?.value ? parseInt(lastSyncCount.value) : 0,
        status: isConfigured ? 'connected' : 'not_configured'
      });
    } catch (error: any) {
      res.json({ 
        isConfigured: false, 
        status: 'error', 
        error: error.message 
      });
    }
  });

  app.post("/api/admin/asaas/sync", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const asaasService = await import('./services/asaas');
      if (!asaasService.isAsaasConfigured()) {
        return res.status(503).json({ 
          success: false, 
          message: "Asaas API não configurada. Configure ASAAS_API_KEY nas variáveis de ambiente." 
        });
      }

      // Get all subscriptions from Asaas and update local cache
      const subscriptions = await asaasService.asaasRequest('/subscriptions?limit=100');
      let updatedCount = 0;

      if (subscriptions?.data) {
        for (const sub of subscriptions.data) {
          // Extract userId from externalReference if it follows our pattern
          const externalRef = sub.externalReference || '';
          const userMatch = externalRef.match(/user-([^-]+)/);
          
          if (userMatch) {
            const userId = userMatch[1];
            const status = sub.status === 'ACTIVE' ? 'active' : 
                          sub.status === 'OVERDUE' ? 'overdue' : 'canceled';
            
            await storage.upsertUserBillingStatus({
              userId,
              asaasCustomerId: sub.customer || null,
              asaasSubscriptionId: sub.id || null,
              status,
              nextDueDate: sub.nextDueDate ? new Date(sub.nextDueDate) : null,
              planName: sub.description || null
            });

            // Also update user status if subscription is active
            if (status === 'active') {
              await authStorage.updateUserStatus(userId, 'active');
            }
            updatedCount++;
          }
        }
      }

      // Save sync metadata
      await storage.setAdminSetting("asaas_last_sync", new Date().toISOString());
      await storage.setAdminSetting("asaas_last_sync_count", updatedCount.toString());

      res.json({ 
        success: true, 
        message: `Sincronização concluída. ${updatedCount} assinaturas atualizadas.`,
        updatedCount
      });
    } catch (error: any) {
      console.error('Asaas sync error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Erro na sincronização' 
      });
    }
  });

  // User: Get my payments
  app.get("/api/subscription/payments", isAuthenticated, async (req, res) => {
    const payments = await storage.getUserPayments(getUserId(req));
    res.json(payments);
  });

  // --- Billing Checkout (Redirect to Asaas) ---
  app.post("/api/billing/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

      const { planSlug, couponCode } = req.body;
      const planSlugToUse = planSlug || 'mensal';
      
      let plan = await storage.getPlanBySlug(planSlugToUse);
      if (!plan) {
        await storage.upsertPlans();
        plan = await storage.getPlanBySlug(planSlugToUse);
      }
      if (!plan) {
        return res.status(400).json({ message: `Plano '${planSlugToUse}' não encontrado.` });
      }

      let priceCents = plan.priceCents;
      let discountCents = 0;

      if (couponCode) {
        const coupon = await storage.getPromoCouponByCode(couponCode.toUpperCase().trim());
        if (coupon && coupon.isActive) {
          if (coupon.discountType === 'percentage') {
            discountCents = Math.floor(priceCents * (Number(coupon.discountValue) / 100));
          } else {
            discountCents = Math.floor(Number(coupon.discountValue) * 100);
          }
        }
      }

      const finalValue = Math.max((priceCents - discountCents) / 100, 0);
      
      const asaasService = await import('./services/asaas');
      if (!asaasService.isAsaasConfigured()) {
        return res.status(503).json({ message: "Sistema de pagamento não configurado." });
      }

      // Get the app domain for success/cancel URLs
      const appDomain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
      const protocol = appDomain.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${appDomain}`;

      const paymentLink = await asaasService.createPaymentLink({
        name: `Assinatura Salva Plantão - ${plan.name}`,
        description: `Assinatura ${plan.name} do Salva Plantão`,
        value: finalValue,
        billingType: 'UNDEFINED', // Allow user to choose PIX or Card
        chargeType: 'DETACHED',
        dueDateLimitDays: 7,
        notificationEnabled: true,
        callback: {
          successUrl: `${baseUrl}/billing/success`,
          autoRedirect: true
        },
        externalReference: `user-${userId}-plan-${plan.id}`
      });

      res.json({ 
        url: paymentLink.url,
        linkId: paymentLink.id
      });
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      res.status(500).json({ message: error.message || 'Erro ao criar checkout' });
    }
  });

  // Billing status check
  app.get("/api/billing/status", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    const subscription = await storage.getActiveSubscription(userId);
    const billingStatus = await storage.getUserBillingStatus(userId);
    
    res.json({
      isSubscribed: user?.status === 'active' || user?.role === 'admin',
      userStatus: user?.status || 'pending',
      isAdmin: user?.role === 'admin',
      subscription: subscription ? {
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate
      } : null,
      billingStatus: billingStatus ? {
        status: billingStatus.status,
        planName: billingStatus.planName,
        nextDueDate: billingStatus.nextDueDate,
        overdueDays: billingStatus.overdueDays
      } : null
    });
  });

  // Get available plans
  app.get("/api/billing/plans", async (req, res) => {
    await storage.upsertPlans();
    const allPlans = await storage.getPlans();
    const activePlans = allPlans.filter((p: any) => p.isActive);
    res.json(activePlans.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      priceDisplay: `R$ ${(p.priceCents / 100).toFixed(2).replace('.', ',')}`,
      billingPeriod: p.billingPeriod,
      cycle: p.cycle
    })));
  });

  // Also serve as /api/plans for backward compat
  app.get("/api/plans", async (req, res) => {
    await storage.upsertPlans();
    const allPlans = await storage.getPlans();
    const activePlans = allPlans.filter((p: any) => p.isActive);
    res.json(activePlans.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      priceDisplay: `R$ ${(p.priceCents / 100).toFixed(2).replace('.', ',')}`,
      billingPeriod: p.billingPeriod,
      cycle: p.cycle
    })));
  });

  // --- Preview Mode Endpoints ---
  const PREVIEW_TIME_LIMIT_MINUTES = 10;
  const PREVIEW_ACTION_LIMIT = 20;

  app.get("/api/preview/status", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    
    // Subscribers and admins have full access
    if (user?.status === 'active' || user?.role === 'admin') {
      return res.json({
        isSubscribed: true,
        previewAllowed: false, // Not applicable
        previewExpired: false,
        remainingMinutes: null,
        remainingActions: null
      });
    }

    let previewState = await storage.getUserPreviewState(userId);
    
    // Initialize preview state if not exists
    if (!previewState) {
      previewState = await storage.upsertUserPreviewState(userId, {
        userId,
        previewStartedAt: new Date(),
        actionsUsed: 0,
        previewExpired: false
      });
    }

    const now = new Date();
    const startTime = previewState.previewStartedAt || now;
    const elapsedMinutes = (now.getTime() - new Date(startTime).getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(0, PREVIEW_TIME_LIMIT_MINUTES - elapsedMinutes);
    const remainingActions = Math.max(0, PREVIEW_ACTION_LIMIT - (previewState.actionsUsed || 0));

    const isExpiredByTime = remainingMinutes <= 0;
    const isExpiredByActions = remainingActions <= 0;
    const previewExpired = isExpiredByTime || isExpiredByActions || previewState.previewExpired;

    // Update expired flag if needed
    if (previewExpired && !previewState.previewExpired) {
      await storage.upsertUserPreviewState(userId, { previewExpired: true });
    }

    res.json({
      isSubscribed: false,
      previewAllowed: !previewExpired,
      previewExpired,
      remainingMinutes: Math.round(remainingMinutes),
      remainingActions,
      actionsUsed: previewState.actionsUsed || 0,
      previewStartedAt: previewState.previewStartedAt
    });
  });

  app.post("/api/preview/consume", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const user = await authStorage.getUser(userId);
    
    // Subscribers don't consume preview actions
    if (user?.status === 'active' || user?.role === 'admin') {
      return res.json({ consumed: false, reason: 'subscribed' });
    }

    const previewState = await storage.incrementPreviewActions(userId);
    const remainingActions = Math.max(0, PREVIEW_ACTION_LIMIT - (previewState.actionsUsed || 0));
    
    res.json({
      consumed: true,
      actionsUsed: previewState.actionsUsed,
      remainingActions,
      previewExpired: remainingActions <= 0 || previewState.previewExpired
    });
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

  // --- Doctor Chat Routes ---
  
  // Accept chat terms and join state group
  app.post("/api/chat/accept-terms", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { uf } = req.body;
    if (!uf || uf.length !== 2) return res.status(400).json({ message: "UF é obrigatória" });
    
    await authStorage.updateUserUf(userId, uf.toUpperCase());
    await authStorage.updateUserChatTerms(userId);
    await storage.getOrCreateStateGroup(uf.toUpperCase(), userId);
    
    res.json({ success: true });
  });

  // Set user UF
  app.post("/api/chat/set-uf", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { uf } = req.body;
    if (!uf || uf.length !== 2) return res.status(400).json({ message: "UF inválida" });
    await authStorage.updateUserUf(userId, uf.toUpperCase());
    res.json({ success: true });
  });

  // Get user's rooms (groups + DMs)
  app.get("/api/chat/rooms", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const rooms = await storage.getChatRoomsForUser(userId);
    res.json(rooms);
  });

  // Get or create state group
  app.post("/api/chat/join-state-group", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await authStorage.getUser(userId);
    if (!user?.uf) return res.status(400).json({ message: "UF não configurada" });
    const room = await storage.getOrCreateStateGroup(user.uf, userId);
    res.json(room);
  });

  // Get messages for a room (paginated)
  app.get("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const roomId = Number(req.params.roomId);
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const before = req.query.before ? Number(req.query.before) : undefined;
    
    const isMember = await storage.isRoomMember(roomId, userId);
    if (!isMember) return res.status(403).json({ message: "Não é membro desta sala" });
    
    const messages = await storage.getChatMessages(roomId, limit, before);
    res.json(messages);
  });

  // Send message
  app.post("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const roomId = Number(req.params.roomId);
    const { body } = req.body;
    
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: "Mensagem vazia" });
    }
    
    // Check if user is banned
    const ban = await storage.getActiveChatBan(userId);
    if (ban) {
      const msg = ban.isPermanent 
        ? "Você foi banido permanentemente do chat." 
        : `Você está bloqueado até ${new Date(ban.expiresAt!).toLocaleDateString("pt-BR")}.`;
      return res.status(403).json({ message: msg });
    }
    
    // Check for banned words
    const bannedWords = await storage.getChatBannedWords();
    const lowerBody = body.toLowerCase();
    for (const bw of bannedWords) {
      if (lowerBody.includes(bw.word.toLowerCase())) {
        await storage.logBlockedMessage(userId, `Palavra bloqueada: ${bw.word}`);
        return res.status(400).json({ message: `Mensagem contém palavra bloqueada: "${bw.word}"` });
      }
    }
    
    const isMember = await storage.isRoomMember(roomId, userId);
    if (!isMember) return res.status(403).json({ message: "Não é membro desta sala" });
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const message = await storage.createChatMessage({
      roomId,
      senderId: userId,
      body: body.trim(),
      expiresAt,
    });
    
    const sender = await authStorage.getUser(userId);
    broadcastToRoom(roomId, {
      type: "chat_message",
      roomId,
      message: {
        ...message,
        senderName: `${sender?.firstName || ""} ${sender?.lastName || ""}`.trim() || "Usuário",
        senderImage: sender?.profileImageUrl,
      },
    });
    
    res.status(201).json(message);
  });

  // Log blocked message (no content saved)
  app.post("/api/chat/log-blocked", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { reason } = req.body;
    await storage.logBlockedMessage(userId, reason || "Unknown");
    res.json({ logged: true });
  });

  // Search users for DM
  app.get("/api/chat/search-users", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json([]);
    const users = await storage.searchUsersForChat(q, userId);
    res.json(users);
  });

  // Get contacts
  app.get("/api/chat/contacts", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const contacts = await storage.getChatContacts(userId);
    res.json(contacts);
  });

  // Add contact and create/get DM room
  app.post("/api/chat/start-dm", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { contactId } = req.body;
    if (!contactId || contactId === userId) {
      return res.status(400).json({ message: "Contato inválido" });
    }
    const room = await storage.getOrCreateDmRoom(userId, contactId);
    res.json(room);
  });

  // Cleanup expired messages (called by cron or manually)
  app.post("/api/chat/cleanup-expired", isAuthenticated, checkAdmin, async (req, res) => {
    const deleted = await storage.deleteExpiredMessages();
    res.json({ deleted });
  });

  // --- Chat Admin Moderation Routes ---
  
  // Get all chat bans
  app.get("/api/admin/chat/bans", isAuthenticated, checkAdmin, async (req, res) => {
    const bans = await storage.getAllChatBans();
    res.json(bans);
  });

  // Ban a user from chat
  app.post("/api/admin/chat/bans", isAuthenticated, checkAdmin, async (req, res) => {
    const adminId = getUserId(req);
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });
    
    const { userId, reason, isPermanent, durationDays } = req.body;
    if (!userId || !reason) {
      return res.status(400).json({ message: "Usuário e motivo são obrigatórios" });
    }
    
    let expiresAt = null;
    if (!isPermanent && durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(durationDays));
    }
    
    const ban = await storage.createChatBan({
      userId,
      reason,
      bannedBy: adminId,
      isPermanent: !!isPermanent,
      expiresAt,
    });
    res.status(201).json(ban);
  });

  // Remove a ban
  app.delete("/api/admin/chat/bans/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteChatBan(Number(req.params.id));
    res.status(204).send();
  });

  // Get all banned words
  app.get("/api/admin/chat/banned-words", isAuthenticated, checkAdmin, async (req, res) => {
    const words = await storage.getChatBannedWords();
    res.json(words);
  });

  // Add a banned word
  app.post("/api/admin/chat/banned-words", isAuthenticated, checkAdmin, async (req, res) => {
    const adminId = getUserId(req);
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });
    
    const { word } = req.body;
    if (!word || word.trim().length === 0) {
      return res.status(400).json({ message: "Palavra é obrigatória" });
    }
    
    const bannedWord = await storage.createChatBannedWord({
      word: word.trim().toLowerCase(),
      createdBy: adminId,
    });
    res.status(201).json(bannedWord);
  });

  // Remove a banned word
  app.delete("/api/admin/chat/banned-words/:id", isAuthenticated, checkAdmin, async (req, res) => {
    await storage.deleteChatBannedWord(Number(req.params.id));
    res.status(204).send();
  });

  // Get blocked messages log
  app.get("/api/admin/chat/blocked-messages", isAuthenticated, checkAdmin, async (req, res) => {
    const messages = await storage.getBlockedMessagesLog();
    res.json(messages);
  });

  // Get all chat users with UF info (admin)
  app.get("/api/admin/chat/users", isAuthenticated, checkAdmin, async (req, res) => {
    const usersWithUf = await storage.getChatUsersWithUf();
    res.json(usersWithUf);
  });

  // Admin change user UF
  app.patch("/api/admin/chat/users/:userId/uf", isAuthenticated, checkAdmin, async (req, res) => {
    const { userId } = req.params;
    const { uf } = req.body;
    
    const validUfs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
    if (!uf || !validUfs.includes(uf)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    
    const result = await storage.changeUserUf(userId, uf, true);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    res.json({ success: true });
  });

  // User change own UF (once per month)
  app.post("/api/chat/change-uf", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { uf } = req.body;
    const validUfs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
    if (!uf || !validUfs.includes(uf)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    
    const result = await storage.changeUserUf(userId, uf, false);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    res.json({ success: true });
  });

  // Check if user can change UF
  app.get("/api/chat/can-change-uf", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const result = await storage.canUserChangeUf(userId);
    res.json(result);
  });

  // --- Push Notifications ---
  const webPush = await import("web-push");
  
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@appsalvaplantao.com";
  
  if (vapidPublicKey && vapidPrivateKey) {
    webPush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  // Get VAPID public key
  app.get("/api/push/vapid-key", (req, res) => {
    if (!vapidPublicKey) {
      return res.status(500).json({ message: "Push notifications not configured" });
    }
    res.json({ publicKey: vapidPublicKey });
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { endpoint, keys, userAgent } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    
    await storage.savePushSubscription({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
    });
    
    res.json({ success: true });
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint required" });
    }
    
    await storage.deletePushSubscription(userId, endpoint);
    res.json({ success: true });
  });

  // Get user's push subscriptions
  app.get("/api/push/subscriptions", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const subs = await storage.getUserPushSubscriptions(userId);
    res.json(subs);
  });

  // Anti-PHI detection patterns
  const PHI_PATTERNS = [
    { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, type: "CPF" },
    { pattern: /\b\d{15}\b/, type: "CNS" },
    { pattern: /\(\d{2}\)\s*\d{4,5}-?\d{4}/, type: "Telefone" },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: "Email" },
    { pattern: /\b(nome|cpf|rg|telefone|endereço|paciente):\s*\S+/i, type: "Dados pessoais" },
  ];
  
  function detectPHI(text: string): string[] {
    const detected: string[] = [];
    for (const p of PHI_PATTERNS) {
      if (p.pattern.test(text)) {
        detected.push(p.type);
      }
    }
    return detected;
  }

  // Available segments for users to subscribe
  const NOTIFICATION_SEGMENTS = [
    "Clínica Médica", "Pediatria", "Ginecologia/Obstetrícia", "Cirurgia",
    "UTI", "UPA", "UBS", "Emergência", "Ortopedia", "Psiquiatria",
    "Cardiologia", "Neurologia", "Dermatologia", "Atualizações"
  ];
  
  app.get("/api/notifications/segments", (req, res) => {
    res.json(NOTIFICATION_SEGMENTS);
  });

  // Get user notification settings
  app.get("/api/notifications/settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const settings = await storage.getUserNotificationSettings(userId);
    res.json(settings || { 
      userId, 
      segments: [], 
      quietHoursStart: null, 
      quietHoursEnd: null, 
      allowEmergencyOverride: true 
    });
  });

  // Save user notification settings
  app.post("/api/notifications/settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { segments, quietHoursStart, quietHoursEnd, allowEmergencyOverride } = req.body;
    
    const settings = await storage.saveUserNotificationSettings({
      userId,
      segments: segments || [],
      quietHoursStart: quietHoursStart || null,
      quietHoursEnd: quietHoursEnd || null,
      allowEmergencyOverride: allowEmergencyOverride !== false,
    });
    
    res.json(settings);
  });

  // --- Sound Settings ---
  app.get("/api/sound-settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const settings = await storage.getUserNotificationSettings(userId);
    res.json({
      soundEnabled: settings?.soundEnabled ?? true,
      soundVolume: settings?.soundVolume ?? 70,
      soundTheme: settings?.soundTheme ?? "default",
      chatSoundEnabled: settings?.chatSoundEnabled ?? true,
      notificationSoundEnabled: settings?.notificationSoundEnabled ?? true,
    });
  });

  app.patch("/api/sound-settings", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { soundEnabled, soundVolume, soundTheme, chatSoundEnabled, notificationSoundEnabled } = req.body;
    
    const existingSettings = await storage.getUserNotificationSettings(userId);
    
    const settings = await storage.saveUserNotificationSettings({
      userId,
      segments: existingSettings?.segments || [],
      quietHoursStart: existingSettings?.quietHoursStart || null,
      quietHoursEnd: existingSettings?.quietHoursEnd || null,
      allowEmergencyOverride: existingSettings?.allowEmergencyOverride !== false,
      soundEnabled: soundEnabled ?? existingSettings?.soundEnabled ?? true,
      soundVolume: soundVolume ?? existingSettings?.soundVolume ?? 70,
      soundTheme: soundTheme ?? existingSettings?.soundTheme ?? "default",
      chatSoundEnabled: chatSoundEnabled ?? existingSettings?.chatSoundEnabled ?? true,
      notificationSoundEnabled: notificationSoundEnabled ?? existingSettings?.notificationSoundEnabled ?? true,
    });
    
    res.json({
      soundEnabled: settings.soundEnabled,
      soundVolume: settings.soundVolume,
      soundTheme: settings.soundTheme,
      chatSoundEnabled: settings.chatSoundEnabled,
      notificationSoundEnabled: settings.notificationSoundEnabled,
    });
  });

  // Get notification inbox for user
  app.get("/api/notifications/inbox", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const settings = await storage.getUserNotificationSettings(userId);
    const userSegments = (settings?.segments as string[]) || [];
    
    const messages = await storage.getNotificationMessagesForUser(userId, userSegments, limit, offset);
    const readIds = await storage.getUserNotificationReads(userId);
    
    res.json({
      messages: messages.map(m => ({
        ...m,
        isRead: readIds.includes(m.id),
      })),
    });
  });

  // Mark notification as read
  app.post("/api/notifications/read", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ message: "messageId required" });
    
    await storage.markNotificationRead(userId, messageId);
    res.json({ success: true });
  });

  // Check if user is in quiet hours
  function isInQuietHours(quietStart: string | null, quietEnd: string | null): boolean {
    if (!quietStart || !quietEnd) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
  }

  // Rate limit state (in-memory, 1 emergency per 6 hours per admin)
  const EMERGENCY_RATE_LIMIT_HOURS = 6;
  const GENERAL_RATE_LIMIT_SECONDS = 60;
  let lastGeneralSendTime: Date | null = null;

  // Admin send push notification (enhanced)
  app.post("/api/push/admin/send", isAuthenticated, checkAdmin, async (req, res) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ message: "Push notifications not configured" });
    }
    
    const adminUserId = getUserId(req);
    if (!adminUserId) return res.status(401).json({ message: "Unauthorized" });
    
    const { title, body, url, category, target, emergency, confirmSensitiveOverride } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body required" });
    }
    
    // Anti-PHI detection
    const phiDetected = detectPHI(`${title} ${body}`);
    if (phiDetected.length > 0) {
      if (emergency) {
        return res.status(400).json({ 
          message: `Dados sensíveis detectados (${phiDetected.join(", ")}). Para notificações de emergência, remova antes de enviar.`,
          phiDetected 
        });
      }
      if (!confirmSensitiveOverride) {
        return res.status(400).json({ 
          message: `Possíveis dados sensíveis detectados (${phiDetected.join(", ")}). Confirme que não contém PHI.`,
          phiDetected,
          requiresConfirmation: true
        });
      }
    }
    
    // Rate limiting for general notifications
    if (!emergency) {
      if (lastGeneralSendTime && (Date.now() - lastGeneralSendTime.getTime()) < GENERAL_RATE_LIMIT_SECONDS * 1000) {
        return res.status(429).json({ message: `Aguarde ${GENERAL_RATE_LIMIT_SECONDS} segundos entre envios.` });
      }
    }
    
    // Emergency rate limiting
    if (emergency) {
      const lastEmergency = await storage.getLastEmergencyNotificationTime(adminUserId);
      if (lastEmergency) {
        const hoursSince = (Date.now() - lastEmergency.getTime()) / (1000 * 60 * 60);
        if (hoursSince < EMERGENCY_RATE_LIMIT_HOURS) {
          return res.status(429).json({ 
            message: `Limite de emergência: aguarde ${Math.ceil(EMERGENCY_RATE_LIMIT_HOURS - hoursSince)} horas.` 
          });
        }
      }
    }
    
    // Create notification message (for inbox)
    const notifCategory = emergency ? "emergency" : (category || "general");
    const segment = target?.segments?.[0] || null;
    
    const message = await storage.createNotificationMessage({
      title,
      body,
      url: url || null,
      category: notifCategory,
      segment,
      sentByUserId: adminUserId,
    });
    
    // Resolve target users
    let targetUserIds: string[] = [];
    const targetType = target?.type || "all";
    
    if (targetType === "userIds" && target?.userIds?.length > 0) {
      targetUserIds = target.userIds;
    } else if (targetType === "segments" && target?.segments?.length > 0) {
      targetUserIds = await storage.getUsersWithAnySegment(target.segments);
    } else {
      targetUserIds = await storage.getAllActiveUserIds();
    }
    
    // Create delivery record
    const delivery = await storage.createNotificationDelivery({
      messageId: message.id,
      targetType,
      targetValue: JSON.stringify(targetType === "userIds" ? target?.userIds : target?.segments || []),
      targetCount: targetUserIds.length,
      successCount: 0,
      failCount: 0,
      inboxOnlyCount: 0,
      createdByUserId: adminUserId,
    });
    
    // Get subscriptions for target users
    const userSubs = await storage.getUsersWithSubscriptions(targetUserIds);
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || "/notificacoes",
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      category: notifCategory,
    });
    
    let successCount = 0;
    let failCount = 0;
    let inboxOnlyCount = 0;
    let removedCount = 0;
    
    for (const { userId, subscriptions } of userSubs) {
      // Check quiet hours
      const userSettings = await storage.getUserNotificationSettings(userId);
      const inQuietHours = isInQuietHours(
        userSettings?.quietHoursStart || null,
        userSettings?.quietHoursEnd || null
      );
      
      // Skip push if in quiet hours (unless emergency + override allowed)
      if (inQuietHours && !(emergency && userSettings?.allowEmergencyOverride !== false)) {
        inboxOnlyCount++;
        await storage.createNotificationDeliveryItem({
          deliveryId: delivery.id,
          userId,
          subscriptionId: null,
          status: "inbox_only",
          errorCode: null,
        });
        continue;
      }
      
      // Send to all subscriptions for this user
      for (const sub of subscriptions) {
        try {
          await webPush.default.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          successCount++;
          await storage.createNotificationDeliveryItem({
            deliveryId: delivery.id,
            userId,
            subscriptionId: sub.id,
            status: "sent",
            errorCode: null,
          });
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await storage.deletePushSubscriptionByEndpoint(sub.endpoint);
            removedCount++;
            await storage.createNotificationDeliveryItem({
              deliveryId: delivery.id,
              userId,
              subscriptionId: sub.id,
              status: "invalid_removed",
              errorCode: String(error.statusCode),
            });
          } else {
            failCount++;
            await storage.createNotificationDeliveryItem({
              deliveryId: delivery.id,
              userId,
              subscriptionId: sub.id,
              status: "failed",
              errorCode: error.message?.slice(0, 100) || "Unknown",
            });
          }
        }
      }
    }
    
    // Update delivery stats
    await storage.updateNotificationDelivery(delivery.id, {
      successCount,
      failCount,
      inboxOnlyCount,
    });
    
    // Update rate limit trackers
    lastGeneralSendTime = new Date();
    if (emergency) {
      await storage.updateEmergencyNotificationLimit(adminUserId);
    }
    
    res.json({ 
      message: "Notifications sent", 
      results: { 
        success: successCount, 
        failed: failCount, 
        inboxOnly: inboxOnlyCount,
        removed: removedCount,
        totalTargeted: targetUserIds.length,
      },
      messageId: message.id,
      deliveryId: delivery.id,
    });
  });

  // Admin test notification (sends to self)
  app.post("/api/push/admin/test-self", isAuthenticated, checkAdmin, async (req, res) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ message: "Push notifications not configured" });
    }
    
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const subs = await storage.getUserPushSubscriptions(userId);
    if (subs.length === 0) {
      return res.status(400).json({ message: "Você não tem notificações ativadas. Ative primeiro." });
    }
    
    const payload = JSON.stringify({
      title: "Teste de Notificação",
      body: "Esta é uma notificação de teste do Salva Plantão!",
      url: "/",
      icon: "/icon-512.png",
      badge: "/icon-512.png",
    });
    
    let success = 0;
    for (const sub of subs) {
      try {
        await webPush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        success++;
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    }
    
    res.json({ success: success > 0, sent: success });
  });

  // Admin get notification delivery history
  app.get("/api/push/admin/deliveries", isAuthenticated, checkAdmin, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const deliveries = await storage.getNotificationDeliveries(limit);
    res.json(deliveries);
  });

  // Admin get delivery items (detailed status per user)
  app.get("/api/push/admin/deliveries/:id/items", isAuthenticated, checkAdmin, async (req, res) => {
    const deliveryId = parseInt(req.params.id);
    const items = await storage.getDeliveryItems(deliveryId);
    res.json(items);
  });

  // --- One-Time Messages (payment/donation confirmations) ---
  app.get("/api/one-time-messages", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const record = await storage.getUserOneTimeMessages(userId);
    
    // Check payment welcome
    let paymentShouldShow = false;
    if (!record?.paymentWelcomeShown) {
      paymentShouldShow = await storage.hasConfirmedPayment(userId);
    }
    
    // Check donation thanks - always check for new donations after lastDonationAckedId
    let donationShouldShow = false;
    let socialCauseName: string | undefined;
    let donationId: number | undefined;
    const lastDonation = await storage.getLastUnackedDonation(userId, record?.lastDonationAckedId);
    if (lastDonation) {
      donationShouldShow = true;
      socialCauseName = lastDonation.causeName;
      donationId = lastDonation.donation.id;
    }
    
    res.json({
      payment: { shouldShow: paymentShouldShow },
      donation: { shouldShow: donationShouldShow, socialCauseName, donationId }
    });
  });

  app.post("/api/one-time-messages/ack", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { type, donationId } = req.body;
    if (!type || !["payment", "donation"].includes(type)) {
      return res.status(400).json({ message: "Invalid type. Use 'payment' or 'donation'." });
    }
    
    if (type === "payment") {
      await storage.upsertUserOneTimeMessages(userId, { paymentWelcomeShown: true });
    } else if (type === "donation") {
      // Use the donationId passed from frontend to ensure we ack the correct donation
      if (donationId) {
        await storage.upsertUserOneTimeMessages(userId, { lastDonationAckedId: donationId });
      }
    }
    
    res.json({ success: true });
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
