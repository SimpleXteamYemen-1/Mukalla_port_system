import { useState } from 'react';
import { Bell, LogOut, User as UserIcon, ChevronDown, Globe, Settings, Sun, Moon } from 'lucide-react';
import { User, Language } from '../App';
import { Sidebar } from './Sidebar';
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
      <div className={`${language === 'ar' ? 'mr-64' : 'ml-64'} min-h-screen transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 glass-panel border-b-0 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Page Title - will be set by each page */}
            <div className="flex-1"></div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Language Toggle */}
              <button
                onClick={onToggleLanguage}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{language === 'ar' ? 'EN' : 'ع'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
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

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all"
                >
                  <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                    <div className="text-[var(--text-primary)] text-sm font-medium">{user.name}</div>
                    <div className="text-[var(--text-secondary)] text-xs">{t.agentRole}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-64 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden`}>
                    <div className="p-4 border-b border-[var(--secondary)]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                          <div className="text-[var(--text-primary)] font-medium">{user.name}</div>
                          <div className="text-[var(--text-secondary)] text-xs">{user.email}</div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${user.verified
                        ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
                        <span className="text-xs">{user.verified ? t.verified : t.pendingVerification}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          onNavigate('settings');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--secondary)]/10 text-[var(--text-primary)] transition-colors ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span className="text-sm">{t.profile}</span>
                      </button>
                      <button 
                        onClick={() => {
                          onNavigate('settings');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--secondary)]/10 text-[var(--text-primary)] transition-colors ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">{t.settings}</span>
                      </button>
                      <div className="my-1 border-t border-[var(--secondary)]"></div>
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">{t.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
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
