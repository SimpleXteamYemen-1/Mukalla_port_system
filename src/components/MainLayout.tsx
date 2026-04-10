import { useState } from 'react';
import { Bell, LogOut, User as UserIcon, ChevronDown, Globe, Settings, Sun, Moon, Menu, Search } from 'lucide-react';
import { User, Language } from '../App';
import { Sidebar } from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { translations } from '../utils/translations';

interface MainLayoutProps {
  user: User;
  language: Language;
  onToggleLanguage: () => void;
  onLogout: () => void;
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function MainLayout({
  user,
  language,
  onToggleLanguage,
  onLogout,
  children,
  currentPage,
  onNavigate,
  theme,
  onToggleTheme
}: MainLayoutProps) {
  const t = translations[language]?.agent || translations.en.agent;
  const { isExpanded, toggleSidebar } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const mockNotifications = [
    { id: 1, type: 'approved', message: language === 'ar' ? 'تم الموافقة على طلب الوصول #AN-001' : 'Arrival Request #AN-001 Approved', time: '5m' },
    { id: 2, type: 'rejected', message: language === 'ar' ? 'تم رفض طلب الرسو #AR-003' : 'Anchorage Request #AR-003 Rejected', time: '1h' },
    { id: 3, type: 'pending', message: language === 'ar' ? 'في انتظار الموافقة التنفيذية' : 'Awaiting Executive Approval', time: '2h' },
  ];

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approved': return 'bg-green-500/10 border-green-500/20 text-green-500';
      case 'rejected': return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'pending': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default: return 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]';
    }
  };

  return (
    <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'} bg-[var(--background)] transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>


      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        language={language}
      />

      {/* Main Content Area */}
      <div className={`${language === 'ar' ? (isExpanded ? 'mr-64' : 'mr-20') : (isExpanded ? 'ml-64' : 'ml-20')} min-h-screen transition-all duration-300 ease-in-out`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--secondary)] shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1 flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center bg-[var(--background)] rounded-md px-3 py-1.5 mx-2 border border-[var(--secondary)] focus-within:border-[var(--primary)] transition-colors">
                <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                <input 
                  type="text" 
                  placeholder={language === 'ar' ? 'بحث...' : 'Search'} 
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] mx-2 w-48 placeholder-[var(--text-secondary)]" 
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Language Toggle */}
              <button
                onClick={onToggleLanguage}
                className="flex items-center gap-1 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">5</span>
                </button>
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden`}>
                    <div className="p-4 border-b border-[var(--secondary)]">
                      <h3 className="font-semibold text-[var(--text-primary)]">{t.notifications}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-[var(--secondary)] hover:bg-[var(--secondary)]/5 transition-colors">
                          <div className={`inline-block px-2 py-1 rounded-lg text-xs mb-2 ${getNotificationColor(notif.type)}`}>
                            {notif.type}
                          </div>
                          <p className="text-[var(--text-primary)] text-sm mb-1">{notif.message}</p>
                          <p className="text-[var(--text-secondary)] text-xs">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-[var(--secondary)] bg-[var(--secondary)]/5">
                      <button className="text-sm text-[var(--accent)] hover:text-[var(--primary)] font-medium">
                        {t.viewAll}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu Actions */}
              <div className="flex items-center gap-4">
                <span className="text-[var(--text-secondary)] hidden lg:block hover:text-[var(--text-primary)] cursor-pointer transition-colors" onClick={() => onNavigate('settings')}>Account</span>
                
                {/* Mobile avatar link to settings */}
                <button 
                  onClick={() => onNavigate('settings')}
                  className="w-8 h-8 lg:hidden bg-[var(--primary)]/10 rounded-lg flex items-center justify-center"
                >
                  <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                </button>

                <button 
                  onClick={onLogout} 
                  className="text-[var(--text-secondary)] hidden lg:block hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
