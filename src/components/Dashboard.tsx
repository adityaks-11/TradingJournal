import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { trades, fetchTrades } = useTradeStore();
  const { withdrawals, fetchWithdrawals } = useWithdrawalStore();
  const [balanceHistory, setBalanceHistory] = useState<Array<{ date: string; balance: number }>>([]);
  
  useEffect(() => {
    fetchTrades();
    fetchWithdrawals();
  }, [fetchTrades, fetchWithdrawals]);
  
  useEffect(() => {
    if (user && trades.length > 0) {
      // Sort trades by date
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Create balance history
      const history = sortedTrades.map(trade => ({
        date: format(parseISO(trade.date), 'MMM dd'),
        balance: trade.balanceAfterTrade
      }));
      
      // Add starting point
      if (user.startingBalance) {
        history.unshift({
          date: 'Start',
          balance: user.startingBalance
        });
      }
      
      setBalanceHistory(history);
    }
  }, [user, trades]);
  
  // Calculate statistics
  const totalTrades = trades.length;
  const winTrades = trades.filter(t => t.outcome === 'win').length;
  const lossTrades = trades.filter(t => t.outcome === 'loss').length;
  const beTrades = trades.filter(t => t.outcome === 'BE').length;
  
  const winRate = totalTrades > 0 ? Math.round((winTrades / totalTrades) * 100) : 0;
  
  const totalProfit = trades.reduce((sum, trade) => sum + trade.result, 0);
  
  const outcomeData = [
    { name: 'Win', value: winTrades },
    { name: 'Loss', value: lossTrades },
    { name: 'Break Even', value: beTrades }
  ].filter(item => item.value > 0);
  
  const COLORS = ['#22C55E', '#EF4444', '#EAB308'];
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Current Balance</h3>
          <p className="text-2xl font-bold text-teal-400">${user.currentBalance.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Started with ${user.startingBalance.toFixed(2)}
          </p>
        </div>
        
        {/* Total Profit/Loss */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Total P&L</h3>
          <p className={`text-2xl font-bold ${
            totalProfit > 0 
              ? 'text-green-400' 
              : totalProfit < 0 
                ? 'text-red-400' 
                : 'text-slate-200'
          }`}>
            {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Across {totalTrades} trades
          </p>
        </div>
        
        {/* Win Rate */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Win Rate</h3>
          <p className="text-2xl font-bold text-slate-200">{winRate}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {winTrades} wins, {lossTrades} losses, {beTrades} BE
          </p>
        </div>
        
        {/* Average Trade */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Avg. Trade Result</h3>
          <p className={`text-2xl font-bold ${
            totalTrades > 0 && totalProfit / totalTrades > 0 
              ? 'text-green-400' 
              : totalTrades > 0 && totalProfit / totalTrades < 0 
                ? 'text-red-400' 
                : 'text-slate-200'
          }`}>
            {totalTrades > 0 
              ? (totalProfit / totalTrades > 0 ? '+' : '') + (totalProfit / totalTrades).toFixed(2)
              : '$0.00'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Per completed trade
          </p>
        </div>
      </div>
      
      {/* Balance Chart */}
      <div className="bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Balance History</h3>
        
        {balanceHistory.length > 1 ? (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155',
                    color: '#f8fafc' 
                  }}
                  formatter={(value) => [`$${value}`, 'Balance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ stroke: '#14b8a6', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                  activeDot={{ stroke: '#14b8a6', strokeWidth: 2, r: 6, fill: '#0f172a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center">
            <p className="text-slate-400">Not enough data to display chart</p>
          </div>
        )}
      </div>
      
      {/* Trade Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Trade Outcomes</h3>
          
          {outcomeData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155',
                      color: '#f8fafc' 
                    }}
                    formatter={(value) => [value, 'Trades']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-slate-400">No trade data available</p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          
          <div className="space-y-4">
            {[...trades, ...withdrawals]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((item) => {
                const isTrade = 'direction' in item;
                
                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {isTrade 
                          ? `${(item as any).pair} ${(item as any).direction} trade`
                          : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-slate-400">{format(parseISO(item.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className={`text-right ${
                      isTrade 
                        ? (item as any).result > 0 
                          ? 'text-green-400' 
                          : (item as any).result < 0 
                            ? 'text-red-400' 
                            : 'text-slate-300'
                        : 'text-red-400'
                    }`}>
                      <p className="text-sm font-medium">
                        {isTrade 
                          ? ((item as any).result > 0 ? '+' : '') + (item as any).result.toFixed(2)
                          : '-' + (item as any).amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            
            {trades.length === 0 && withdrawals.length === 0 && (
              <p className="text-center text-slate-400 py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};