import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, LayoutDashboard, ListOrdered, Wallet, LogOut, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-slate-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-teal-500" />
            <span className="text-xl font-bold">TradingJournal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-slate-300 hover:text-teal-400 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/trades"
              className="flex items-center space-x-1 text-slate-300 hover:text-teal-400 transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
              <span>Trades</span>
            </Link>
            <Link
              to="/withdraw"
              className="flex items-center space-x-1 text-slate-300 hover:text-teal-400 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              <span>Withdraw</span>
            </Link>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center space-x-3">
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-teal-400">${typeof user.currentBalance === 'number'
                  ? user.currentBalance.toFixed(2)
                  : parseFloat(String(user.currentBalance)).toFixed(2)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-slate-300 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 py-2">
          <div className="container mx-auto px-4 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 text-teal-500" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/trades"
              className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <ListOrdered className="h-5 w-5 text-teal-500" />
              <span>Trades</span>
            </Link>
            <Link
              to="/withdraw"
              className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <Wallet className="h-5 w-5 text-teal-500" />
              <span>Withdraw</span>
            </Link>

            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="p-2">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-teal-400">${typeof user.currentBalance === 'number'
                  ? user.currentBalance.toFixed(2)
                  : parseFloat(String(user.currentBalance)).toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 p-2 w-full hover:bg-red-900/30 rounded-md text-red-400"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};