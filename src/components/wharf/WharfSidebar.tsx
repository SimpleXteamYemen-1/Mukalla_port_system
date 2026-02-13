import React from 'react';
import { Language } from '../../App';
import { LayoutDashboard, Anchor, Package, BoxSelect, BarChart3, CircleDot } from 'lucide-react';

interface WharfSidebarProps {
  language: Language;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function WharfSidebar({ language, currentPage, onNavigate }: WharfSidebarProps) {
  const isRTL = language === 'ar';

  const menuItems = [
    {
      id: 'dashboard',
      label: isRTL ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      description: isRTL ? 'نظرة عامة' : 'Overview'
    },
    {
      id: 'availability',
      label: isRTL ? 'توفر الأرصفة' : 'Wharf Availability',
      icon: Anchor,
      description: isRTL ? 'طلبات التوفر' : 'Availability requests'
    },
    {
      id: 'storage',
      label: isRTL ? 'إدارة التخزين' : 'Storage Management',
      icon: Package,
      description: isRTL ? 'مناطق التخزين' : 'Storage areas'
    },
    {
      id: 'containers',
      label: isRTL ? 'تعيين الحاويات' : 'Container Assignment',
      icon: BoxSelect,
      description: isRTL ? 'تعيين الحاويات' : 'Assign containers'
    },
    {
      id: 'capacity',
      label: isRTL ? 'نظرة عامة على السعة' : 'Capacity Overview',
      icon: BarChart3,
      description: isRTL ? 'مراقبة السعة' : 'Capacity monitoring'
    }
  ];

  return (
    <aside className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen w-72 bg-gradient-to-b from-[#0A1628]/95 via-[#0F2744]/95 to-[#153B5E]/95 backdrop-blur-xl border-${isRTL ? 'l' : 'r'} border-white/10 z-50`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isRTL ? 'موظف الأرصفة والتخزين' : 'Wharf & Storage Officer'}
              </h2>
              <p className="text-xs text-amber-300">
                {isRTL ? 'إدارة الأرصفة والتخزين' : 'Wharf & Storage Operations'}
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
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 shadow-lg scale-[1.02]'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      borderRadius: '12px',
                      border: isActive ? '2px solid rgba(251, 191, 36, 0.5)' : '2px solid transparent',
                    }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500`} />
                    )}
                    
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-amber-400/20 shadow-lg' 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <Icon className={`w-5 h-5 transition-all ${
                          isActive 
                            ? 'text-amber-400 scale-110' 
                            : 'text-blue-200 group-hover:text-amber-300'
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
                            ? 'text-amber-300' 
                            : 'text-blue-300/60 group-hover:text-blue-300'
                        }`}>
                          {item.description}
                        </div>
                      </div>

                      {isActive && (
                        <CircleDot className="w-3 h-3 text-amber-400 animate-pulse" />
                      )}
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
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
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-xl p-4">
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
