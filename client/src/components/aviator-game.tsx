import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Plane, TrendingUp } from "lucide-react";

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

  // Mock recent wins data
  const recentWins: RecentWin[] = [
    { player: "Player***2847", amount: "$127.50", multiplier: "2.55x" },
    { player: "Player***9234", amount: "$89.20", multiplier: "1.78x" },
    { player: "Player***5671", amount: "$234.10", multiplier: "4.68x" },
    { player: "Player***1023", amount: "$156.75", multiplier: "3.14x" },
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
      
      switch (data.type) {
        case 'gameState':
        case 'gameUpdate':
          setGameState(data.data);
          break;
        case 'gameCrashed':
          setGameState(prev => ({ ...prev, status: 'crashed' }));
          setUserBet(null);
          break;
        case 'playerCashedOut':
          // Handle player cash out
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#4682B4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(100, 80, 30, 0, Math.PI * 2);
      ctx.arc(200, 60, 25, 0, Math.PI * 2);
      ctx.arc(300, 90, 35, 0, Math.PI * 2);
      ctx.fill();

      // Draw plane
      const planeX = gameState.status === 'flying' ? 50 + (gameState.multiplier - 1) * 100 : 50;
      const planeY = gameState.status === 'flying' ? canvas.height - 100 - (gameState.multiplier - 1) * 50 : canvas.height - 100;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('✈️', planeX, planeY);

      // Draw trajectory line
      if (gameState.status === 'flying') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 100);
        ctx.lineTo(planeX, planeY);
        ctx.stroke();
      }

      // Draw smoke trail
      if (gameState.status === 'flying') {
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - i * 0.15})`;
          ctx.beginPath();
          ctx.arc(planeX - i * 8, planeY + 5, 3 - i * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [gameState]);

  const handlePlaceBet = () => {
    if (!user || gameState.status !== 'waiting') return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;

    setUserBet(amount);
    
    // Send bet to server via WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'placeBet',
        amount: amount,
        autoCashout: parseFloat(autoCashout)
      }));
    }
  };

  const handleCashOut = () => {
    if (!userBet || gameState.status !== 'flying') return;
    
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
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-4 py-2">
          <div className="text-2xl font-bold text-yellow-400">
            {gameState.multiplier.toFixed(2)}x
          </div>
          <div className="text-sm text-gray-300">
            {userBet ? `+$${currentGain.toFixed(2)}` : 'Place your bet!'}
          </div>
        </div>
        
        {/* Game Status */}
        <div className="absolute top-4 right-4 px-4 py-2 rounded-lg">
          <div className={`text-sm font-medium ${
            gameState.status === 'flying' ? 'bg-green-500/80 text-white' :
            gameState.status === 'crashed' ? 'bg-red-500/80 text-white' :
            'bg-yellow-500/80 text-black'
          }`}>
            {gameState.status === 'flying' ? 'FLYING' :
             gameState.status === 'crashed' ? 'CRASHED' :
             'WAITING'}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute bottom-4 left-4 bg-red-500/80 text-white px-3 py-1 rounded-lg text-sm">
            Disconnected
          </div>
        )}
      </div>
      
      {/* Game Controls */}
      <div className="space-y-6">
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
              disabled={!user || gameState.status !== 'waiting'}
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
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Recent Wins</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentWins.map((win, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{win.player}</span>
                <span className="text-green-400 font-medium">{win.amount}</span>
                <span className="text-yellow-400">{win.multiplier}</span>
              </div>
            ))}
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
