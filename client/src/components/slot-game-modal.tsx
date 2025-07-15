import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Game } from "@shared/schema";
import { Coins, Play, Star, Gift, DollarSign, Crown, Zap } from "lucide-react";

interface SlotGameModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '👑'];

export default function SlotGameModal({ game, isOpen, onClose }: SlotGameModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [betAmount, setBetAmount] = useState("1");
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0, 0, 0]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const playGameMutation = useMutation({
    mutationFn: async (data: { gameId: number; betAmount: number; isDemo: boolean }) => {
      const res = await apiRequest("POST", "/api/games/play", data);
      return res.json();
    },
    onSuccess: (result) => {
      // Update user balance
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Show win result
      if (result.win > 0) {
        setLastWin(result.win);
        setTotalWinnings(prev => prev + result.win);
        toast({
          title: "🎉 You Won!",
          description: `You won $${result.win.toFixed(2)}!`,
          duration: 3000,
        });
      }
      
      setGamesPlayed(prev => prev + 1);
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const handleSpin = async () => {
    if (!game) return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Check balance for authenticated users only
    if (user) {
      const hasRealBalance = parseFloat(user.realBalance || "0") > 0;
      const demoBalance = parseFloat(user.demoBalance || "0");
      const realBalance = parseFloat(user.realBalance || "0");
      
      if (!hasRealBalance) {
        if (amount > demoBalance) {
          toast({
            title: "Insufficient demo balance",
            description: "You don't have enough demo balance to play",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (amount > realBalance) {
          toast({
            title: "Insufficient real balance",
            description: "You don't have enough real balance to play",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSpinning(true);
    setLastWin(null);
    
    // Animate reels
    const animationDuration = 2000;
    const animationInterval = 100;
    let elapsed = 0;
    
    const animate = () => {
      if (elapsed < animationDuration) {
        setReels(prev => prev.map(() => Math.floor(Math.random() * SLOT_SYMBOLS.length)));
        elapsed += animationInterval;
        setTimeout(animate, animationInterval);
      } else {
        // Final spin result
        const finalReels = Array.from({ length: 5 }, () => Math.floor(Math.random() * SLOT_SYMBOLS.length));
        setReels(finalReels);
        
        // For guest users, simulate the game locally
        if (!user) {
          // Guest mode - simulate game outcome
          const random = Math.random();
          let win = 0;
          
          if (random < 0.1) { // 10% chance for big win
            win = amount * (5 + Math.random() * 10);
          } else if (random < 0.3) { // 20% chance for medium win
            win = amount * (1.5 + Math.random() * 2);
          } else if (random < 0.45) { // 15% chance for small win
            win = amount * (1 + Math.random() * 0.5);
          }
          
          if (win > 0) {
            setLastWin(win);
            setTotalWinnings(prev => prev + win);
            toast({
              title: "🎉 You Won!",
              description: `You won $${win.toFixed(2)} in demo mode!`,
              duration: 3000,
            });
          }
          
          setGamesPlayed(prev => prev + 1);
          setIsSpinning(false);
        } else {
          // Authenticated user - play the game via API
          playGameMutation.mutate({
            gameId: game.id,
            betAmount: amount,
            isDemo: !parseFloat(user.realBalance || "0")
          });
          
          setIsSpinning(false);
        }
      }
    };
    
    animate();
  };

  if (!game) return null;

  const hasRealBalance = user ? parseFloat(user.realBalance || "0") > 0 : false;
  const currentBalance = user ? (hasRealBalance ? user.realBalance : user.demoBalance) : "∞";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-purple-900 to-purple-800 border-purple-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center space-x-2">
            <Crown className="text-yellow-400" />
            <span>{game.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="text-green-400" size={16} />
                <span className="text-sm font-medium">Playing Mode</span>
              </div>
              <div className="text-lg font-bold text-yellow-400">
                {!user ? "Guest Demo" : (hasRealBalance ? "Real Money" : "Demo Account")}
              </div>
              <div className="text-sm text-gray-400">
                Balance: {!user ? "∞" : `$${currentBalance}`}
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="text-yellow-400" size={16} />
                <span className="text-sm font-medium">Game Stats</span>
              </div>
              <div className="text-lg font-bold text-green-400">
                {game.rtp}% RTP
              </div>
              <div className="text-sm text-gray-400">
                {game.volatility} volatility
              </div>
            </div>
          </div>

          {/* Slot Machine */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-xl">
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <div className="flex justify-center space-x-2">
                {reels.map((reel, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl font-bold ${
                      isSpinning ? 'animate-spin' : ''
                    }`}
                  >
                    {SLOT_SYMBOLS[reel]}
                  </div>
                ))}
              </div>
            </div>

            {/* Win Display */}
            {lastWin && (
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-yellow-400 animate-pulse">
                  🎉 WIN: ${lastWin.toFixed(2)} 🎉
                </div>
              </div>
            )}

            {/* Bet Controls */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-white mb-2">Bet Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="bg-gray-700 border-gray-600 text-white pr-12"
                    disabled={isSpinning}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">USD</span>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || playGameMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-bold"
                >
                  {isSpinning ? (
                    <>
                      <Zap className="mr-2 animate-spin" size={20} />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" size={20} />
                      SPIN
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-300">Games Played</div>
                <div className="text-lg font-bold text-white">{gamesPlayed}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-300">Total Winnings</div>
                <div className="text-lg font-bold text-green-400">${totalWinnings.toFixed(2)}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-300">Win Rate</div>
                <div className="text-lg font-bold text-yellow-400">
                  {gamesPlayed > 0 ? Math.round((totalWinnings / (gamesPlayed * parseFloat(betAmount))) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Game Features */}
          {game.features && game.features.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-purple-400">Game Features</h4>
              <div className="flex flex-wrap gap-2">
                {game.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}