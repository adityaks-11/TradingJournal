import React from 'react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Dashboard />
      </main>
    </div>
  );
};