import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, LayoutDashboard, ListOrdered, Wallet, LogOut, Menu, X, Calendar } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { ConfirmDialog } from './ui/ConfirmDialog';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-500" />
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">OG Trader's Journal</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/trades"
              className="flex items-center space-x-1 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
              <span>Trades</span>
            </Link>
            <Link
              to="/withdraw"
              className="flex items-center space-x-1 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              <span>Withdraw</span>
            </Link>
            <Link
              to="/calendar"
              className="flex items-center gap-2 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span className="align-middle">Calendar</span>
            </Link>

            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center space-x-3 relative">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400">${typeof user.currentBalance === 'number'
                  ? user.currentBalance.toFixed(2)
                  : parseFloat(String(user.currentBalance)).toFixed(2)}</p>
              </div>
              {/* Logout Button (top right) */}
              <div className="relative group ml-4">
                <button
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="flex items-center justify-center rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                  aria-label="Logout"
                >
                  <LogOut className="h-6 w-6" />
                  <span className="absolute left-full ml-2 px-2 py-1 rounded bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-slate-200 dark:border-slate-700">
                    Logout
                  </span>
                </button>
                <ConfirmDialog
                  isOpen={isLogoutDialogOpen}
                  onClose={() => setIsLogoutDialogOpen(false)}
                  onConfirm={handleLogout}
                  title="Logout"
                  message="Are you sure you want to logout?"
                  confirmText="Logout"
                  cancelText="Cancel"
                />
              </div>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-700 dark:text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-2 transition-colors">
          <div className="container mx-auto px-4 space-y-2">
            <div className="flex items-center justify-between p-2">
              <ThemeToggle />
              <p className="text-sm text-slate-500 dark:text-slate-400">Toggle theme</p>
            </div>

            <Link
              to="/dashboard"
              className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300"
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/trades"
              className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300"
              onClick={() => setIsMenuOpen(false)}
            >
              <ListOrdered className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              <span>Trades</span>
            </Link>
            <Link
              to="/withdraw"
              className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300"
              onClick={() => setIsMenuOpen(false)}
            >
              <Wallet className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              <span>Withdraw</span>
            </Link>
            <Link
              to="/calendar"
              className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              <span>Calendar</span>
            </Link>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
              <div className="p-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400">${typeof user.currentBalance === 'number'
                  ? user.currentBalance.toFixed(2)
                  : parseFloat(String(user.currentBalance)).toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 p-2 w-full hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-red-600 dark:text-red-400"
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