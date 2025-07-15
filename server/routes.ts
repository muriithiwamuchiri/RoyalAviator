import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { nowPaymentsService } from "./services/nowpayments";
import { aviatorService } from "./services/aviator";
import { insertTransactionSchema, insertGameRoundSchema, insertNowPaymentsConfigSchema, insertGameSchema, insertGameApiSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Seed initial slot games
  seedGames();

  // Games API
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Transactions API
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const transactions = await storage.getTransactionsByUserId(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // NOWPayments API
  app.get("/api/nowpayments/currencies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const currencies = await nowPaymentsService.getAvailableCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  app.post("/api/nowpayments/payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { amount, currency } = req.body;
      
      // Validate minimum deposit amount
      if (amount < 20) {
        return res.status(400).json({ error: "Minimum deposit amount is $20 USD" });
      }
      
      const orderId = `${req.user!.id}-${Date.now()}`;
      
      const payment = await nowPaymentsService.createPayment(amount, currency, orderId);
      
      // Create pending transaction
      await storage.createTransaction({
        userId: req.user!.id,
        type: 'deposit',
        amount: amount.toString(),
        currency: 'USD',
        cryptoAmount: payment.pay_amount,
        cryptoCurrency: currency,
        status: 'pending',
        nowPaymentsId: payment.payment_id
      });
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.post("/api/nowpayments/withdrawal", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { amount, currency, address } = req.body;
      
      // Check user balance
      const user = await storage.getUser(req.user!.id);
      if (!user || parseFloat(user.realBalance || "0") < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const payout = await nowPaymentsService.createPayout(address, amount, currency);
      
      // Create withdrawal transaction
      await storage.createTransaction({
        userId: req.user!.id,
        type: 'withdrawal',
        amount: amount.toString(),
        currency: 'USD',
        cryptoAmount: payout.amount,
        cryptoCurrency: currency,
        status: 'pending',
        nowPaymentsId: payout.id
      });
      
      // Update user balance
      const newBalance = (parseFloat(user.realBalance || "0") - amount).toString();
      await storage.updateUserBalance(req.user!.id, newBalance);
      
      res.json(payout);
    } catch (error) {
      res.status(500).json({ error: "Failed to create withdrawal" });
    }
  });

  // Admin routes
  app.get("/api/admin/config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const config = await storage.getNowPaymentsConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const validatedConfig = insertNowPaymentsConfigSchema.parse(req.body);
      const config = await storage.updateNowPaymentsConfig(validatedConfig);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to update config" });
    }
  });

  app.get("/api/admin/test-connection", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const isConnected = await nowPaymentsService.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Admin Game Management routes
  app.get("/api/admin/games", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.post("/api/admin/games", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const validatedGame = insertGameSchema.parse(req.body);
      const game = await storage.createGame(validatedGame);
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.delete("/api/admin/games/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGame(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // Admin Game API Management routes
  app.get("/api/admin/game-apis", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const gameApis = await storage.getGameApis();
      res.json(gameApis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game APIs" });
    }
  });

  app.post("/api/admin/game-apis", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const validatedGameApi = insertGameApiSchema.parse(req.body);
      const gameApi = await storage.createGameApi(validatedGameApi);
      res.json(gameApi);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game API" });
    }
  });

  app.put("/api/admin/game-apis/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const id = parseInt(req.params.id);
      const validatedGameApi = insertGameApiSchema.partial().parse(req.body);
      const gameApi = await storage.updateGameApi(id, validatedGameApi);
      res.json(gameApi);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game API" });
    }
  });

  app.delete("/api/admin/game-apis/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGameApi(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game API" });
    }
  });

  // Games endpoints
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  });

  app.post("/api/games/play", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { gameId, betAmount, isDemo } = req.body;
      const userId = req.user!.id;

      // Validate input
      if (!gameId || !betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
        return res.status(400).json({ error: "Invalid game parameters" });
      }

      // Get user current balances
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentDemoBalance = parseFloat(user.demoBalance || "0");
      const currentRealBalance = parseFloat(user.realBalance || "0");

      // Check if user has sufficient balance
      if (isDemo) {
        if (betAmount > currentDemoBalance) {
          return res.status(400).json({ error: "Insufficient demo balance" });
        }
      } else {
        if (betAmount > currentRealBalance) {
          return res.status(400).json({ error: "Insufficient real balance" });
        }
      }

      // Simulate game outcome (simple slot machine logic)
      const random = Math.random();
      let multiplier = 0;
      let win = 0;

      // Win probability based on RTP (simplified)
      if (random < 0.1) { // 10% chance for big win
        multiplier = 5 + Math.random() * 10; // 5x to 15x
        win = betAmount * multiplier;
      } else if (random < 0.3) { // 20% chance for medium win
        multiplier = 1.5 + Math.random() * 2; // 1.5x to 3.5x
        win = betAmount * multiplier;
      } else if (random < 0.45) { // 15% chance for small win
        multiplier = 1 + Math.random() * 0.5; // 1x to 1.5x
        win = betAmount * multiplier;
      }
      // 55% chance for no win

      // Update user balance
      if (isDemo) {
        const newDemoBalance = currentDemoBalance - betAmount + win;
        await storage.updateUserBalance(userId, undefined, newDemoBalance.toFixed(2));
      } else {
        const newRealBalance = currentRealBalance - betAmount + win;
        await storage.updateUserBalance(userId, newRealBalance.toFixed(2), undefined);
      }

      // Create game round record
      await storage.createGameRound({
        userId,
        gameId,
        betAmount: betAmount.toString(),
        winAmount: win.toString(),
        multiplier: multiplier.toString(),
        isDemoMode: isDemo
      });

      res.json({
        win,
        multiplier,
        result: win > 0 ? "win" : "loss",
        newBalance: isDemo ? 
          (currentDemoBalance - betAmount + win).toFixed(2) : 
          (currentRealBalance - betAmount + win).toFixed(2)
      });

    } catch (error) {
      console.error('Error playing game:', error);
      res.status(500).json({ error: 'Failed to play game' });
    }
  });

  // Game rounds API
  app.post("/api/game/round", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedRound = insertGameRoundSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const gameRound = await storage.createGameRound(validatedRound);
      
      // Update user balance based on result
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const betAmount = parseFloat(validatedRound.betAmount);
        const winAmount = parseFloat(validatedRound.winAmount || "0");
        
        if (validatedRound.isDemoMode) {
          const newDemoBalance = (parseFloat(user.demoBalance || "0") - betAmount + winAmount).toString();
          await storage.updateUserBalance(req.user!.id, undefined, newDemoBalance);
        } else {
          const newRealBalance = (parseFloat(user.realBalance || "0") - betAmount + winAmount).toString();
          await storage.updateUserBalance(req.user!.id, newRealBalance, undefined);
        }
      }
      
      res.json(gameRound);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game round" });
    }
  });

  // NOWPayments webhook
  app.post("/api/webhook/nowpayments", async (req, res) => {
    try {
      const { payment_id, payment_status, price_amount, actually_paid } = req.body;
      
      if (payment_status === 'finished') {
        // Update transaction status
        await storage.updateTransactionStatus(payment_id, 'completed');
        
        // Find and update user balance
        const transactions = await storage.getTransactionsByUserId(payment_id);
        // Implementation would find the correct transaction and update balance
      }
      
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time Aviator game
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    // Send current game state
    const gameState = aviatorService.getGameState();
    if (gameState) {
      ws.send(JSON.stringify({ type: 'gameState', data: gameState }));
    }

    // Send recent games
    const recentGames = aviatorService.getRecentGames();
    ws.send(JSON.stringify({ type: 'recentGames', data: recentGames }));

    // Listen for Aviator game events
    const onGameUpdate = (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'gameUpdate', data }));
      }
    };

    const onGameCrashed = (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'gameCrashed', data }));
      }
    };

    const onPlayerCashedOut = (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'playerCashedOut', data }));
      }
    };

    aviatorService.on('gameUpdate', onGameUpdate);
    aviatorService.on('gameCrashed', onGameCrashed);
    aviatorService.on('playerCashedOut', onPlayerCashedOut);

    // Handle WebSocket messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'placeBet':
            // Handle bet placement
            break;
          case 'cashOut':
            // Handle cash out
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      aviatorService.off('gameUpdate', onGameUpdate);
      aviatorService.off('gameCrashed', onGameCrashed);
      aviatorService.off('playerCashedOut', onPlayerCashedOut);
    });
  });

  return httpServer;
}

