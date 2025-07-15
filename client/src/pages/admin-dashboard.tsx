import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NowPaymentsConfig } from "@shared/schema";
import { Crown, Settings, Users, TrendingUp, DollarSign, Gamepad2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [configData, setConfigData] = useState({
    apiKey: "",
    ipnSecret: "",
    webhookUrl: ""
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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate(configData);
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

          {/* NOWPayments Configuration */}
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
        </div>

        {/* Payment Status */}
        <div className="mt-8 casino-card rounded-xl p-6">
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
    </div>
  );
}
