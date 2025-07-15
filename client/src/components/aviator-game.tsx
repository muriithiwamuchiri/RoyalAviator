import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Plane, TrendingUp, DollarSign, Zap, Star } from "lucide-react";

interface GameState {
  multiplier: number;
  status: 'waiting' | 'flying' | 'crashed';
  timeLeft?: number;
}

interface RecentWin {
  player: string;
  amount: string;
  multiplier: string;
}

export default function AviatorGame() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    multiplier: 1.00,
    status: 'waiting'
  });
  const [betAmount, setBetAmount] = useState("10");
  const [autoCashout, setAutoCashout] = useState("2.00");
  const [userBet, setUserBet] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock recent wins data with more appealing wins
  const recentWins: RecentWin[] = [
    { player: "Player***2847", amount: "$1,245.80", multiplier: "12.45x" },
    { player: "Player***9234", amount: "$3,890.20", multiplier: "8.95x" },
    { player: "Player***5671", amount: "$2,341.60", multiplier: "6.78x" },
    { player: "Player***1023", amount: "$5,675.25", multiplier: "15.14x" },
    { player: "Player***7845", amount: "$892.40", multiplier: "4.46x" },
    { player: "Player***3421", amount: "$1,567.80", multiplier: "7.84x" },
    { player: "Player***9876", amount: "$4,234.70", multiplier: "21.17x" },
    { player: "Player***6543", amount: "$987.50", multiplier: "3.95x" },
  ];

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const prevState = gameState;
      
      switch (data.type) {
        case 'gameState':
        case 'gameUpdate':
          setGameState(data.data);
          
          // Audio effects disabled
          break;
        case 'gameCrashed':
          setGameState(prev => ({ ...prev, status: 'crashed' }));
          setUserBet(null);
          
          // Audio effects disabled
          break;
        case 'playerCashedOut':
          // Audio effects disabled
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Canvas animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let smokeParticles: Array<{x: number, y: number, age: number}> = [];
    let explosionParticles: Array<{x: number, y: number, vx: number, vy: number, age: number}> = [];
    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw dynamic sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (gameState.status === 'crashed') {
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.7, '#FF8E8E');
        gradient.addColorStop(1, '#FFB3B3');
      } else {
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(0.7, '#7BB3F0');
        gradient.addColorStop(1, '#A8D0F0');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated clouds
      const time = Date.now() * 0.001;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 4; i++) {
        const cloudX = (100 + i * 120 + Math.sin(time + i) * 20) % (canvas.width + 100);
        const cloudY = 60 + Math.sin(time * 0.5 + i) * 15;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 25 + i * 5, 0, Math.PI * 2);
        ctx.arc(cloudX + 20, cloudY, 20 + i * 3, 0, Math.PI * 2);
        ctx.arc(cloudX - 15, cloudY + 10, 18 + i * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Calculate plane position with ascending trajectory
      const progress = Math.min((gameState.multiplier - 1) / 9, 1);
      const planeX = 50 + progress * (canvas.width - 100);
      const planeY = canvas.height - 80 - progress * (canvas.height - 120);
      
      // Draw red trajectory line
      if (gameState.status === 'flying') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 80);
        ctx.lineTo(planeX, planeY);
        ctx.stroke();
        
        // Add pulsing effect to the line
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + 0.3 * Math.sin(time * 3)})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 80);
        ctx.lineTo(planeX, planeY);
        ctx.stroke();
      }

      // Draw enhanced smoke trail
      if (gameState.status === 'flying') {
        smokeParticles.push({x: planeX - 20, y: planeY + 5, age: 0});
        
        // Update and draw smoke particles
        smokeParticles = smokeParticles.filter(particle => {
          particle.age += 0.02;
          particle.x -= 1;
          particle.y += Math.sin(particle.age * 5) * 0.5;
          
          if (particle.age < 1) {
            const alpha = 1 - particle.age;
            const size = 2 + particle.age * 6;
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            return true;
          }
          return false;
        });
      }

      // Draw plane with rotation based on trajectory
      ctx.save();
      ctx.translate(planeX, planeY);
      const angle = gameState.status === 'flying' ? -Math.atan2(progress * (canvas.height - 120), progress * (canvas.width - 100)) : 0;
      ctx.rotate(angle);
      
      // Enhanced plane drawing
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✈️', 0, 0);
      
      // Add glow effect to plane
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = gameState.status === 'flying' ? 10 : 5;
      ctx.fillText('✈️', 0, 0);
      
      ctx.restore();

      // Draw crash explosion
      if (gameState.status === 'crashed') {
        if (explosionParticles.length === 0) {
          // Create explosion particles
          for (let i = 0; i < 20; i++) {
            explosionParticles.push({
              x: planeX,
              y: planeY,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              age: 0
            });
          }
        }
        
        // Update and draw explosion particles
        explosionParticles = explosionParticles.filter(particle => {
          particle.age += 0.05;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.2; // gravity
          
          if (particle.age < 1) {
            const alpha = 1 - particle.age;
            const size = 3 + particle.age * 5;
            ctx.fillStyle = `rgba(255, ${100 - particle.age * 100}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            return true;
          }
          return false;
        });
      }

      // Draw multiplier display
      if (gameState.status === 'flying') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${gameState.multiplier.toFixed(2)}x`, planeX, planeY - 40);
        
        // Add shadow to multiplier text
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(`${gameState.multiplier.toFixed(2)}x`, planeX, planeY - 40);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [gameState]);

  const handlePlaceBet = () => {
    if (gameState.status !== 'waiting') return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // For guest users, allow unlimited demo play
    if (!user) {
      // Guest mode - no balance check, unlimited demo play
    } else {
      // Determine which balance to use
      const hasRealBalance = parseFloat(user.realBalance || "0") > 0;
      const demoBalance = parseFloat(user.demoBalance || "0");
      const realBalance = parseFloat(user.realBalance || "0");
      
      // Check balance availability
      if (!hasRealBalance) {
        // Playing with demo balance
        if (amount > demoBalance) {
          toast({
            title: "Insufficient demo balance",
            description: "You don't have enough demo balance to place this bet",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Playing with real balance
        if (amount > realBalance) {
          toast({
            title: "Insufficient real balance",
            description: "You don't have enough real balance to place this bet",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setUserBet(amount);
    
    // Audio effects disabled
    
    // Send bet to server via WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'placeBet',
        amount: amount,
        autoCashout: parseFloat(autoCashout),
        isDemo: !user || !parseFloat(user?.realBalance || "0"),
        userId: user?.id || 0
      }));
    }
  };

  const handleCashOut = () => {
    if (!userBet || gameState.status !== 'flying') return;
    
    // Audio effects disabled
    
    // Send cash out to server via WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'cashOut'
      }));
    }
  };

  const currentGain = userBet ? (gameState.multiplier - 1) * userBet : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          className="w-full h-64 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-800 rounded-xl"
        />
        
        {/* Game Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-yellow-400/30">
          <div className={`text-3xl font-bold mb-1 ${
            gameState.status === 'flying' ? 'text-yellow-400 animate-glow' : 
            gameState.status === 'crashed' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {gameState.multiplier.toFixed(2)}x
          </div>
          <div className="text-sm text-gray-300">
            {userBet ? `+$${currentGain.toFixed(2)}` : 'Place your bet!'}
          </div>
        </div>
        
        {/* Game Status */}
        <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm">
          <div className={`text-sm font-medium px-2 py-1 rounded ${
            gameState.status === 'flying' ? 'bg-green-500/80 text-white' :
            gameState.status === 'crashed' ? 'bg-red-500/80 text-white' :
            'bg-yellow-500/80 text-black'
          }`}>
            {gameState.status === 'flying' ? 'FLYING' :
             gameState.status === 'crashed' ? 'CRASHED' :
             'WAITING'}
          </div>
        </div>

        {/* Crash Effect Overlay */}
        {gameState.status === 'crashed' && (
          <div className="absolute inset-0 bg-red-600/20 rounded-xl flex items-center justify-center">
            <div className="text-6xl font-bold text-red-400 animate-pulse">
              💥 CRASHED!
            </div>
          </div>
        )}

        {/* Audio Controls Disabled */}

        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute bottom-4 left-4 bg-red-500/80 text-white px-3 py-1 rounded-lg text-sm">
            Disconnected
          </div>
        )}
      </div>
      
      {/* Game Controls */}
      <div className="space-y-6">
        {/* Balance Mode Indicator */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Playing Mode</h4>
              <p className="text-sm text-gray-400">
                {!user ? "Guest Demo" : (parseFloat(user.realBalance || "0") === 0 ? "Demo Account" : "Real Money")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-400">
                {!user ? "∞" : (parseFloat(user.realBalance || "0") === 0 ? `$${user.demoBalance}` : `$${user.realBalance}`)}
              </div>
              <div className="text-sm text-gray-400">
                {!user ? "Unlimited Demo" : (parseFloat(user.realBalance || "0") === 0 ? "Demo Balance" : "Real Balance")}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <Label className="text-sm text-gray-300 mb-2">Bet Amount</Label>
            <div className="relative">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                step="0.01"
                className="bg-gray-700 border-gray-600 text-white pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">USD</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-4">
            <Label className="text-sm text-gray-300 mb-2">Auto Cashout</Label>
            <div className="relative">
              <Input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                min="1.01"
                step="0.01"
                className="bg-gray-700 border-gray-600 text-white pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">x</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          {!userBet ? (
            <Button
              onClick={handlePlaceBet}
              disabled={gameState.status !== 'waiting'}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-bold"
            >
              PLACE BET
            </Button>
          ) : (
            <Button
              onClick={handleCashOut}
              disabled={gameState.status !== 'flying'}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 text-lg font-bold"
            >
              CASH OUT
            </Button>
          )}
        </div>
        
        {/* Recent Wins Ticker */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400 flex items-center space-x-2">
            <Star className="text-yellow-400" size={18} />
            <span>Big Wins</span>
          </h3>
          <div className="space-y-2 max-h-32 overflow-hidden">
            <div className="animate-pulse-slow">
              {recentWins.slice(0, 4).map((win, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 hover:bg-gray-700/30 rounded px-2 transition-colors">
                  <span className="text-gray-300 flex items-center space-x-1">
                    <DollarSign size={12} className="text-green-400" />
                    <span>{win.player}</span>
                  </span>
                  <span className="text-green-400 font-bold">{win.amount}</span>
                  <span className="text-yellow-400 font-bold bg-yellow-400/20 px-2 py-1 rounded">{win.multiplier}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-500">
              💎 {recentWins.length} players won today
            </div>
          </div>
        </div>
        
        {/* User Balance Display */}
        {user && (
          <div className="bg-gray-800/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Balance:</span>
              <span className="text-green-400 font-bold">${user.realBalance}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-300">Demo:</span>
              <span className="text-yellow-400 font-bold">${user.demoBalance}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
