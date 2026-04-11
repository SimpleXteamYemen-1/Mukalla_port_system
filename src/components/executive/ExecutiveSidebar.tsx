import { LayoutDashboard, Ship, Anchor, FileText, BarChart3, Users, ShieldCheck, History } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface ExecutiveSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: Language;
}

export function ExecutiveSidebar({ currentPage, onNavigate, language }: ExecutiveSidebarProps) {
  const t = translations[language]?.executive || translations.en.executive;

  const menuItems = [
    { id: 'dashboard',      label: t.menu.dashboard,         icon: LayoutDashboard },
    { id: 'arrivals',       label: t.menu.arrivalApprovals,  icon: Ship },
    { id: 'anchorage',      label: t.menu.anchorageApprovals,icon: Anchor },
    { id: 'user-approvals', label: t.menu.userApprovals,     icon: Users, highlight: true },
    { id: 'user-directory', label: t.menu.userDirectory,     icon: ShieldCheck },
    { id: 'logs',           label: t.menu.decisionLogs,      icon: FileText },
    { id: 'reports',        label: t.menu.reportsAnalytics,  icon: BarChart3 },
    { id: 'vessel-history', label: language === 'ar' ? 'سجل السفن' : 'Vessel History', icon: History },
  ];

  return (
    <aside className={`fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 h-screen w-64 bg-white/5 backdrop-blur-xl border-${language === 'ar' ? 'l' : 'r'} border-white/20 z-50`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{t.systemName}</h2>
            <p className="text-purple-300 text-xs">{t.executivePortal}</p>
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
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 shadow-lg text-white'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent text-blue-200 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {(item as any).highlight && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="bg-purple-500/10 border border-purple-400/20 rounded-xl p-3">
          <p className="text-purple-200 text-xs text-center">
            {language === 'ar' 
              ? 'إدارة تنفيذية'
              : 'Executive Management'}
          </p>
          <p className="text-purple-300/70 text-xs text-center mt-1">v2.0</p>
        </div>
      </div>
    </aside>
  );
}
