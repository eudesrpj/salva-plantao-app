// Set TLS environment FIRST (can also be set via NODE_TLS_REJECT_UNAUTHORIZED env var)
if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED && process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import "dotenv/config";

/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
  await registerRoutes(httpServer, app);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
    log(`✓ Server listening on ${host}:${port}`);
    
    // Seed database plans AFTER server is listening (non-blocking, won't crash if it fails)
    // Can be skipped with SKIP_STARTUP_TASKS=true env var
    const skipStartupTasks = process.env.SKIP_STARTUP_TASKS === "true";
    
    if (skipStartupTasks) {
      log("⊘ Startup tasks skipped (SKIP_STARTUP_TASKS=true)", "database");
    } else {
      setImmediate(async () => {
        try {
          const { storage } = await import("./storage");
          await storage.upsertPlans();
          log("✓ Default plans seeded successfully", "database");
        } catch (err) {
          console.error("[database] Failed to seed plans:", err);
          // Non-fatal: continue running
        }
        
        try {
          const { storage } = await import("./storage");
          await storage.seedBillingPlans();
          log("✓ Billing plans seeded successfully", "database");
        } catch (err) {
          console.error("[database] Failed to seed billing plans:", err);
          // Non-fatal: continue running
        }
      });
    }
  });
})();
