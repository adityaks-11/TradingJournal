import React from 'react';
import { Navbar } from '../components/Navbar';
import { TradeForm } from '../components/TradeForm';
import { TradeHistory } from '../components/TradeHistory';
import { TabInterface, Tab } from '../components/ui/TabInterface';

export const TradesPage: React.FC = () => {
  const tabs: Tab[] = [
    {
      id: 'trade-entry',
      label: 'Trade Entry',
      content: <TradeForm />
    },
    {
      id: 'trade-history',
      label: 'Trade History',
      content: <TradeHistory />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Manage Trades</h1>

        <TabInterface tabs={tabs} defaultTabId="trade-entry" />
      </main>
    </div>
  );
};