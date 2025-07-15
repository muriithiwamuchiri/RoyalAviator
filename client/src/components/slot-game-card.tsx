import { useState } from "react";
import { Game } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Star, Play, Gift } from "lucide-react";
import SlotGameModal from "./slot-game-modal";

interface SlotGameCardProps {
  game: Game;
}

export default function SlotGameCard({ game }: SlotGameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlayGame = () => {
    setIsModalOpen(true);
  };

  return (
    <div
      className="casino-card rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Game Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={game.imageUrl}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* RTP Badge */}
        <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
          {game.rtp}% RTP
        </div>
        
        {/* Demo Badge */}
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
          <Gift size={12} />
          <span>DEMO</span>
        </div>
        
        {/* Play Button Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button
              onClick={handlePlayGame}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-bold text-lg flex items-center space-x-2"
            >
              <Play size={20} />
              <span>Play Now</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Game Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{game.name}</h3>
        <p className="text-gray-400 mb-4">
          {game.paylines ? `${game.paylines} paylines` : 'Crash Game'} • {game.volatility} volatility
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="text-yellow-400" size={16} />
            <span className="text-sm text-gray-300">
              {(Math.random() * 0.5 + 4.5).toFixed(1)}/5
            </span>
          </div>
          <Button
            onClick={handlePlayGame}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg font-medium"
          >
            Play Now
          </Button>
        </div>
        
        {/* Game Features */}
        {game.features && game.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {game.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Game Modal */}
      <SlotGameModal 
        game={game} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
