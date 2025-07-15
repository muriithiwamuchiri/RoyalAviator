import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Transaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingUp, TrendingDown, History, Plus, ArrowUp, Bitcoin, Coins, DollarSign } from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("BTC");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("BTC");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["/api/nowpayments/currencies"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; currency: string }) => {
      const res = await apiRequest("POST", "/api/nowpayments/payment", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Initiated",
        description: "Your deposit has been created. Please send the crypto to the provided address.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; currency: string; address: string }) => {
      const res = await apiRequest("POST", "/api/nowpayments/withdrawal", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal has been processed and will be sent to your wallet.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    depositMutation.mutate({ amount, currency: depositCurrency });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    withdrawMutation.mutate({ 
      amount, 
      currency: withdrawCurrency, 
      address: withdrawAddress 
    });
  };

  if (!user) return null;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Balance Overview */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">Real Balance</h3>
              <Wallet className="text-green-400 text-xl" />
            </div>
            <div className="text-3xl font-bold text-white">${user.realBalance}</div>
            <div className="text-sm text-gray-400 mt-2">Available for withdrawal</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-400">Demo Balance</h3>
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-sm font-bold">$</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">${user.demoBalance}</div>
            <div className="text-sm text-gray-400 mt-2">Non-withdrawable credits</div>
          </div>
        </div>
        
        {/* Transaction History */}
        <div className="bg-gray-800/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center space-x-2">
            <History size={20} />
            <span>Recent Transactions</span>
          </h3>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className="text-green-400 text-sm" />
                      ) : (
                        <TrendingDown className="text-red-400 text-sm" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{transaction.type}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                    </div>
                    {transaction.cryptoAmount && (
                      <div className="text-sm text-gray-400">
                        {transaction.cryptoAmount} {transaction.cryptoCurrency}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-6">
        {/* Deposit Form */}
        <div className="bg-gray-800/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center space-x-2">
            <Plus size={20} />
            <span>Deposit Crypto</span>
          </h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <Label htmlFor="depositAmount" className="text-gray-300">Amount (USD)</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                min="10"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="depositCurrency" className="text-gray-300">Currency</Label>
              <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Coins (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={depositMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              {depositMutation.isPending ? "Processing..." : "Create Deposit"}
            </Button>
          </form>
        </div>
        
        {/* Withdrawal Form */}
        <div className="bg-gray-800/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center space-x-2">
            <ArrowUp size={20} />
            <span>Withdraw</span>
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <Label htmlFor="withdrawAmount" className="text-gray-300">Amount (USD)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                step="0.01"
                min="20"
                max={user.realBalance}
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="withdrawCurrency" className="text-gray-300">Currency</Label>
              <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Coins (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="withdrawAddress" className="text-gray-300">Wallet Address</Label>
              <Input
                id="withdrawAddress"
                type="text"
                placeholder="Enter wallet address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
            >
              {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
            </Button>
          </form>
        </div>
        
        {/* Payment Methods */}
        <div className="bg-gray-800/30 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Payment Methods</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <Bitcoin className="text-orange-400 text-2xl mb-2" />
              <span className="text-xs text-gray-300">BTC</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Coins className="text-blue-400 text-2xl mb-2" />
              <span className="text-xs text-gray-300">ETH</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <DollarSign className="text-green-400 text-2xl mb-2" />
              <span className="text-xs text-gray-300">USDT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
