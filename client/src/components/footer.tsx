import { Crown, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="text-white" size={16} />
              </div>
              <h3 className="text-lg font-bold neon-text font-serif">ROYAL AVIATOR</h3>
            </div>
            <p className="text-gray-400 text-sm">
              The premier crypto casino experience with provably fair games and instant withdrawals.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Games</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#aviator" className="hover:text-yellow-400 transition-colors">Aviator</a></li>
              <li><a href="#games" className="hover:text-yellow-400 transition-colors">Slot Games</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Demo Mode</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Responsible Gaming</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Fair Gaming</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 Royal Aviator. All rights reserved. | Licensed & Regulated | 18+ Only</p>
        </div>
      </div>
    </footer>
  );
}