// Seed initial games
async function seedGames() {
  const existingGames = await storage.getGames();
  if (existingGames.length > 0) return;

  const slotGames = [
    {
      name: "Egyptian Riches",
      type: "slot",
      rtp: "96.2",
      demoRtp: "98.5",
      volatility: "Medium",
      paylines: 20,
      features: ["Wilds", "Free Spins", "Multipliers"],
      imageUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Uncover ancient treasures in this mystical Egyptian adventure",
      minBet: "0.20",
      maxBet: "50.00"
    },
    {
      name: "Neon Nights",
      type: "slot",
      rtp: "97.1",
      demoRtp: "98.8",
      volatility: "High",
      paylines: 25,
      features: ["Sticky Wilds", "Mega Wins", "Cascade Reels"],
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Experience the vibrant city nightlife with electric wins",
      minBet: "0.50",
      maxBet: "200.00"
    },
    {
      name: "Galactic Fortune",
      type: "slot",
      rtp: "95.8",
      demoRtp: "98.2",
      volatility: "Medium",
      paylines: 30,
      features: ["Expanding Wilds", "Cosmic Bonus", "Planet Multipliers"],
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Journey through space to discover cosmic treasures",
      minBet: "0.25",
      maxBet: "75.00"
    },
    {
      name: "Wild Safari",
      type: "slot",
      rtp: "96.5",
      demoRtp: "98.4",
      volatility: "Low",
      paylines: 20,
      features: ["Stacked Animals", "Safari Bonus", "Wild Stampede"],
      imageUrl: "https://images.unsplash.com/photo-1549366021-9f761d040a94?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Embark on an African safari adventure with wild animals",
      minBet: "0.10",
      maxBet: "25.00"
    },
    {
      name: "Dragon's Hoard",
      type: "slot",
      rtp: "97.3",
      demoRtp: "98.9",
      volatility: "High",
      paylines: 40,
      features: ["Dragon Wilds", "Fire Respins", "Treasure Vault"],
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Face mighty dragons and claim their legendary treasures",
      minBet: "0.40",
      maxBet: "150.00"
    },
    {
      name: "Ocean's Treasure",
      type: "slot",
      rtp: "96.8",
      demoRtp: "98.6",
      volatility: "Medium",
      paylines: 25,
      features: ["Pirate Bonus", "Shipwreck Wilds", "Treasure Map"],
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Dive deep into the ocean to find sunken pirate treasures",
      minBet: "0.30",
      maxBet: "100.00"
    },
    {
      name: "Royal Crown",
      type: "slot",
      rtp: "97.5",
      demoRtp: "99.0",
      volatility: "High",
      paylines: 50,
      features: ["Crown Wilds", "Royal Bonus", "Jewel Multipliers"],
      imageUrl: "https://images.unsplash.com/photo-1576833220799-5e3cde1e4e1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Enter the royal palace and claim the crown jewels",
      minBet: "0.50",
      maxBet: "250.00"
    },
    {
      name: "Mystic Forest",
      type: "slot",
      rtp: "96.0",
      demoRtp: "98.3",
      volatility: "Low",
      paylines: 15,
      features: ["Fairy Magic", "Enchanted Wilds", "Nature Bonus"],
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      description: "Discover magical creatures and mystical powers in the enchanted forest",
      minBet: "0.15",
      maxBet: "40.00"
    }
  ];

  for (const game of slotGames) {
    await storage.createGame(game);
  }

  // Add Aviator game
  await storage.createGame({
    name: "Aviator",
    type: "aviator",
    rtp: "97.0",
    demoRtp: "98.5",
    volatility: "High",
    paylines: null,
    features: ["Provably Fair", "Real-time Multiplayer", "Auto Cash-out"],
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080"
  });
}
