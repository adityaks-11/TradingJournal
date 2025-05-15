import React from 'react';
import { Navbar } from '../components/Navbar';
import { WithdrawalForm } from '../components/WithdrawalForm';
import { WithdrawalHistory } from '../components/WithdrawalHistory';

export const WithdrawPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Withdrawals</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WithdrawalForm />
          </div>
          
          <div className="lg:col-span-2">
            <WithdrawalHistory />
          </div>
        </div>
      </main>
    </div>
  );
};