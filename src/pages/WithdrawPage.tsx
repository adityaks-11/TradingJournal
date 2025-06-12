import React from 'react';
import { Navbar } from '../components/Navbar';
import { WithdrawalForm } from '../components/WithdrawalForm';
import { WithdrawalHistory } from '../components/WithdrawalHistory';
import { TabInterface, Tab } from '../components/ui/TabInterface';

export const WithdrawPage: React.FC = () => {
  const tabs: Tab[] = [
    {
      id: 'withdrawal-form',
      label: 'Withdrawal Form',
      content: <WithdrawalForm />
    },
    {
      id: 'withdrawal-history',
      label: 'Withdrawal History',
      content: <WithdrawalHistory />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Withdrawals</h1>

        <TabInterface tabs={tabs} defaultTabId="withdrawal-form" />
      </main>
    </div>
  );
};