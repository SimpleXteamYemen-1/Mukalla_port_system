import React from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { LayoutDashboard, Anchor, Ship, FileCheck, FileText } from 'lucide-react';
import { UnifiedSidebar, MenuItem } from '../layout/UnifiedSidebar';

interface PortOfficerSidebarProps {
  language: Language;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function PortOfficerSidebar({ language, currentPage, onNavigate }: PortOfficerSidebarProps) {
  const isRTL = language === 'ar';

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: isRTL ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { id: 'berthing', label: isRTL ? 'إدارة الرسو' : 'Berthing Management', icon: Anchor },
    { id: 'vessels', label: isRTL ? 'السفن النشطة' : 'Active Vessels', icon: Ship },
    { id: 'clearances', label: isRTL ? 'تصاريح المغادرة' : 'Port Clearances', icon: FileCheck },
    { id: 'logs', label: isRTL ? 'السجلات التشغيلية' : 'Operational Logs', icon: FileText },
    { id: 'report', label: isRTL ? 'تقرير التنظيمي' : 'Regulatory Report', icon: FileText }
  ];

  return (
    <UnifiedSidebar
      currentPage={currentPage}
      onNavigate={onNavigate}
      language={language}
      menuItems={menuItems}
      portalName={isRTL ? 'عمليات الميناء' : 'Port Operations'}
      portalIcon={<Anchor className="w-6 h-6 text-white" />}
      userRoleName={isRTL ? 'موظف الميناء' : 'Port Officer'}
      systemStatusText={isRTL ? 'جميع الأنظمة تعمل' : 'All systems operational'}
    />
  );
}
