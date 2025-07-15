import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Crown, Shield, Coins, Zap } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    email: "", 
    phone: "", 
    password: "" 
  });
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({
        username: loginData.phone, // Using phone as username
        password: loginData.password
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid phone number or password",
        variant: "destructive"
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync(registerData);
      navigate("/");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please check your information and try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Crown className="text-white text-2xl" />
                </div>
                <h1 className="text-2xl font-bold neon-text font-serif">ROYAL AVIATOR</h1>
              </div>
              <p className="text-gray-300">
                {isLogin ? "Welcome back to the royal casino" : "Join the royal gaming experience"}
              </p>
            </div>

            {/* Form Toggle */}
            <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  isLogin ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  !isLogin ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={loginData.phone}
                    onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-lg font-bold transition-all"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-phone" className="text-gray-300">Phone Number</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-gray-300">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-lg font-bold transition-all"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}

            {/* Demo Mode Banner */}
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
                <span className="text-green-400 font-bold">Free Demo Mode</span>
              </div>
              <p className="text-sm text-gray-300">
                Get $20 in demo credits to try all games risk-free. No deposit required!
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Hero */}
        <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-black flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-4xl font-bold mb-6 neon-text font-serif">
              The Ultimate Crypto Casino Experience
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Play provably fair games, win real crypto, and enjoy instant withdrawals
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Shield className="text-yellow-400 text-sm" />
                </div>
                <span className="text-gray-300">Provably Fair Gaming</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Coins className="text-purple-400 text-sm" />
                </div>
                <span className="text-gray-300">Crypto Deposits & Withdrawals</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Zap className="text-green-400 text-sm" />
                </div>
                <span className="text-gray-300">Instant Auto-Withdrawals</span>
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-purple-500/20 rounded-full animate-float"></div>
          <div className="absolute bottom-20 right-20 w-12 h-12 bg-yellow-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 right-40 w-8 h-8 bg-green-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  );
}
