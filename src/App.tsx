import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DashboardRouter } from './components/DashboardRouter';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { echo } from './utils/echo';
import api from './services/api';

export type Language = 'ar' | 'en';
export type UserRole = 'agent' | 'executive' | 'officer' | 'trader' | 'wharf';

const queryClient = new QueryClient();

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  phone?: string;
  avatar_url?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard'>('login');
  const [language, setLanguage] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }

    api.get('/me')
      .then((res) => {
        setUser(res.data);
        setCurrentPage('dashboard');
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  }, []);

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

  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${theme === 'dark' ? 'bg-gray-900 border-white' : 'bg-gray-100 border-black'}`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-b-4 ${theme === 'dark' ? 'border-white' : 'border-black'}`}></div>
      </div>
    );
  }

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
