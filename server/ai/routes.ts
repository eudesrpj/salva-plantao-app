import { Express } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { isAuthenticated } from "../replit_integrations/auth";
import { authStorage } from "../replit_integrations/auth/storage";
import { aiStorage } from "./storage";

const AI_DISCLAIMER = "\n\n---\nConteudo gerado por IA. Revisar sempre com julgamento clinico.";

const saveCredentialsSchema = z.object({
  apiKey: z.string().min(10, "API key muito curta"),
  provider: z.string().default("openai"),
  model: z.string().default("gpt-4o"),
});

const testCredentialsSchema = z.object({
  apiKey: z.string().min(10),
  model: z.string().default("gpt-4o"),
});

const chatSchema = z.object({
  message: z.string().min(1, "Mensagem obrigatoria"),
  promptId: z.number().optional(),
  customPrompt: z.string().optional(),
});

const createPromptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  promptText: z.string().min(1),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
});

export function registerAiRoutes(app: Express) {
  const getUserId = (req: any) => req.user?.claims?.sub;

  const checkAdmin = async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await authStorage.getUser(userId);
    if (user?.role !== "admin") return res.status(403).json({ message: "Forbidden: Admin only" });
    next();
  };

  app.get("/api/ai/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const creds = await aiStorage.getMaskedCredentials(userId);
      res.json(creds);
    } catch (error) {
      console.error("Error fetching AI credentials");
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post("/api/ai/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = saveCredentialsSchema.parse(req.body);
      
      const creds = await aiStorage.saveCredentials(
        userId,
        data.apiKey,
        data.provider,
        data.model
      );
      
      res.status(201).json(creds);
    } catch (error: any) {
      console.error("Error saving AI credentials");
      res.status(400).json({ message: error.message || "Failed to save credentials" });
    }
  });

  app.delete("/api/ai/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await aiStorage.deleteCredentials(userId);
      res.json({ message: "Credentials deleted" });
    } catch (error) {
      console.error("Error deleting AI credentials");
      res.status(500).json({ message: "Failed to delete credentials" });
    }
  });

  app.post("/api/ai/test", isAuthenticated, async (req: any, res) => {
    try {
      const data = testCredentialsSchema.parse(req.body);
      
      const openai = new OpenAI({ apiKey: data.apiKey });
      
      const response = await openai.chat.completions.create({
        model: data.model,
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        max_tokens: 10,
      });

      const userId = getUserId(req);
      await aiStorage.updateLastTested(userId);
      
      res.json({ success: true, message: "Conexao testada com sucesso!" });
    } catch (error: any) {
      console.error("AI test failed");
      res.status(400).json({ 
        success: false, 
        message: error.message?.includes("Incorrect API key") 
          ? "Chave de API invalida" 
          : "Falha na conexao com a IA" 
      });
    }
  });

  app.post("/api/ai/test-stored", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const apiKey = await aiStorage.getDecryptedApiKey(userId);
      
      if (!apiKey) {
        return res.status(400).json({ success: false, message: "Nenhuma chave salva" });
      }

      const creds = await aiStorage.getUserCredentials(userId);
      const model = creds?.model || "gpt-4o";
      
      const openai = new OpenAI({ apiKey });
      
      await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        max_tokens: 10,
      });

      await aiStorage.updateLastTested(userId);
      
      res.json({ success: true, message: "Conexao testada com sucesso!" });
    } catch (error: any) {
      console.error("AI test-stored failed");
      res.status(400).json({ 
        success: false, 
        message: error.message?.includes("Incorrect API key") 
          ? "Chave de API invalida" 
          : "Falha na conexao com a IA" 
      });
    }
  });

  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = chatSchema.parse(req.body);
      
      const apiKey = await aiStorage.getDecryptedApiKey(userId);
      if (!apiKey) {
        return res.status(400).json({ message: "Configure sua API key nas configuracoes" });
      }

      const creds = await aiStorage.getUserCredentials(userId);
      if (!creds?.isEnabled) {
        return res.status(400).json({ message: "IA desabilitada" });
      }

      let systemPrompt = "Voce e um assistente medico. Forneça respostas claras e bem formatadas para uso clinico. Sempre organize suas respostas de forma estruturada.";
      
      if (data.promptId) {
        const prompt = await aiStorage.getPrompt(data.promptId);
        if (prompt?.promptText) {
          systemPrompt = prompt.promptText;
        }
      } else if (data.customPrompt) {
        systemPrompt = data.customPrompt;
      }

      const openai = new OpenAI({ apiKey });
      
      const response = await openai.chat.completions.create({
        model: creds.model || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.message }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "Sem resposta";
      
      res.json({ 
        response: content + AI_DISCLAIMER,
        model: creds.model,
      });
    } catch (error: any) {
      console.error("AI chat error");
      res.status(500).json({ 
        message: error.message?.includes("API key") 
          ? "Problema com sua chave de API" 
          : "Erro ao processar consulta" 
      });
    }
  });

  app.get("/api/ai/prompts", isAuthenticated, async (req, res) => {
    try {
      const prompts = await aiStorage.getActivePrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts");
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get("/api/admin/ai/prompts", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const prompts = await aiStorage.getAllPrompts();
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.post("/api/admin/ai/prompts", isAuthenticated, checkAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = createPromptSchema.parse(req.body);
      const prompt = await aiStorage.createPrompt({ ...data, createdBy: userId });
      res.status(201).json(prompt);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create prompt" });
    }
  });

  app.put("/api/admin/ai/prompts/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = createPromptSchema.partial().parse(req.body);
      const prompt = await aiStorage.updatePrompt(id, data);
      res.json(prompt);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update prompt" });
    }
  });

  app.delete("/api/admin/ai/prompts/:id", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await aiStorage.deletePrompt(id);
      res.json({ message: "Prompt deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  app.get("/api/admin/ai/settings", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const settings = await aiStorage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/ai/settings", isAuthenticated, checkAdmin, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      const setting = await aiStorage.setSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to save setting" });
    }
  });
}
