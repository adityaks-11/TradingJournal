import React from 'react';
import { Navbar } from '../components/Navbar';
import { TradeForm } from '../components/TradeForm';
import { TradeHistory } from '../components/TradeHistory';

export const TradesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Trades</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TradeForm />
          </div>
          
          <div className="lg:col-span-2">
            <TradeHistory />
          </div>
        </div>
      </main>
    </div>
  );
};