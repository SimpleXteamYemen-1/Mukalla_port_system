import { useState } from 'react';
import { Bell, LogOut, User as UserIcon, ChevronDown, Globe } from 'lucide-react';
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
}

export function MainLayout({ 
  user, 
  language, 
  onToggleLanguage, 
  onLogout, 
  children, 
  currentPage, 
  onNavigate 
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
      case 'approved': return 'bg-green-500/20 border-green-400/30 text-green-200';
      case 'rejected': return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'pending': return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      default: return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
    }
  };

  return (
    <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={onNavigate} 
        language={language}
      />

      {/* Main Content Area */}
      <div className={`${language === 'ar' ? 'mr-64' : 'ml-64'} min-h-screen`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Page Title - will be set by each page */}
            <div className="flex-1"></div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={onToggleLanguage}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{language === 'ar' ? 'EN' : 'ع'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 bg-[#0A1628]/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden`}>
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">{t.notifications}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                          <div className={`inline-block px-2 py-1 rounded-lg text-xs mb-2 ${getNotificationColor(notif.type)}`}>
                            {notif.type}
                          </div>
                          <p className="text-white text-sm mb-1">{notif.message}</p>
                          <p className="text-blue-300 text-xs">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                    <div className="text-white text-sm font-medium">{user.name}</div>
                    <div className="text-blue-300 text-xs">{t.agentRole}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-64 bg-[#0A1628]/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden`}>
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-blue-300 text-xs">{user.email}</div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${
                        user.verified 
                          ? 'bg-green-500/20 border border-green-400/30 text-green-200' 
                          : 'bg-amber-500/20 border border-amber-400/30 text-amber-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
                        <span className="text-xs">{user.verified ? t.verified : t.pendingVerification}</span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-300 hover:text-red-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{t.logout}</span>
                    </button>
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
