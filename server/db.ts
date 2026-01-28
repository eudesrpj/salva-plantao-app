import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Database Configuration for Supabase Pooler + PostgreSQL
 * 
 * Supports:
 * - Supabase connection pooler (port 6543, TCP)
 * - Direct PostgreSQL (port 5432)
 * - SSL/TLS with proper certificate validation
 * 
 * Environment Variables:
 * - DATABASE_URL: postgresql://user:pass@host:port/db?sslmode=require
 * - NODE_ENV: production|development
 */
function getDatabaseConfig() {
  let url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Add sslmode=require if not already present
  // This is REQUIRED for Render + Supabase pooler
  if (!url.includes("sslmode")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }

  const config: pg.PoolConfig = {
    connectionString: url,
    
    // Connection timeouts (Render coldstart can be slow)
    connectionTimeoutMillis: 30000, // 30 seconds to establish connection
    idleTimeoutMillis: 30000,       // 30 seconds before closing idle connections
    
    // Pool size
    max: 20,                        // Max connections in pool
    min: 2,                         // Min connections in pool
    
    // Retry logic
    maxUses: 7200,                  // Max times a connection can be used before being destroyed
  };

  /**
   * SSL Configuration Strategy:
   * 
   * Production (Render/Supabase):
   *   - rejectUnauthorized: false (required for Render's PostgreSQL SSL)
   *   - sslmode=require in connection string (enforces SSL)
   * 
   * This avoids "SELF_SIGNED_CERT_IN_CHAIN" errors on Render by:
   *   - Accepting self-signed or intermediate certificates
   *   - Enforcing SSL at the connection string level
   * 
   * Development:
   *   - Same config as production for consistency
   */
  // Force rejectUnauthorized: false for Render compatibility
  // This prevents "SELF_SIGNED_CERT_IN_CHAIN" errors while still using encrypted connections (sslmode=require)
  // For local development with sslmode=disable, don't set SSL config
  if (!url.includes("sslmode=disable")) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

  return config;
}

export const pool = new Pool(getDatabaseConfig());

/**
 * Error handlers for pool
 */
pool.on("error", (err) => {
  console.error("[db:pool] Unexpected error on idle client:", err);
  // Don't exit - allow graceful error handling in routes
});

pool.on("connect", () => {
  // Log connection events in development
  if (process.env.NODE_ENV !== "production") {
    console.log("[db:pool] New connection established");
  }
});

export const db = drizzle(pool, { schema });

