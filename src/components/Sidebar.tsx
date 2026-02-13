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
    <aside className={`fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 h-screen w-64 bg-white/5 backdrop-blur-xl border-${language === 'ar' ? 'l' : 'r'} border-white/20 z-50`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Anchor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{t.systemName}</h2>
            <p className="text-blue-300 text-xs">{t.agentPortal}</p>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 shadow-lg text-white'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent text-blue-200 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
          <p className="text-blue-200 text-xs text-center">
            {language === 'ar' 
              ? 'نظام إدارة الموانئ البحرية'
              : 'Maritime Port Management'}
          </p>
          <p className="text-blue-300/70 text-xs text-center mt-1">v2.0</p>
        </div>
      </div>
    </aside>
  );
}
