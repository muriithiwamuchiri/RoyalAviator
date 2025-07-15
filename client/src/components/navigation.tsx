import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Crown, Menu, X } from "lucide-react";
import { useLocation } from "wouter";

interface NavigationProps {
  onShowDashboard: () => void;
}

export default function Navigation({ onShowDashboard }: NavigationProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };

  return (
    <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-md z-50 border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Crown className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold neon-text font-serif">ROYAL AVIATOR</h1>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#games" className="hover:text-yellow-400 transition-colors">Games</a>
            <a href="#aviator" className="hover:text-yellow-400 transition-colors">Aviator</a>
            <a href="#promotions" className="hover:text-yellow-400 transition-colors">Promotions</a>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  onClick={onShowDashboard}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Dashboard
                </Button>
                {user.isAdmin && (
                  <Button
                    onClick={() => navigate("/admin")}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
                >
                  Sign Up
                </Button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-3">
              <a href="#games" className="hover:text-yellow-400 transition-colors">Games</a>
              <a href="#aviator" className="hover:text-yellow-400 transition-colors">Aviator</a>
              <a href="#promotions" className="hover:text-yellow-400 transition-colors">Promotions</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
