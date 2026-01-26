import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// força carregar o .env da raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. " +
    "Copy .env.example to .env and configure your PostgreSQL connection string. " +
    "Format: postgresql://user:password@host:port/database?sslmode=require"
  );
}

/**
 * Drizzle Kit Configuration
 * 
 * Comandos disponíveis:
 * - npm run db:generate  → Gera migrations SQL em /migrations
 * - npm run db:migrate   → Aplica migrations no banco
 * - npm run db:push      → Push schema direto (sem migration files)
 * 
 * Recomendações:
 * - Desenvolvimento: use db:push (mais rápido)
 * - Produção: use db:generate + db:migrate (rastreável)
 */
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
