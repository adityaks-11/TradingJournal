import React from 'react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Trading Dashboard</h1>
        
        <Dashboard />
      </main>
    </div>
  );
};