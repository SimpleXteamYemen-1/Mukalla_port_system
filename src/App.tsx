import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DashboardRouter } from './components/DashboardRouter';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { echo } from './utils/echo';

export type Language = 'ar' | 'en';
export type UserRole = 'agent' | 'executive' | 'officer' | 'trader' | 'wharf';

const queryClient = new QueryClient();

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard'>('login');
  const [language, setLanguage] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleRegister = (userData: User) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Global Echo listener
  useEffect(() => {
    echo.channel('port-operations')
      .listen('.vessel.arrived', (e: any) => {
        const msg = language === 'ar'
          ? `سفينة جديدة: ${e.vessel.name} وصلت.`
          : `New Vessel: ${e.vessel.name} arrived.`;
        toast.info(msg);
      });

    return () => {
      echo.leaveChannel('port-operations');
    };
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {currentPage === 'login' && (
          <LoginPage
            language={language}
            onToggleLanguage={toggleLanguage}
            onLogin={handleLogin}
            onNavigateToRegister={() => setCurrentPage('register')}
          />
        )}
        {currentPage === 'register' && (
          <RegisterPage
            language={language}
            onToggleLanguage={toggleLanguage}
            onRegister={handleRegister}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        )}
        {currentPage === 'dashboard' && user && (
          <DashboardRouter
            user={user}
            language={language}
            onLogout={handleLogout}
            onToggleLanguage={toggleLanguage}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
        <ToastContainer position="top-right" theme={theme} />
      </div>
    </QueryClientProvider>
  );
}

export default App;
