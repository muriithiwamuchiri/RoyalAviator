import { users, transactions, games, gameRounds, nowPaymentsConfig, type User, type InsertUser, type Transaction, type InsertTransaction, type Game, type InsertGame, type GameRound, type InsertGameRound, type NowPaymentsConfig, type InsertNowPaymentsConfig } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, realBalance?: string, demoBalance?: string): Promise<void>;

  // Transaction management
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, nowPaymentsId?: string): Promise<void>;

  // Game management
  getGames(): Promise<Game[]>;
  getGameById(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Game rounds
  createGameRound(gameRound: InsertGameRound): Promise<GameRound>;
  getGameRoundsByUserId(userId: number, limit?: number): Promise<GameRound[]>;
  
  // NOWPayments configuration
  getNowPaymentsConfig(): Promise<NowPaymentsConfig | undefined>;
  updateNowPaymentsConfig(config: InsertNowPaymentsConfig): Promise<NowPaymentsConfig>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, realBalance?: string, demoBalance?: string): Promise<void> {
    const updateData: any = {};
    if (realBalance !== undefined) updateData.realBalance = realBalance;
    if (demoBalance !== undefined) updateData.demoBalance = demoBalance;
    
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return result;
  }

  async getTransactionsByUserId(userId: number, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async updateTransactionStatus(id: number, status: string, nowPaymentsId?: string): Promise<void> {
    const updateData: any = { status };
    if (nowPaymentsId) updateData.nowPaymentsId = nowPaymentsId;
    
    await db.update(transactions).set(updateData).where(eq(transactions.id, id));
  }

  async getGames(): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.isActive, true));
  }

  async getGameById(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db
      .insert(games)
      .values(game)
      .returning();
    return result;
  }

  async createGameRound(gameRound: InsertGameRound): Promise<GameRound> {
    const [result] = await db
      .insert(gameRounds)
      .values(gameRound)
      .returning();
    return result;
  }

  async getGameRoundsByUserId(userId: number, limit = 10): Promise<GameRound[]> {
    return await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.userId, userId))
      .orderBy(desc(gameRounds.createdAt))
      .limit(limit);
  }

  async getNowPaymentsConfig(): Promise<NowPaymentsConfig | undefined> {
    const [config] = await db
      .select()
      .from(nowPaymentsConfig)
      .where(eq(nowPaymentsConfig.isActive, true));
    return config || undefined;
  }

  async updateNowPaymentsConfig(config: InsertNowPaymentsConfig): Promise<NowPaymentsConfig> {
    // Deactivate existing configs
    await db.update(nowPaymentsConfig).set({ isActive: false });
    
    // Insert new config
    const [result] = await db
      .insert(nowPaymentsConfig)
      .values(config)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
