import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { nowPaymentsService } from "./services/nowpayments";
import { aviatorService } from "./services/aviator";
import { insertTransactionSchema, insertGameRoundSchema, insertNowPaymentsConfigSchema } from "@shared/schema";

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
      imageUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
    },
    {
      name: "Mythical Treasures",
      type: "slot",
      rtp: "97.1",
      demoRtp: "98.8",
      volatility: "High",
      paylines: 25,
      features: ["Bonus Rounds", "Free Spins", "Wilds"],
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
    },
    {
      name: "Space Adventures",
      type: "slot",
      rtp: "95.8",
      demoRtp: "98.2",
      volatility: "Medium",
      paylines: 30,
      features: ["Expanding Wilds", "Free Spins"],
      imageUrl: "https://pixabay.com/get/g6752f432bb29bc83465d0f9d038f5a6532a3867b388d6fcd66027db9a6301d4f53cdd3c60aaf15bdca54be97ab71d1a327b15ab718c1bd260c2b3770ebcaafb8_1280.jpg"
    },
    {
      name: "Animal Kingdom",
      type: "slot",
      rtp: "96.5",
      demoRtp: "98.4",
      volatility: "Low",
      paylines: 20,
      features: ["Stacked Wilds", "Free Spins"],
      imageUrl: "https://pixabay.com/get/gb850707b7c0a17e8da3dc18a55b5987a28ba1cb6f429b52403b0227d795ecef2afd1d85c8e88f4f4bc5ec465c0ca5ba0f8effa9933027e1bcbe1a5b6d7936f2b_1280.jpg"
    },
    {
      name: "Royal Diamonds",
      type: "slot",
      rtp: "97.3",
      demoRtp: "98.9",
      volatility: "High",
      paylines: 40,
      features: ["Cascading Reels", "Multipliers", "Free Spins"],
      imageUrl: "https://pixabay.com/get/g9289301429324e88905e0ebb550f71d236f258e16b960e87e5bcb5829e6de7056ef312167f1e53181f2563a001c86601bda486eece8393da91a0dc4eddc802e0_1280.jpg"
    },
    {
      name: "Pirate's Gold",
      type: "slot",
      rtp: "96.8",
      demoRtp: "98.6",
      volatility: "Medium",
      paylines: 25,
      features: ["Treasure Bonus", "Free Spins", "Wilds"],
      imageUrl: "https://pixabay.com/get/gfe9f7fc91486685252fd9e81a52e1e0f5e5471e1bfe8f14d0afd6a53803909d6961c744d8bb180d0361aded770fbc92768fbef529d29dff5779d564d07938e93_1280.jpg"
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
