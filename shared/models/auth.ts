import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text, serial, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
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
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("user"), // user, admin
  status: text("status").default("pending"), // pending, active, blocked
  authProvider: text("auth_provider").default("email"), // email, google, apple
  passwordHash: text("password_hash"), // For local auth only (deprecated)
  whatsapp: varchar("whatsapp", { length: 20 }),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  uf: varchar("uf", { length: 2 }),
  lastUfChangeAt: timestamp("last_uf_change_at"),
  chatTermsAcceptedAt: timestamp("chat_terms_accepted_at"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Auth Identities (links providers to users)
export const authIdentities = pgTable("auth_identities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // email, google, apple
  providerUserId: text("provider_user_id").notNull(), // email address for email, sub for OAuth
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("auth_identities_provider_provider_user_id_key").on(table.provider, table.providerUserId),
]);

export const insertAuthIdentitySchema = createInsertSchema(authIdentities).omit({ id: true, createdAt: true });
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type InsertAuthIdentity = z.infer<typeof insertAuthIdentitySchema>;

// Email Auth Tokens (for code + magic link verification)
export const emailAuthTokens = pgTable("email_auth_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  codeHash: text("code_hash").notNull(), // bcrypt hash of 6-digit code
  tokenHash: text("token_hash").notNull(), // bcrypt hash of magic link token
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailAuthTokenSchema = createInsertSchema(emailAuthTokens).omit({ id: true, createdAt: true, usedAt: true });
export type EmailAuthToken = typeof emailAuthTokens.$inferSelect;
export type InsertEmailAuthToken = z.infer<typeof insertEmailAuthTokenSchema>;

// Billing Plans (configurable by admin)
export const billingPlans = pgTable("billing_plans", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // monthly, semiannual, annual
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(), // Price in cents (2990 = R$ 29,90)
  originalPriceCents: integer("original_price_cents"), // Original price before discount (for display)
  durationDays: integer("duration_days").notNull(), // 30, 180, 365
  discountPercent: integer("discount_percent").default(0), // Display discount percentage
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillingPlanSchema = createInsertSchema(billingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;

// Billing Orders (tracks checkout attempts)
export const billingOrders = pgTable("billing_orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planCode: text("plan_code").notNull(),
  originalPriceCents: integer("original_price_cents").notNull(),
  discountCents: integer("discount_cents").default(0),
  finalPriceCents: integer("final_price_cents").notNull(),
  couponCode: text("coupon_code"),
  paymentMethod: text("payment_method"), // PIX, CREDIT_CARD
  asaasPaymentId: text("asaas_payment_id"),
  asaasPaymentUrl: text("asaas_payment_url"),
  status: text("status").default("pending"), // pending, processing, paid, failed, canceled
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillingOrderSchema = createInsertSchema(billingOrders).omit({ id: true, createdAt: true, updatedAt: true, paidAt: true });
export type BillingOrder = typeof billingOrders.$inferSelect;
export type InsertBillingOrder = z.infer<typeof insertBillingOrderSchema>;

// User Entitlements (subscription access)
export const userEntitlements = pgTable("user_entitlements", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  status: text("status").default("inactive"), // active, inactive, expired
  planCode: text("plan_code"),
  accessUntil: timestamp("access_until"),
  lastOrderId: integer("last_order_id").references(() => billingOrders.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserEntitlementSchema = createInsertSchema(userEntitlements).omit({ createdAt: true, updatedAt: true });
export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type InsertUserEntitlement = z.infer<typeof insertUserEntitlementSchema>;
