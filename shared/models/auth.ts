import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("user"), // user, admin
  status: text("status").default("pending"), // pending, active, blocked
  authProvider: text("auth_provider").default("replit"), // replit, local
  passwordHash: text("password_hash"), // For local auth only
  whatsapp: varchar("whatsapp", { length: 20 }), // WhatsApp phone number
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // Subscription expiration date
  uf: varchar("uf", { length: 2 }), // State (UF) for chat groups
  chatTermsAcceptedAt: timestamp("chat_terms_accepted_at"), // Last chat terms acceptance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
