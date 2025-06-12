import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex items-center space-x-2 mb-8">
        <TrendingUp className="h-10 w-10 text-teal-600 dark:text-teal-500" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">TradingJournal</h1>
      </div>

      <AuthForm isLogin={isLogin} />

      <div className="mt-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};