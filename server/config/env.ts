/**
 * Environment Variable Validation
 * 
 * This file validates all required environment variables at startup
 * and provides clear error messages if any are missing or invalid.
 */

import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("5000"),

  // Database (Required)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for database connection"),
  POSTGRES_ALLOW_SELF_SIGNED: z.enum(["true", "false"]).optional(),

  // JWT Secrets (Required in production, optional in development with warning)
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),

  // Session (Required)
  SESSION_SECRET: z.string().optional(),

  // ASAAS Payment Integration (Optional)
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_SANDBOX: z.enum(["true", "false"]).optional().default("true"),

  // OpenAI Integration (Optional)
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_BASE_URL: z.string().url().optional(),

  // WebPush Notifications (Optional)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().email().optional(),

  // Encryption (Optional - fallback to SESSION_SECRET)
  ENCRYPTION_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws error with clear message if validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    
    // Check for required secrets in production
    if (env.NODE_ENV === "production") {
      const requiredInProduction = ["JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET"];
      const missing = requiredInProduction.filter(key => !env[key as keyof EnvConfig]);
      
      if (missing.length > 0) {
        console.error(`❌ Required environment variables missing in production: ${missing.join(", ")}`);
        process.exit(1);
      }
      
      // Validate minimum length for secrets
      const secrets = {
        JWT_SECRET: env.JWT_SECRET,
        JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
        SESSION_SECRET: env.SESSION_SECRET,
      };
      
      for (const [key, value] of Object.entries(secrets)) {
        if (value && value.length < 32) {
          console.error(`❌ ${key} must be at least 32 characters in production`);
          process.exit(1);
        }
      }
      
      if (!env.ASAAS_API_KEY) {
        console.warn("⚠️  ASAAS_API_KEY not configured. Billing features will be disabled.");
      }
      
      if (env.ASAAS_SANDBOX === "true") {
        console.warn("⚠️  ASAAS_SANDBOX is true in production. Using sandbox environment.");
      }
    } else {
      // Development warnings
      if (!env.JWT_SECRET || !env.JWT_REFRESH_SECRET || !env.SESSION_SECRET) {
        console.warn("⚠️  JWT/Session secrets not configured. Using temporary development values.");
        console.warn("⚠️  Set JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET in .env for production.");
      }
    }

    // Log configuration (without secrets)
    console.log("✅ Environment validation successful");
    console.log(`   - NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   - PORT: ${env.PORT}`);
    console.log(`   - DATABASE_URL: ${env.DATABASE_URL ? "***configured***" : "MISSING"}`);
    console.log(`   - JWT_SECRET: ${env.JWT_SECRET ? "***configured***" : "not set"}`);
    console.log(`   - ASAAS_API_KEY: ${env.ASAAS_API_KEY ? "***configured***" : "not set"}`);
    console.log(`   - ASAAS_SANDBOX: ${env.ASAAS_SANDBOX}`);
    console.log(`   - OpenAI API: ${env.AI_INTEGRATIONS_OPENAI_API_KEY ? "enabled" : "disabled"}`);
    console.log(`   - WebPush: ${env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY ? "enabled" : "disabled"}`);

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:\n");
      
      error.errors.forEach((err) => {
        const field = err.path.join(".");
        console.error(`   - ${field}: ${err.message}`);
      });
      
      console.error("\n💡 How to fix:");
      console.error("   1. Create a .env file in the project root");
      console.error("   2. Copy from .env.example and fill in the required values");
      console.error("   3. For production, configure them in your hosting platform (Render, Vercel, etc.)");
      
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * Get validated environment config
 * Call this after validateEnv() has been called
 */
export function getEnv(): EnvConfig {
  return process.env as unknown as EnvConfig;
}
