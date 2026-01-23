import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Ensure SSL mode is set for Supabase/Render pooler
function getDatabaseConfig() {
  let url = process.env.DATABASE_URL;
  
  // Add sslmode=require if not already present (for Supabase/Render)
  if (url && !url.includes("sslmode")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  
  const config: pg.PoolConfig = {
    connectionString: url,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  };
  
  // SSL configuration for Supabase/Render with certificate verification disabled
  // (Supabase/Render use valid certificates, but we explicitly disable verification for compatibility)
  if (url && (url.includes("supabase") || url.includes("pooler"))) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }
  
  return config;
}

export const pool = new Pool(getDatabaseConfig());
export const db = drizzle(pool, { schema });

