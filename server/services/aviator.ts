import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface AviatorGameState {
  id: string;
  multiplier: number;
  status: 'waiting' | 'flying' | 'crashed';
  startTime: number;
  crashPoint?: number;
  players: Map<string, PlayerBet>;
}

export interface PlayerBet {
  userId: number;
  amount: number;
  autoCashOut?: number;
  cashedOut?: boolean;
  cashOutMultiplier?: number;
}

export class AviatorService extends EventEmitter {
  private currentGame: AviatorGameState | null = null;
  private gameInterval: NodeJS.Timeout | null = null;
  private readonly GAME_DURATION = 15000; // 15 seconds max flight time
  private readonly TICK_RATE = 100; // Update every 100ms

  constructor() {
    super();
    this.startNewGame();
  }

  private generateCrashPoint(): number {
    // Provably fair crash point generation
    const seed = Date.now().toString();
    const hash = createHash('sha256').update(seed).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    
    // Generate crash point between 1.0x and 10.0x with house edge
    const crashPoint = Math.max(1.0, (hashInt % 1000) / 100.0);
    return Math.min(crashPoint, 10.0);
  }

  private startNewGame() {
    this.currentGame = {
      id: Date.now().toString(),
      multiplier: 1.0,
      status: 'waiting',
      startTime: Date.now(),
      crashPoint: this.generateCrashPoint(),
      players: new Map()
    };

    // Wait 5 seconds before starting flight
    setTimeout(() => {
      this.startFlight();
    }, 5000);

    this.emit('gameStarted', this.currentGame);
  }

  private startFlight() {
    if (!this.currentGame) return;

    this.currentGame.status = 'flying';
    this.currentGame.startTime = Date.now();

    this.gameInterval = setInterval(() => {
      if (!this.currentGame) return;

      const elapsedTime = Date.now() - this.currentGame.startTime;
      const progress = elapsedTime / this.GAME_DURATION;
      
      // Calculate multiplier based on time elapsed
      this.currentGame.multiplier = 1.0 + (progress * 9.0);

      // Check for crash
      if (this.currentGame.multiplier >= this.currentGame.crashPoint!) {
        this.crashGame();
        return;
      }

      // Check for auto cash-outs
      for (const [playerId, bet] of this.currentGame.players.entries()) {
        if (bet.autoCashOut && !bet.cashedOut && 
            this.currentGame.multiplier >= bet.autoCashOut) {
          this.cashOutPlayer(playerId);
        }
      }

      this.emit('gameUpdate', {
        id: this.currentGame.id,
        multiplier: this.currentGame.multiplier,
        status: this.currentGame.status
      });
    }, this.TICK_RATE);
  }

  private crashGame() {
    if (!this.currentGame || !this.gameInterval) return;

    clearInterval(this.gameInterval);
    this.currentGame.status = 'crashed';

    this.emit('gameCrashed', {
      id: this.currentGame.id,
      crashPoint: this.currentGame.crashPoint,
      multiplier: this.currentGame.multiplier
    });

    // Start new game after 3 seconds
    setTimeout(() => {
      this.startNewGame();
    }, 3000);
  }

  placeBet(userId: number, amount: number, autoCashOut?: number): boolean {
    if (!this.currentGame || this.currentGame.status !== 'waiting') {
      return false;
    }

    const playerId = userId.toString();
    this.currentGame.players.set(playerId, {
      userId,
      amount,
      autoCashOut,
      cashedOut: false
    });

    return true;
  }

  cashOutPlayer(playerId: string): number | null {
    if (!this.currentGame || this.currentGame.status !== 'flying') {
      return null;
    }

    const bet = this.currentGame.players.get(playerId);
    if (!bet || bet.cashedOut) {
      return null;
    }

    bet.cashedOut = true;
    bet.cashOutMultiplier = this.currentGame.multiplier;

    const winAmount = bet.amount * this.currentGame.multiplier;
    
    this.emit('playerCashedOut', {
      playerId,
      multiplier: this.currentGame.multiplier,
      winAmount
    });

    return winAmount;
  }

  getGameState(): AviatorGameState | null {
    return this.currentGame;
  }

  getRecentGames(): Array<{multiplier: number; crashPoint: number; timestamp: number}> {
    // In a real implementation, this would fetch from database
    // For now, return mock data
    return [
      { multiplier: 2.45, crashPoint: 2.45, timestamp: Date.now() - 60000 },
      { multiplier: 1.78, crashPoint: 1.78, timestamp: Date.now() - 120000 },
      { multiplier: 4.68, crashPoint: 4.68, timestamp: Date.now() - 180000 },
      { multiplier: 3.14, crashPoint: 3.14, timestamp: Date.now() - 240000 },
    ];
  }
}

export const aviatorService = new AviatorService();
