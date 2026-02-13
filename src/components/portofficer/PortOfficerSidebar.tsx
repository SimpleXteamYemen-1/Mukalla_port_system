import React from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { LayoutDashboard, Anchor, Ship, FileCheck, FileText, CircleDot } from 'lucide-react';

interface PortOfficerSidebarProps {
  language: Language;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function PortOfficerSidebar({ language, currentPage, onNavigate }: PortOfficerSidebarProps) {
  const t = translations[language].portOfficer;
  const isRTL = language === 'ar';

  const menuItems = [
    {
      id: 'dashboard',
      label: isRTL ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      description: isRTL ? 'نظرة عامة' : 'Overview'
    },
    {
      id: 'berthing',
      label: isRTL ? 'إدارة الرسو' : 'Berthing Management',
      icon: Anchor,
      description: isRTL ? 'تعيين السفن للأرصفة' : 'Assign vessels to berths'
    },
    {
      id: 'vessels',
      label: isRTL ? 'السفن النشطة' : 'Active Vessels',
      icon: Ship,
      description: isRTL ? 'السفن الراسية' : 'Docked vessels'
    },
    {
      id: 'clearances',
      label: isRTL ? 'تصاريح المغادرة' : 'Port Clearances',
      icon: FileCheck,
      description: isRTL ? 'إصدار التصاريح' : 'Issue clearances'
    },
    {
      id: 'logs',
      label: isRTL ? 'السجلات التشغيلية' : 'Operational Logs',
      icon: FileText,
      description: isRTL ? 'سجل التدقيق' : 'Audit trail'
    }
  ];

  return (
    <aside className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen w-72 bg-gradient-to-b from-[#0A1628]/95 via-[#0F2744]/95 to-[#1A3A5C]/95 backdrop-blur-xl border-${isRTL ? 'l' : 'r'} border-white/10 z-50`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isRTL ? 'موظف الميناء' : 'Port Officer'}
              </h2>
              <p className="text-xs text-cyan-300">
                {isRTL ? 'عمليات الميناء' : 'Port Operations'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full group relative overflow-hidden transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 shadow-lg scale-[1.02]'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      borderRadius: '12px',
                      border: isActive ? '2px solid rgba(34, 211, 238, 0.5)' : '2px solid transparent',
                    }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500`} />
                    )}
                    
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-cyan-400/20 shadow-lg' 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <Icon className={`w-5 h-5 transition-all ${
                          isActive 
                            ? 'text-cyan-400 scale-110' 
                            : 'text-blue-200 group-hover:text-cyan-300'
                        }`} />
                      </div>
                      
                      <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className={`font-semibold text-sm transition-all ${
                          isActive 
                            ? 'text-white' 
                            : 'text-blue-100 group-hover:text-white'
                        }`}>
                          {item.label}
                        </div>
                        <div className={`text-xs transition-all ${
                          isActive 
                            ? 'text-cyan-300' 
                            : 'text-blue-300/60 group-hover:text-blue-300'
                        }`}>
                          {item.description}
                        </div>
                      </div>

                      {isActive && (
                        <CircleDot className="w-3 h-3 text-cyan-400 animate-pulse" />
                      )}
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                      isActive ? 'opacity-100' : ''
                    }`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-semibold">
                {isRTL ? 'النظام نشط' : 'System Active'}
              </span>
            </div>
            <p className="text-xs text-blue-200/70">
              {isRTL 
                ? 'جميع الأنظمة تعمل بشكل طبيعي' 
                : 'All systems operational'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
