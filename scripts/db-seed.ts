#!/usr/bin/env node
/**
 * Database Seed Script - Run AFTER server starts
 * Usage: npm run db:seed
 * 
 * Este script:
 * 1. Conecta ao banco de dados
 * 2. Faz upsert dos planos padrão
 * 3. Faz upsert dos planos de faturamento
 * 4. Encerra a conexão e retorna exit code apropriado
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

// ============================================
// Importar storage e pool
// ============================================
const { storage } = await import("../server/storage.js");
const { pool } = await import("../server/db.js");

async function seed() {
  console.log("[seed] Starting database seeding...");
  console.log(`[seed] DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);

  try {
    // Test connection
    console.log("[seed] Testing database connection...");
    const result = await pool.query("SELECT 1 as health");
    if (!result.rows?.[0]?.health) {
      throw new Error("Database connection test failed");
    }
    console.log("[seed] ✓ Database connection successful");

    // Seed default plans
    console.log("[seed] Seeding default plans...");
    await storage.upsertPlans();
    console.log("[seed] ✓ Default plans seeded successfully");

    // Seed billing plans
    console.log("[seed] Seeding billing plans...");
    await storage.seedBillingPlans();
    console.log("[seed] ✓ Billing plans seeded successfully");

    console.log("[seed] ✅ All seeds completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("[seed] ❌ Seeding failed:");
    console.error(err);
    process.exit(1);
  } finally {
    // Always close pool
    try {
      await pool.end();
      console.log("[seed] Database connection closed");
    } catch (closeErr) {
      console.error("[seed] Error closing database connection:", closeErr);
    }
  }
}

// Run seed
seed().catch((err) => {
  console.error("[seed] Unexpected error:", err);
  process.exit(1);
});
