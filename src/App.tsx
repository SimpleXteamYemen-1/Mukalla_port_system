import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DashboardRouter } from './components/DashboardRouter';

export type Language = 'ar' | 'en';
export type UserRole = 'agent' | 'executive' | 'officer' | 'trader' | 'wharf';

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
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
    </div>
  );
}

export default App;
