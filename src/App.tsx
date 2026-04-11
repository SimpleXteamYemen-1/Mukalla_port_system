import { useState, useEffect, useCallback } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DashboardRouter } from './components/DashboardRouter';
import { SidebarProvider } from './contexts/SidebarContext';
import { LoadingIndicator } from './components/application/loading-indicator/loading-indicator';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { echo } from './utils/echo';
import api from './services/api';
import { useIdleTimer } from './hooks/useIdleTimer';

export type Language = 'ar' | 'en';
export type UserRole = 'agent' | 'executive' | 'officer' | 'trader' | 'wharf';

const queryClient = new QueryClient();

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  status?: 'pending' | 'active' | 'rejected';
  rejection_reason?: string;
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

  const handleLogout = useCallback(() => {
    api.post('/logout').catch(console.error);
    setUser(null);
    localStorage.removeItem('token');
    sessionStorage.clear(); // Clears any saved drafts/persistence
    setCurrentPage('login');
  }, []);

  // Deploy Idle Timer (300,000 ms = 5 minutes) that only monitors when user is logged in
  useIdleTimer(handleLogout, 300000, !!user);

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
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingIndicator type="line-spinner" size="lg" />
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
          <SidebarProvider>
            <DashboardRouter
              user={user}
              language={language}
              onLogout={handleLogout}
              onToggleLanguage={toggleLanguage}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </SidebarProvider>
        )}
        <ToastContainer position="top-right" theme={theme} />
      </div>
    </QueryClientProvider>
  );
}

export default App;
