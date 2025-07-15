import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NowPaymentsConfig, Game, GameApi } from "@shared/schema";
import { Crown, Settings, Users, TrendingUp, DollarSign, Gamepad2, Plus, Edit, Trash2, Play, Star, Zap } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [configData, setConfigData] = useState({
    apiKey: "",
    ipnSecret: "",
    webhookUrl: ""
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [gameForm, setGameForm] = useState({
    name: "",
    type: "slot",
    rtp: "96.0",
    demoRtp: "98.0",
    volatility: "Medium",
    paylines: 20,
    features: "",
    imageUrl: "",
    description: "",
    minBet: "0.10",
    maxBet: "100.00"
  });

  const [gameApiForm, setGameApiForm] = useState({
    name: "",
    provider: "",
    apiUrl: "",
    apiKey: "",
    secretKey: "",
    supportedGameTypes: ""
  });

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-400">Access Denied</h1>
          <p className="text-gray-300">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  const { data: config } = useQuery<NowPaymentsConfig>({
    queryKey: ["/api/admin/config"],
  });

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/admin/games"],
  });

  const { data: gameApis } = useQuery<GameApi[]>({
    queryKey: ["/api/admin/game-apis"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof configData) => {
      const res = await apiRequest("POST", "/api/admin/config", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "NOWPayments configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/admin/test-connection");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Connection Successful" : "Connection Failed",
        description: data.connected 
          ? "NOWPayments API is working correctly" 
          : "Unable to connect to NOWPayments API",
        variant: data.connected ? "default" : "destructive",
      });
    }
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const res = await apiRequest("POST", "/api/admin/games", gameData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      setGameForm({
        name: "",
        type: "slot",
        rtp: "96.0",
        demoRtp: "98.0",
        volatility: "Medium",
        paylines: 20,
        features: "",
        imageUrl: "",
        description: "",
        minBet: "0.10",
        maxBet: "100.00"
      });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const createGameApiMutation = useMutation({
    mutationFn: async (apiData: any) => {
      const res = await apiRequest("POST", "/api/admin/game-apis", apiData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-apis"] });
      setGameApiForm({
        name: "",
        provider: "",
        apiUrl: "",
        apiKey: "",
        secretKey: "",
        supportedGameTypes: ""
      });
      toast({
        title: "Success",
        description: "Game API created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game API",
        variant: "destructive",
      });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/games/${gameId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete game",
        variant: "destructive",
      });
    },
  });

  const deleteGameApiMutation = useMutation({
    mutationFn: async (apiId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/game-apis/${apiId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-apis"] });
      toast({
        title: "Success",
        description: "Game API deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete game API",
        variant: "destructive",
      });
    },
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate(configData);
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    createGameMutation.mutate({
      ...gameForm,
      paylines: parseInt(gameForm.paylines.toString()),
      features: gameForm.features.split(',').map(f => f.trim())
    });
  };

  const handleCreateGameApi = (e: React.FormEvent) => {
    e.preventDefault();
    createGameApiMutation.mutate({
      ...gameApiForm,
      supportedGameTypes: gameApiForm.supportedGameTypes.split(',').map(t => t.trim())
    });
  };

  // Mock stats data - in real app, this would come from API
  const stats = {
    activeUsers: 2847,
    totalDeposits: 127543,
    totalWithdrawals: 89234,
    gamesPlayed: 15672
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="text-white text-xl" />
              </div>
              <h1 className="text-xl font-bold neon-text font-serif">ROYAL AVIATOR ADMIN</h1>
            </div>
            <div className="text-sm text-gray-300">
              Welcome, {user.username}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 neon-text font-serif">ADMIN DASHBOARD</h2>
          <p className="text-xl text-gray-300">
            Manage your casino operations and configure payment systems
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 bg-gray-800/50 rounded-lg p-2 border border-purple-500/30">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "games"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Games
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "apis"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Game APIs
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "payments"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Payments
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-8">
          {/* System Overview */}
          <div className="casino-card rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="text-purple-400 text-2xl" />
              <h3 className="text-xl font-bold text-purple-400">System Overview</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                <div className="text-2xl font-bold text-white">${stats.totalDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Deposits</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
                <div className="text-2xl font-bold text-white">${stats.totalWithdrawals.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Withdrawals</div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                <div className="text-2xl font-bold text-white">{stats.gamesPlayed.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Games Played</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="casino-card rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Zap className="text-yellow-400 text-2xl" />
              <h3 className="text-xl font-bold text-yellow-400">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setActiveTab("games")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Gamepad2 className="mr-2" size={18} />
                Manage Games
              </Button>
              <Button 
                onClick={() => setActiveTab("apis")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="mr-2" size={18} />
                Configure APIs
              </Button>
              <Button 
                onClick={() => setActiveTab("payments")}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <DollarSign className="mr-2" size={18} />
                Payment Settings
              </Button>
            </div>
          </div>
        </div>

        )}

        {activeTab === "games" && (
          <div className="space-y-8">
            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Plus className="text-green-400 text-2xl" />
                <h3 className="text-xl font-bold text-green-400">Create New Game</h3>
              </div>
              
              <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gameName" className="text-gray-300">Game Name</Label>
                  <Input
                    id="gameName"
                    value={gameForm.name}
                    onChange={(e) => setGameForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Enter game name"
                  />
                </div>
                <div>
                  <Label htmlFor="gameType" className="text-gray-300">Game Type</Label>
                  <select
                    id="gameType"
                    value={gameForm.type}
                    onChange={(e) => setGameForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="slot">Slot</option>
                    <option value="aviator">Aviator</option>
                    <option value="table">Table Game</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="gameRtp" className="text-gray-300">RTP (%)</Label>
                  <Input
                    id="gameRtp"
                    value={gameForm.rtp}
                    onChange={(e) => setGameForm(prev => ({ ...prev, rtp: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="96.0"
                  />
                </div>
                <div>
                  <Label htmlFor="gameDemoRtp" className="text-gray-300">Demo RTP (%)</Label>
                  <Input
                    id="gameDemoRtp"
                    value={gameForm.demoRtp}
                    onChange={(e) => setGameForm(prev => ({ ...prev, demoRtp: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="98.0"
                  />
                </div>
                <div>
                  <Label htmlFor="gameVolatility" className="text-gray-300">Volatility</Label>
                  <select
                    id="gameVolatility"
                    value={gameForm.volatility}
                    onChange={(e) => setGameForm(prev => ({ ...prev, volatility: e.target.value }))}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="gamePaylines" className="text-gray-300">Paylines</Label>
                  <Input
                    id="gamePaylines"
                    type="number"
                    value={gameForm.paylines}
                    onChange={(e) => setGameForm(prev => ({ ...prev, paylines: parseInt(e.target.value) }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="gameMinBet" className="text-gray-300">Min Bet</Label>
                  <Input
                    id="gameMinBet"
                    value={gameForm.minBet}
                    onChange={(e) => setGameForm(prev => ({ ...prev, minBet: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="0.10"
                  />
                </div>
                <div>
                  <Label htmlFor="gameMaxBet" className="text-gray-300">Max Bet</Label>
                  <Input
                    id="gameMaxBet"
                    value={gameForm.maxBet}
                    onChange={(e) => setGameForm(prev => ({ ...prev, maxBet: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="100.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="gameFeatures" className="text-gray-300">Features (comma-separated)</Label>
                  <Input
                    id="gameFeatures"
                    value={gameForm.features}
                    onChange={(e) => setGameForm(prev => ({ ...prev, features: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Wilds, Free Spins, Multipliers"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="gameImageUrl" className="text-gray-300">Image URL</Label>
                  <Input
                    id="gameImageUrl"
                    value={gameForm.imageUrl}
                    onChange={(e) => setGameForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="gameDescription" className="text-gray-300">Description</Label>
                  <Input
                    id="gameDescription"
                    value={gameForm.description}
                    onChange={(e) => setGameForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Game description"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={createGameMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createGameMutation.isPending ? "Creating..." : "Create Game"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Gamepad2 className="text-purple-400 text-2xl" />
                <h3 className="text-xl font-bold text-purple-400">Current Games</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games?.map((game) => (
                  <div key={game.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{game.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGameMutation.mutate(game.id)}
                        disabled={deleteGameMutation.isPending}
                        className="text-red-400 border-red-400 hover:bg-red-400/20"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Type: {game.type}</div>
                      <div>RTP: {game.rtp}%</div>
                      <div>Volatility: {game.volatility}</div>
                      <div>Paylines: {game.paylines}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "apis" && (
          <div className="space-y-8">
            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Plus className="text-green-400 text-2xl" />
                <h3 className="text-xl font-bold text-green-400">Add Game API</h3>
              </div>
              
              <form onSubmit={handleCreateGameApi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiName" className="text-gray-300">API Name</Label>
                  <Input
                    id="apiName"
                    value={gameApiForm.name}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Enter API name"
                  />
                </div>
                <div>
                  <Label htmlFor="apiProvider" className="text-gray-300">Provider</Label>
                  <Input
                    id="apiProvider"
                    value={gameApiForm.provider}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, provider: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Provider name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="apiUrl" className="text-gray-300">API URL</Label>
                  <Input
                    id="apiUrl"
                    value={gameApiForm.apiUrl}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="https://api.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={gameApiForm.apiKey}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <Label htmlFor="apiSecretKey" className="text-gray-300">Secret Key</Label>
                  <Input
                    id="apiSecretKey"
                    type="password"
                    value={gameApiForm.secretKey}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, secretKey: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Enter secret key"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="apiGameTypes" className="text-gray-300">Supported Game Types (comma-separated)</Label>
                  <Input
                    id="apiGameTypes"
                    value={gameApiForm.supportedGameTypes}
                    onChange={(e) => setGameApiForm(prev => ({ ...prev, supportedGameTypes: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="slot, aviator, table"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={createGameApiMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createGameApiMutation.isPending ? "Adding..." : "Add API"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="text-blue-400 text-2xl" />
                <h3 className="text-xl font-bold text-blue-400">Game APIs</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameApis?.map((api) => (
                  <div key={api.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{api.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGameApiMutation.mutate(api.id)}
                        disabled={deleteGameApiMutation.isPending}
                        className="text-red-400 border-red-400 hover:bg-red-400/20"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Provider: {api.provider}</div>
                      <div>URL: {api.apiUrl}</div>
                      <div>Game Types: {api.supportedGameTypes?.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-8">
            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="text-yellow-400 text-2xl" />
                <h3 className="text-xl font-bold text-yellow-400">NOWPayments Configuration</h3>
              </div>
              
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter NOWPayments API Key"
                    value={configData.apiKey}
                    onChange={(e) => setConfigData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label htmlFor="ipnSecret" className="text-gray-300">IPN Secret</Label>
                  <Input
                    id="ipnSecret"
                    type="password"
                    placeholder="Enter IPN Secret"
                    value={configData.ipnSecret}
                    onChange={(e) => setConfigData(prev => ({ ...prev, ipnSecret: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label htmlFor="webhookUrl" className="text-gray-300">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-domain.com/webhook"
                    value={configData.webhookUrl}
                    onChange={(e) => setConfigData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => testConnectionMutation.mutate()}
                    disabled={testConnectionMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveConfigMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saveConfigMutation.isPending ? "Saving..." : "Save Config"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="casino-card rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="text-green-400 text-2xl" />
                <h3 className="text-xl font-bold text-green-400">Payment System Status</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">NOWPayments Status</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    {config ? "Connected" : "Not Configured"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Webhook Status</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    {config?.webhookUrl ? "Active" : "Not Set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Auto-Withdrawal</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
