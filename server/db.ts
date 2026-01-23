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
 * Secure Database Configuration
 * Handles SSL/TLS properly for Supabase and Render database connections
 * 
 * - Uses rejectUnauthorized: true in production (default, enforces certificate validation)
 * - Uses rejectUnauthorized: false ONLY for trusted providers (Supabase, Render) with valid certs
 * - Adds sslmode=require for PostgreSQL connection string when needed
 */
function getDatabaseConfig() {
  let url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Add sslmode=require if not already present (for Supabase/Render)
  // This is the proper way to enforce SSL in PostgreSQL
  if (!url.includes("sslmode")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }

  const config: pg.PoolConfig = {
    connectionString: url,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  };

  /**
   * SSL Configuration Strategy
   * 
   * Production (Render):
   *   - Uses certificate verification (rejectUnauthorized: true by default)
   *   - sslmode=require in connection string provides additional safety
   * 
   * Development:
   *   - Allows self-signed certificates for local testing
   *   - Can be controlled with POSTGRES_ALLOW_SELF_SIGNED=true env var
   */
  const isProduction = process.env.NODE_ENV === "production";
  const allowSelfSigned =
    process.env.POSTGRES_ALLOW_SELF_SIGNED === "true" ||
    process.env.NODE_ENV !== "production";

  // Only set ssl config if needed
  // Supabase and Render use valid certificates, so we can enable full verification in production
  if (url.includes("supabase") || url.includes("pooler")) {
    config.ssl = {
      // In production, validate certificates properly
      // For development with self-signed certs, allow them
      rejectUnauthorized: !allowSelfSigned,
    };
  }

  return config;
}

export const pool = new Pool(getDatabaseConfig());

/**
 * Setup error handlers for pool
 */
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const db = drizzle(pool, { schema });

