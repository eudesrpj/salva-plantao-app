import "dotenv/config";

/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, seedDatabase } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import { validateEnv } from "./config/env";
import { logger, simpleLog } from "./config/logger";

const app = express();
const httpServer = createServer(app);

// Setup WebSocket server for real-time notifications
setupWebSocket(httpServer);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Re-export simple log for backwards compatibility
export const log = simpleLog;

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate environment variables at startup
  try {
    validateEnv();
  } catch (error) {
    logger.error("Failed to validate environment variables", error);
    process.exit(1);
  }

  await registerRoutes(httpServer, app);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    const version = process.env.npm_package_version || "1.0.0";
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version,
      auth: "independent",
      node: process.version,
    });
  });

  // Database health check endpoint (returns 503 if DB unavailable)
  app.get("/api/health/db", async (_req, res) => {
    try {
      const { pool } = await import("./db");
      const result = await pool.query("SELECT 1 as health");
      
      if (result.rows && result.rows[0]?.health === 1) {
        return res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          database: "postgresql",
        });
      } else {
        throw new Error("Unexpected query result");
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error("Database health check failed:", error);
      return res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
        details: error,
      });
    }
  });

  // Global error handler - must be last middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error with context
    logger.error("Request error", err, {
      method: req.method,
      path: req.path,
      status,
      userAgent: req.get("user-agent"),
    });

    // Send appropriate response based on error type
    if (status === 401) {
      return res.status(401).json({ 
        message: "Não autenticado. Por favor, faça login novamente.",
        code: "UNAUTHORIZED"
      });
    }
    
    if (status === 403) {
      return res.status(403).json({ 
        message: message || "Acesso negado. Você não tem permissão para acessar este recurso.",
        code: "FORBIDDEN"
      });
    }
    
    if (status === 404) {
      return res.status(404).json({ 
        message: message || "Recurso não encontrado.",
        code: "NOT_FOUND"
      });
    }
    
    if (status >= 400 && status < 500) {
      // Client error - send message to client
      return res.status(status).json({ 
        message,
        code: "CLIENT_ERROR"
      });
    }

    // Server error - hide details in production
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ 
        message: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
        code: "INTERNAL_ERROR"
      });
    } else {
      // Development - show details
      return res.status(status).json({ 
        message,
        code: "INTERNAL_ERROR",
        stack: err.stack,
      });
    }
  });

  // Setup Vite only in development
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Use PORT from environment or fallback to 5000
  const port = parseInt(process.env.PORT || "5000", 10);

  // In production (Render), listen on all interfaces; in development, use localhost
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

  httpServer.listen(port, host, () => {
    const version = process.env.npm_package_version || "1.0.0";
    log(`✓ Server listening on ${host}:${port}`);
    log(`📘 Health endpoint available at http://${host}:${port}/health`);
    log(`📦 Version: ${version}`);
    logger.info("Server started successfully", { port, host, version, nodeVersion: process.version });
    
    // Seed database in background AFTER server is listening
    // This prevents startup blocking if DB is slow or down
    // Non-fatal: Seeding may fail if data already exists or if DB is temporarily unavailable
    // The app can still run without seed data (admin can add it manually later)
    setImmediate(async () => {
      try {
        await seedDatabase();
        logger.info("Database seeding completed");
      } catch (error) {
        logger.error("Database seeding failed", error);
        // Non-fatal: log only, don't crash
        // Seeding might fail if:
        // - Data already exists (normal in production)
        // - DB is temporarily slow/unavailable (will self-heal)
        // - Some seed data has validation issues (non-critical)
      }
    });
  });
})().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
