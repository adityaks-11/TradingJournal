import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AuthFormProps {
  isLogin?: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  startingBalance: number;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true }) => {
  const { login, signup, isLoading, error, signupSuccess, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>();

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to dashboard');
      // Get the intended destination or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      if (isLogin) {
        await login(data.email, data.password);
        // Note: Redirection is handled by the useEffect above
      } else {
        await signup(data.email, data.password, data.startingBalance);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg transition-colors">
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
        {isLogin ? 'Sign In to Your Journal' : 'Create a Trading Journal'}
      </h2>

      {signupSuccess && !isLogin && (
        <div className="p-4 mb-6 bg-teal-900/50 border border-teal-700 rounded-md">
          <p className="text-sm text-teal-200">
            Account created successfully! Please check your email to confirm your account before signing in.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="startingBalance" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Starting Balance ($)
            </label>
            <input
              id="startingBalance"
              type="number"
              step="0.01"
              placeholder="1000.00"
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
              {...register('startingBalance', {
                required: 'Starting balance is required',
                min: {
                  value: 1,
                  message: 'Starting balance must be at least $1'
                }
              })}
            />
            {errors.startingBalance && (
              <p className="mt-1 text-sm text-red-400">{errors.startingBalance.message}</p>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-sm text-red-200">
              {error === 'Email not confirmed'
                ? 'Please check your email and confirm your account before signing in.'
                : error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Processing...'
            : isLogin
              ? 'Sign In'
              : 'Create Account'
          }
        </button>
      </form>
    </div>
  );
};