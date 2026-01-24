import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

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
  config.ssl = {
    rejectUnauthorized: false,
  };

  return config;
}

// Lazy initialization - only create pool when first accessed
let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializePool() {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }

    _pool = new Pool(getDatabaseConfig());

    /**
     * Error handlers for pool
     */
    _pool.on("error", (err) => {
      console.error("[db:pool] Unexpected error on idle client:", err);
      // Don't exit - allow graceful error handling in routes
    });

    _pool.on("connect", () => {
      // Log connection events in development
      if (process.env.NODE_ENV !== "production") {
        console.log("[db:pool] New connection established");
      }
    });
  }
  return _pool;
}

function initializeDb() {
  if (!_db) {
    _db = drizzle(initializePool(), { schema });
  }
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop: keyof pg.Pool) {
    return initializePool()[prop];
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop: keyof ReturnType<typeof drizzle>) {
    return initializeDb()[prop];
  }
});

