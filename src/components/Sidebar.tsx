import { LayoutDashboard, Ship, Bell, Anchor, FileText, Activity, FileCheck, FileDown } from 'lucide-react';
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
    { id: 'clearances', label: t.menu.portClearances, icon: FileCheck },
    { id: 'tracker', label: t.menu.requestStatusTracker, icon: Activity },
    { id: 'report', label: language === 'ar' ? 'تقرير نشاط السفينة' : 'Vessel Activity Report', icon: FileDown },
  ];

  return (
    <>
      {/* Background blur backdrop for mobile if needed, but for desktop we use a floating sidebar */}
      <aside
        className={`fixed top-4 bottom-4 w-64 z-50 transition-all duration-300 flex flex-col
          ${language === 'ar' ? 'right-4' : 'left-4'}
          bg-[var(--sidebar-bg)] backdrop-blur-xl border border-[var(--sidebar-border)] rounded-3xl shadow-2xl shadow-black/20`}
      >
        {/* Logo */}
        <div className="p-6 pb-2 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-50"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                <Anchor className="w-6 h-6" />
              </div>
            </div>
            <div className="overflow-hidden">
              <h2 className={`font-bold text-lg leading-tight tracking-wide truncate ${language === 'ar' ? 'font-sans' : ''} text-[var(--sidebar-fg)]`}>{t.systemName}</h2>
              <p className="text-[var(--sidebar-fg)]/60 text-xs font-medium uppercase tracking-wider mt-0.5">{t.agentPortal}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isActive
                      ? 'text-white shadow-lg shadow-blue-500/20'
                      : 'text-[var(--sidebar-fg)]/70 hover:text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-bg)]/50'
                      }`}
                  >
                    {/* Active Background Gradient */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-100" />
                    )}

                    {/* Hover Background Gradient (Subtle) */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <div className="relative z-10 flex items-center gap-3 w-full">
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className={`text-sm font-medium tracking-wide transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Active Indicator Dot */}
                    {isActive && (
                      <div className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-glow-white ${language === 'ar' ? 'left-4' : 'right-4'}`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Info / User Profile Snippet */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-[var(--sidebar-fg)]/5 to-transparent border border-[var(--sidebar-border)] rounded-2xl p-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white">
                  {language === 'ar' ? 'أ' : 'A'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--sidebar-fg)] text-sm font-medium truncate">Agent User</p>
                <div className="flex items-center gap-1.5 opacity-60">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald"></div>
                  <p className="text-[10px] text-[var(--sidebar-fg)]">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
