import React, { useState, useEffect } from 'react';
import { loginRequest, storeToken, clearToken, getToken, isTokenExpired } from './api/auth.js';

// Page Imports
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';


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
        return <ReportsPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
      default:
        return <DashboardPage onLogout={handleLogout} navigateTo={navigateTo} currentPage={currentPage} />;
    }
  };

  // Periodically check token validity and redirect to login if expired or removed.
  useEffect(() => {
    const checkToken = () => {
      try {
        const t = getToken();
        if (!t) {
          // no token -> ensure logged out
          handleLogout();
          return;
        }
        const expired = isTokenExpired(t);
        if (expired === true) {
          handleLogout();
        }
      } catch (e) {
        // swallow errors; conservative approach: logout
        handleLogout();
      }
    };

    checkToken();
    const id = setInterval(checkToken, 5000); // check every 5s

    const onStorage = (e) => {
      if (e.key === 'authToken' && !e.newValue) handleLogout();
    };
    window.addEventListener('storage', onStorage);

    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); };
  }, []);

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
