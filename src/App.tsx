import { useState } from 'react';
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

  return (
    <div className={language === 'ar' ? 'rtl' : 'ltr'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
        />
      )}
    </div>
  );
}

export default App;
