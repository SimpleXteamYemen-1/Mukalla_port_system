import { LayoutDashboard, Ship, Bell, Anchor, FileText, Activity } from 'lucide-react';
import { Language } from '../App';
import { translations } from '../utils/translations';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: Language;
}

export function Sidebar({ currentPage, onNavigate, language }: SidebarProps) {
  const t = translations[language]?.agent || translations.en.agent;

  const menuItems = [
    { id: 'dashboard', label: t.menu.dashboard, icon: LayoutDashboard },
    { id: 'vessels', label: t.menu.myVessels, icon: Ship },
    { id: 'arrivals', label: t.menu.arrivalNotifications, icon: Bell },
    { id: 'anchorage', label: t.menu.anchorageRequests, icon: Anchor },
    { id: 'manifests', label: t.menu.cargoManifests, icon: FileText },
    { id: 'tracker', label: t.menu.requestStatusTracker, icon: Activity },
  ];

  return (
    <aside className={`fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 h-screen w-64 bg-[var(--bg-primary)] border-${language === 'ar' ? 'l' : 'r'} border-[var(--secondary)] z-50 transition-colors duration-300`}>
      {/* Logo */}
      <div className="p-6 border-b border-[var(--secondary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg flex items-center justify-center">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-primary)] font-bold text-lg">{t.systemName}</h2>
            <p className="text-[var(--text-secondary)] text-xs">{t.agentPortal}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--secondary)]/10 hover:text-[var(--text-primary)]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--secondary)]">
        <div className="bg-[var(--secondary)]/5 border border-[var(--secondary)]/20 rounded-md p-3">
          <p className="text-[var(--text-secondary)] text-xs text-center">
            {language === 'ar'
              ? 'نظام إدارة الموانئ البحرية'
              : 'Maritime Port Management'}
          </p>
          <p className="text-[var(--text-secondary)]/70 text-xs text-center mt-1">v2.0</p>
        </div>
      </div>
    </aside>
  );
}
