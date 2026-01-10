import { pgTable, serial, text, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'group' | 'dm'
  stateUf: varchar("state_uf", { length: 2 }), // For group type: SP, MG, etc
  name: text("name"), // For groups: "Médicos SP", for DM: null
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_rooms_state_uf").on(table.stateUf),
  index("idx_chat_rooms_type").on(table.type),
]);

export const chatRoomMembers = pgTable("chat_room_members", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_chat_room_members_room").on(table.roomId),
  index("idx_chat_room_members_user").on(table.userId),
]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: serial("room_id").references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 24h
}, (table) => [
  index("idx_chat_messages_room").on(table.roomId),
  index("idx_chat_messages_expires").on(table.expiresAt),
]);

export const chatContacts = pgTable("chat_contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  contactId: varchar("contact_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_contacts_user").on(table.userId),
]);

export const chatBlockedMessages = pgTable("chat_blocked_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // e.g., "CPF detected", "Email detected"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertChatContactSchema = createInsertSchema(chatContacts).omit({ id: true, createdAt: true });

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatContact = typeof chatContacts.$inferSelect;
export type InsertChatContact = z.infer<typeof insertChatContactSchema>;
