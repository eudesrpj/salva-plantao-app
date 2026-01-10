import type { Express } from "express";
import { requestEmailAuth, verifyEmailCode, verifyMagicLink, deleteUserAccount } from "./authService";
import { authStorage } from "../replit_integrations/auth/storage";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/email/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || req.hostname;
      const baseUrl = `${protocol}://${host}`;
      
      const result = await requestEmailAuth(email, baseUrl);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }
      
      res.json({ success: true, message: "Código enviado para o email" });
    } catch (error) {
      console.error("Email auth request error:", error);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.post("/api/auth/email/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email e código são obrigatórios" });
      }
      
      const result = await verifyEmailCode(email, code);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      const user = await authStorage.getUser(result.userId!);
      
      if (!user) {
        return res.status(500).json({ message: "Erro ao buscar usuário" });
      }
      
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profileImageUrl
      };
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Code verification error:", error);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/auth/email/verify-magic", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.redirect("/login?error=invalid_token");
      }
      
      const result = await verifyMagicLink(token);
      
      if (!result.success) {
        return res.redirect("/login?error=expired_token");
      }
      
      const user = await authStorage.getUser(result.userId!);
      
      if (!user) {
        return res.redirect("/login?error=user_not_found");
      }
      
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profileImageUrl
      };
      
      res.redirect("/");
    } catch (error) {
      console.error("Magic link verification error:", error);
      res.redirect("/login?error=internal_error");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.delete("/api/account", async (req, res) => {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const result = await deleteUserAccount(userId);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    
    if (!user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    res.json(user);
  });
}
