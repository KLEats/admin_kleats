import React, { useState, useEffect } from 'react';
import { loginRequest, storeToken, clearToken, getToken } from './api/auth.js';

// Page Imports
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
// ReportsPage removed; export functionality moved to OrdersPage

// --- Main App Component ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async ({ CanteenId, Password }) => {
    setAuthLoading(true);
    setError('');
    try {
      const data = await loginRequest({ CanteenId, Password });
      storeToken(data.token);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
  clearToken();
  setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
      case 'menu':
        return <MenuPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
      case 'orders':
        return <OrdersPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
      case 'reports':
        // Show orders page for reports navigation (export available from Orders)
        return <OrdersPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
      default:
        return <DashboardPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
    }
  };

  return (
    <>
      {isLoggedIn ? (
        renderPage()
      ) : (
  <LoginPage onLogin={handleLogin} error={error} loading={authLoading} />
      )}
    </>
  );
}
