import { useState } from "react";
import Navigation from "@/components/navigation";
import AviatorGame from "@/components/aviator-game";
import SlotGameCard from "@/components/slot-game-card";
import UserDashboard from "@/components/user-dashboard";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { Loader2, Star, Gift, Shield, Coins, Zap } from "lucide-react";

export default function HomePage() {
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [showUserDashboard, setShowUserDashboard] = useState(false);

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const slotGames = games?.filter(game => game.type === "slot") || [];
  const aviatorGame = games?.find(game => game.type === "aviator");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Navigation onShowDashboard={() => setShowUserDashboard(true)} />
      
      {/* Hero Section with Aviator Game */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 neon-text font-serif">
              ROYAL AVIATOR
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the thrill of crypto gaming with our provably fair Aviator crash game and premium slot collection
            </p>
          </div>
          
          <div className="casino-card rounded-2xl p-8 mb-16">
            <AviatorGame />
          </div>
        </div>
      </section>

      {/* Slot Games Section */}
      <section id="games" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 neon-text font-serif">PREMIUM SLOT GAMES</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience {slotGames.length} premium slot games with demo mode and crypto rewards
            </p>
          </div>
          
          {/* Game Filter */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-800/50 rounded-xl p-1 inline-flex">
              <button 
                onClick={() => setGameFilter("all")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  gameFilter === "all" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All Games
              </button>
              <button 
                onClick={() => setGameFilter("slots")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  gameFilter === "slots" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Slots
              </button>
              <button 
                onClick={() => setGameFilter("popular")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  gameFilter === "popular" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Popular
              </button>
            </div>
          </div>
          
          {/* Games Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="game-grid">
              {slotGames.map((game) => (
                <SlotGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 neon-text font-serif">WHY CHOOSE ROYAL AVIATOR</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the ultimate crypto gaming platform with provably fair games and instant withdrawals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="casino-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-black text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Provably Fair</h3>
              <p className="text-gray-400">All games use cryptographically secure algorithms ensuring complete transparency and fairness</p>
            </div>
            
            <div className="casino-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Crypto Payments</h3>
              <p className="text-gray-400">Instant deposits and withdrawals with Bitcoin, Ethereum, USDT, and other cryptocurrencies</p>
            </div>
            
            <div className="casino-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Withdrawals</h3>
              <p className="text-gray-400">Auto-withdrawal system processes your winnings in under 15 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Modal */}
      {showUserDashboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="casino-card rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold neon-text font-serif">PLAYER DASHBOARD</h2>
              <button
                onClick={() => setShowUserDashboard(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <UserDashboard />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
