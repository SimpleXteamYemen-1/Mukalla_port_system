import React from 'react';
import { Language } from '../../App';
import { LayoutDashboard, Package, FileText, Bell, CircleDot } from 'lucide-react';

interface TraderSidebarProps {
  language: Language;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function TraderSidebar({ language, currentPage, onNavigate }: TraderSidebarProps) {
  const isRTL = language === 'ar';

  const menuItems = [
    {
      id: 'dashboard',
      label: isRTL ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      description: isRTL ? 'نظرة عامة' : 'Overview'
    },
    {
      id: 'containers',
      label: isRTL ? 'حاوياتي' : 'My Containers',
      icon: Package,
      description: isRTL ? 'عرض الحاويات' : 'View containers'
    },
    {
      id: 'discharge',
      label: isRTL ? 'طلبات التفريغ' : 'Discharge Requests',
      icon: FileText,
      description: isRTL ? 'إدارة الطلبات' : 'Manage requests'
    },
    {
      id: 'notifications',
      label: isRTL ? 'الإشعارات' : 'Notifications',
      icon: Bell,
      description: isRTL ? 'التنبيهات والتحديثات' : 'Alerts & updates'
    }
  ];

  return (
    <aside className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen w-72 bg-gradient-to-b from-[#0A1628]/95 via-[#0F2744]/95 to-[#153B5E]/95 backdrop-blur-xl border-${isRTL ? 'l' : 'r'} border-white/10 z-50`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isRTL ? 'بوابة التاجر' : 'Trader Portal'}
              </h2>
              <p className="text-xs text-emerald-300">
                {isRTL ? 'إدارة الحاويات والتفريغ' : 'Container & Discharge Management'}
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
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 shadow-lg scale-[1.02]'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      borderRadius: '12px',
                      border: isActive ? '2px solid rgba(52, 211, 153, 0.5)' : '2px solid transparent',
                    }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500`} />
                    )}
                    
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-emerald-400/20 shadow-lg' 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <Icon className={`w-5 h-5 transition-all ${
                          isActive 
                            ? 'text-emerald-400 scale-110' 
                            : 'text-blue-200 group-hover:text-emerald-300'
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
                            ? 'text-emerald-300' 
                            : 'text-blue-300/60 group-hover:text-blue-300'
                        }`}>
                          {item.description}
                        </div>
                      </div>

                      {isActive && (
                        <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
                      )}
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
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
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/20 rounded-xl p-4">
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
