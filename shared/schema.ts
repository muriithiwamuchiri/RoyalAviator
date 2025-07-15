import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  realBalance: decimal("real_balance", { precision: 10, scale: 2 }).default("0.00"),
  demoBalance: decimal("demo_balance", { precision: 10, scale: 2 }).default("100.00"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'bet', 'win'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  cryptoAmount: decimal("crypto_amount", { precision: 20, scale: 8 }),
  cryptoCurrency: text("crypto_currency"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  nowPaymentsId: text("nowpayments_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'slot', 'aviator'
  rtp: decimal("rtp", { precision: 5, scale: 2 }).notNull(),
  demoRtp: decimal("demo_rtp", { precision: 5, scale: 2 }).notNull(),
  volatility: text("volatility").notNull(),
  paylines: integer("paylines"),
  features: text("features").array(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameRounds = pgTable("game_rounds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).default("0.00"),
  multiplier: decimal("multiplier", { precision: 8, scale: 2 }),
  isDemoMode: boolean("is_demo_mode").default(false),
  gameData: jsonb("game_data"), // Store game-specific data
  createdAt: timestamp("created_at").defaultNow(),
});

export const nowPaymentsConfig = pgTable("nowpayments_config", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key").notNull(),
  ipnSecret: text("ipn_secret").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  gameRounds: many(gameRounds),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const gameRoundsRelations = relations(gameRounds, ({ one }) => ({
  user: one(users, {
    fields: [gameRounds.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameRounds.gameId],
    references: [games.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  realBalance: true,
  demoBalance: true,
  isAdmin: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertGameRoundSchema = createInsertSchema(gameRounds).omit({
  id: true,
  createdAt: true,
});

export const insertNowPaymentsConfigSchema = createInsertSchema(nowPaymentsConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type NowPaymentsConfig = typeof nowPaymentsConfig.$inferSelect;
export type InsertNowPaymentsConfig = z.infer<typeof insertNowPaymentsConfigSchema>;
