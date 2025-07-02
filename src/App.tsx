import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TradesPage } from './pages/TradesPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { CalendarPage } from './pages/CalendarPage';
import { BacktestPage } from './pages/BackTestPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

function App() {
  const { getUser } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    getUser();
  }, [getUser]);

  // Apply theme class to HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trades"
          element={
            <ProtectedRoute>
              <TradesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <WithdrawPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/backtest"
          element={
            <ProtectedRoute>
              <BacktestPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;