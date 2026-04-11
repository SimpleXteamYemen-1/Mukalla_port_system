import { useState, useEffect } from 'react';
import { AlertCircle, LogOut, Shield, Ship, Package, BarChart3, Anchor, Bell, Globe, User as UserIcon, ChevronDown, Settings, Sun, Moon } from 'lucide-react';
import { User, Language } from '../App';
import { translations } from '../utils/translations';
import { MainLayout } from './MainLayout';
import { AccountSettings } from './AccountSettings';
import { AgentDashboard } from './agent/AgentDashboard';
import { MyVessels } from './agent/MyVessels';
import { ArrivalNotifications } from './agent/ArrivalNotifications';
import { AnchorageRequests } from './agent/AnchorageRequests';
import { CargoManifests } from './agent/CargoManifests';
import { RequestStatusTracker } from './agent/RequestStatusTracker';
import { PortClearances as AgentPortClearances } from './agent/PortClearances';
import { VesselActivityReport } from './agent/VesselActivityReport';
import { ExecutiveSidebar } from './executive/ExecutiveSidebar';
import { ExecutiveDashboard } from './executive/ExecutiveDashboard';
import { ArrivalApprovals } from './executive/ArrivalApprovals';
import { AnchorageApprovals } from './executive/AnchorageApprovals';
import { DecisionLogs } from './executive/DecisionLogs';
import { ReportsAnalytics } from './executive/ReportsAnalytics';
import { UserApprovals } from './executive/UserApprovals';
import { UserDirectory } from './executive/UserDirectory';
import { VesselHistory } from './executive/VesselHistory';
import { PortOfficerSidebar } from './portofficer/PortOfficerSidebar';
import { PortOfficerDashboard } from './portofficer/PortOfficerDashboard';
import { BerthingManagement } from './portofficer/BerthingManagement';
import { ActiveVessels } from './portofficer/ActiveVessels';
import { PortClearances } from './portofficer/PortClearances';
import { OperationalLogs } from './portofficer/OperationalLogs';
import { PortReport } from './portofficer/PortReport';
import { WharfSidebar } from './wharf/WharfSidebar';
import { WharfDashboard } from './wharf/WharfDashboard';
import { WharfAvailability } from './wharf/WharfAvailability';
import { StorageManagement } from './wharf/StorageManagement';
import { ContainerAssignment } from './wharf/ContainerAssignment';
import { CapacityOverview } from './wharf/CapacityOverview';
import { wharfService } from '../services/wharfService';
import { TraderSidebar } from './trader/TraderSidebar';
import { TraderDashboard } from './trader/TraderDashboard';
import { MyContainers } from './trader/MyContainers';
import { DischargeRequests } from './trader/DischargeRequests';
import { TraderNotifications } from './trader/TraderNotifications';

interface DashboardRouterProps {
  user: User;
  language: Language;
  onLogout: () => void;
  onToggleLanguage: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function DashboardRouter({ user, language, onLogout, onToggleLanguage, theme, onToggleTheme }: DashboardRouterProps) {
  const t = translations[language]?.dashboard || translations.en.dashboard;
  const isRTL = language === 'ar';
  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  });

  const [activeVesselId, setActiveVesselId] = useState<string | number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('vesselId');
  });

  const handleNavigate = (page: string, params?: { vesselId?: number | string }) => {
    if (params?.vesselId) {
      setActiveVesselId(params.vesselId);
    } else {
      // Clear vessel ID if navigating to a generic tab (optional, depends on UX)
      // setActiveVesselId(null); 
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    
    // Tab Sync
    if (currentPage === 'dashboard') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', currentPage);
    }

    // Vessel ID Sync
    if (currentPage === 'vessel-history' && activeVesselId) {
      url.searchParams.set('vesselId', activeVesselId.toString());
    } else {
      url.searchParams.delete('vesselId');
    }

    window.history.replaceState({}, '', url);
  }, [currentPage, activeVesselId]);

  // Executive Management Interface
  if (user.role === 'executive') {
    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'} bg-[var(--bg-primary)] transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-50"></div>
        </div>

        {/* Sidebar */}
        <ExecutiveSidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-64' : 'ml-64'} min-h-screen transition-all duration-300`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--secondary)]">
            <div className="flex items-center justify-between px-6 py-4">
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
                <button className="relative p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all">
                    <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-[var(--text-primary)] text-sm font-medium">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{t.roles.executive}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Profile Dropdown */}
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50`}>
                    <div className="p-4 border-b border-[var(--secondary)]/50 bg-[var(--secondary)]/5">
                      <div className="text-[var(--text-primary)] font-medium truncate">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                       <button 
                        onClick={() => setCurrentPage('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--primary)]/10 text-[var(--text-primary)] transition-colors text-sm ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <Settings className="w-4 h-4" />
                        {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {currentPage === 'dashboard' && <ExecutiveDashboard language={language} onNavigate={handleNavigate} />}
            {currentPage === 'arrivals' && <ArrivalApprovals language={language} onNavigate={handleNavigate} />}
            {currentPage === 'vessel-history' && (
              <VesselHistory 
                language={language} 
                vesselId={activeVesselId || ''} 
                onNavigate={handleNavigate} 
              />
            )}
            {currentPage === 'anchorage' && <AnchorageApprovals language={language} onNavigate={handleNavigate} />}
            {currentPage === 'user-approvals' && <UserApprovals language={language} />}
            {currentPage === 'user-directory' && <UserDirectory language={language} />}
            {currentPage === 'logs' && <DecisionLogs language={language} />}
            {currentPage === 'reports' && <ReportsAnalytics language={language} />}
            {currentPage === 'settings' && (
              <AccountSettings 
                user={user} 
                language={language} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                onToggleLanguage={onToggleLanguage} 
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Port Officer Interface
  if (user.role === 'officer') {
    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'} bg-[var(--bg-primary)] transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-50"></div>
        </div>

        {/* Sidebar */}
        <PortOfficerSidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen transition-all duration-300`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--secondary)]">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-[var(--text-primary)] font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'berthing' && (isRTL ? 'إدارة الرسو' : 'Berthing Management')}
                  {currentPage === 'vessels' && (isRTL ? 'السفن النشطة' : 'Active Vessels')}
                  {currentPage === 'clearances' && (isRTL ? 'تصاريح المغادرة' : 'Port Clearances')}
                  {currentPage === 'logs' && (isRTL ? 'السجلات التشغيلية' : 'Operational Logs')}
                </h2>
              </div>

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
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all">
                    <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-[var(--text-primary)] text-sm font-medium">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{t.roles.officer}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Profile Dropdown */}
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50`}>
                    <div className="p-4 border-b border-[var(--secondary)]/50 bg-[var(--secondary)]/5">
                      <div className="text-[var(--text-primary)] font-medium truncate">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                       <button 
                        onClick={() => setCurrentPage('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--primary)]/10 text-[var(--text-primary)] transition-colors text-sm ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <Settings className="w-4 h-4" />
                        {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main>
            {currentPage === 'dashboard' && <PortOfficerDashboard language={language} />}
            {currentPage === 'berthing' && <BerthingManagement language={language} />}
            {currentPage === 'vessels' && <ActiveVessels language={language} onNavigate={setCurrentPage} />}
            {currentPage === 'clearances' && <PortClearances language={language} />}
            {currentPage === 'logs' && <OperationalLogs language={language} />}
            {currentPage === 'settings' && (
              <AccountSettings 
                user={user} 
                language={language} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                onToggleLanguage={onToggleLanguage} 
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Wharf & Storage Officer Interface
  if (user.role === 'wharf') {
    const t = translations[language].dashboard;
    const isRTL = language === 'ar';
    const [waitlistAlert, setWaitlistAlert] = useState<{ count: number; wharves: number } | null>(null);

    // Reactive Waitlist Monitoring
    const checkWaitlistStatus = async () => {
      try {
        const [wharvesData, anchorageData] = await Promise.all([
          wharfService.getWharves(),
          wharfService.getAnchorageRequests(),
        ]);
        const waitlistedCount = (anchorageData.requests || []).filter((r: any) => r.status === 'waiting').length;
        const availableCount = (wharvesData || []).filter((w: any) => w.status === 'available').length;

        if (waitlistedCount > 0 && availableCount > 0) {
          setWaitlistAlert({ count: waitlistedCount, wharves: availableCount });
        } else {
          setWaitlistAlert(null);
        }
      } catch (error) {
        console.error('Error monitoring waitlist:', error);
      }
    };

    useEffect(() => {
      checkWaitlistStatus();
      const interval = setInterval(checkWaitlistStatus, 60000); // Check every minute
      return () => clearInterval(interval);
    }, []);

    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'} bg-[var(--bg-primary)] transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-50"></div>
        </div>

        {/* Sidebar */}
        <WharfSidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen transition-all duration-300`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--secondary)]">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-[var(--text-primary)] font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'availability' && (isRTL ? 'توفر الأرصفة' : 'Wharf Availability')}
                  {currentPage === 'storage' && (isRTL ? 'إدارة التخزين' : 'Storage Management')}
                  {currentPage === 'containers' && (isRTL ? 'تعيين الحاويات' : 'Container Assignment')}
                  {currentPage === 'capacity' && (isRTL ? 'نظرة عامة على السعة' : 'Capacity Overview')}
                </h2>
              </div>

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
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button 
                  onClick={() => setCurrentPage('availability')}
                  className="relative p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)] group"
                >
                  <Bell className="w-5 h-5" />
                  {waitlistAlert && (
                    <>
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[var(--bg-primary)]"></span>
                      <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <p className="text-xs text-white font-medium leading-relaxed">
                          {isRTL 
                            ? `السعة متاحة: ${waitlistAlert.wharves} أرصفة شاغرة للسفن في قائمة الانتظار (${waitlistAlert.count}).` 
                            : `Capacity available: ${waitlistAlert.wharves} wharves are free for waitlisted vessels (${waitlistAlert.count}).`}
                        </p>
                        <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase tracking-tighter">
                          {isRTL ? 'انقر للمراجعة' : 'Click to review'}
                        </p>
                      </div>
                    </>
                  )}
                </button>

                {/* Profile Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all">
                    <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-[var(--text-primary)] text-sm font-medium">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{t.roles.wharf}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Profile Dropdown */}
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50`}>
                    <div className="p-4 border-b border-[var(--secondary)]/50 bg-[var(--secondary)]/5">
                      <div className="text-[var(--text-primary)] font-medium truncate">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                       <button 
                        onClick={() => setCurrentPage('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--primary)]/10 text-[var(--text-primary)] transition-colors text-sm ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <Settings className="w-4 h-4" />
                        {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main>
            {currentPage === 'dashboard' && <WharfDashboard language={language} />}
            {currentPage === 'availability' && <WharfAvailability language={language} />}
            {currentPage === 'storage' && <StorageManagement language={language} />}
            {currentPage === 'containers' && <ContainerAssignment language={language} />}
            {currentPage === 'capacity' && <CapacityOverview language={language} />}
            {currentPage === 'settings' && (
              <AccountSettings 
                user={user} 
                language={language} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                onToggleLanguage={onToggleLanguage} 
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Trader Interface
  if (user.role === 'trader') {
    const t = translations[language].dashboard;
    const isRTL = language === 'ar';

    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'} bg-[var(--bg-primary)] transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-50"></div>
        </div>

        {/* Sidebar */}
        <TraderSidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen transition-all duration-300`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--secondary)]">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-[var(--text-primary)] font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'containers' && (isRTL ? 'حاوياتي' : 'My Containers')}
                  {currentPage === 'discharge' && (isRTL ? 'طلبات التفريغ' : 'Discharge Requests')}
                  {currentPage === 'notifications' && (isRTL ? 'الإشعارات' : 'Notifications')}
                </h2>
              </div>

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
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setCurrentPage('notifications')}
                  className="relative p-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-primary)] hover:bg-[var(--secondary)]/10 rounded-md border border-[var(--secondary)] hover:border-[var(--accent)] transition-all">
                    <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-[var(--text-primary)] text-sm font-medium">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{t.roles.trader}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Profile Dropdown */}
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-[var(--bg-primary)] rounded-lg border border-[var(--secondary)] shadow-xl overflow-hidden scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50`}>
                    <div className="p-4 border-b border-[var(--secondary)]/50 bg-[var(--secondary)]/5">
                      <div className="text-[var(--text-primary)] font-medium truncate">{user.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs truncate">{user.email}</div>
                    </div>
                    <div className="p-2">
                       <button 
                        onClick={() => setCurrentPage('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--primary)]/10 text-[var(--text-primary)] transition-colors text-sm ${currentPage === 'settings' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <Settings className="w-4 h-4" />
                        {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main>
            {currentPage === 'dashboard' && <TraderDashboard language={language} userEmail={user.email} />}
            {currentPage === 'containers' && <MyContainers language={language} userEmail={user.email} />}
            {currentPage === 'discharge' && <DischargeRequests language={language} userEmail={user.email} userName={user.name} />}
            {currentPage === 'notifications' && <TraderNotifications language={language} userEmail={user.email} />}
            {currentPage === 'settings' && (
              <AccountSettings 
                user={user} 
                language={language} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                onToggleLanguage={onToggleLanguage} 
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // If user is an agent, show the full agent interface
  if (user.role === 'agent') {
    return (
      <MainLayout
        user={user}
        language={language}
        onToggleLanguage={onToggleLanguage}
        onLogout={onLogout}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        theme={theme}
        onToggleTheme={onToggleTheme}
      >
        {currentPage === 'dashboard' && <AgentDashboard language={language} onNavigate={setCurrentPage} />}
        {currentPage === 'vessels' && <MyVessels language={language} onNavigate={setCurrentPage} />}
        {currentPage === 'arrivals' && <ArrivalNotifications language={language} />}
        {currentPage === 'anchorage' && <AnchorageRequests language={language} />}
        {currentPage === 'manifests' && <CargoManifests language={language} />}
        {currentPage === 'clearances' && <AgentPortClearances language={language} />}
        {currentPage === 'tracker' && <RequestStatusTracker language={language} onNavigate={setCurrentPage} />}
        {currentPage === 'settings' && (
          <AccountSettings 
            user={user} 
            language={language} 
            theme={theme} 
            onToggleTheme={onToggleTheme} 
            onToggleLanguage={onToggleLanguage} 
          />
        )}
      </MainLayout>
    );
  }

  // For other roles, show basic dashboard (placeholder)
  const getRoleIcon = () => {
    switch (user.role) {
      case 'executive':
        return <BarChart3 className="w-8 h-8" />;
      case 'officer':
        return <Shield className="w-8 h-8" />;
      case 'trader':
        return <Package className="w-8 h-8" />;
      case 'wharf':
        return <Anchor className="w-8 h-8" />;
      default:
        return <Ship className="w-8 h-8" />;
    }
  };

  const getRoleDashboardTitle = () => {
    switch (user.role) {
      case 'executive':
        return t.roles.executive;
      case 'officer':
        return t.roles.officer;
      case 'trader':
        return t.roles.trader;
      case 'wharf':
        return t.roles.wharf;
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg flex items-center justify-center">
                <Anchor className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-[var(--text-primary)] font-semibold">{getRoleDashboardTitle()}</h1>
                <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-500 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">{t.logout}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentPage === 'settings' ? (
          <AccountSettings 
            user={user} 
            language={language} 
            theme={theme} 
            onToggleTheme={onToggleTheme} 
            onToggleLanguage={onToggleLanguage} 
          />
        ) : (
          <>
            {/* Verification Warning Banner */}
            {!user.verified && (
              <div className="mb-8 bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-amber-500 font-semibold mb-1">{t.pendingVerification}</h3>
                    <p className="text-amber-500/80 text-sm">{t.verificationMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)]/50 shadow-xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl mb-6 shadow-lg shadow-[var(--primary)]/20">
                  {getRoleIcon()}
                </div>
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  {t.welcome}, {user.name}
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">{getRoleDashboardTitle()}</p>

                {/* Role-specific Dashboard Content */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-[var(--bg-card)]/50 backdrop-blur-sm border border-[var(--secondary)]/50 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="text-[var(--text-secondary)] text-sm mb-2">Status</div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${user.verified
                      ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
                      <span className="text-sm font-medium">{user.verified ? 'Verified' : 'Pending'}</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)]/50 backdrop-blur-sm border border-[var(--secondary)]/50 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="text-[var(--text-secondary)] text-sm mb-2">Role</div>
                    <div className="text-[var(--text-primary)] font-semibold capitalize">{(user.role as string).replace('_', ' ')}</div>
                  </div>

                  <div className="bg-[var(--bg-card)]/50 backdrop-blur-sm border border-[var(--secondary)]/50 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="text-[var(--text-secondary)] text-sm mb-2">Access Level</div>
                    <div className="text-[var(--text-primary)] font-semibold">{user.verified ? 'Full Access' : 'Limited'}</div>
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="mt-12 text-left">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Quick Actions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card)] border-l-4 border-[var(--primary)] rounded-r-xl p-6 text-left shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]">
                      <h4 className="text-[var(--text-primary)] font-semibold mb-2 group-hover:text-[var(--primary)] transition-colors">View Reports</h4>
                      <p className="text-[var(--text-secondary)] text-sm">Access system reports and analytics</p>
                    </button>

                    <button className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card)] border-l-4 border-[var(--accent)] rounded-r-xl p-6 text-left shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]">
                      <h4 className="text-[var(--text-primary)] font-semibold mb-2 group-hover:text-[var(--accent)] transition-colors">Manage Operations</h4>
                      <p className="text-[var(--text-secondary)] text-sm">Handle daily operations and tasks</p>
                    </button>

                    <button className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card)] border-l-4 border-amber-500 rounded-r-xl p-6 text-left shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]" disabled={!user.verified}>
                      <h4 className="text-[var(--text-primary)] font-semibold mb-2 group-hover:text-amber-500 transition-colors">Submit Requests</h4>
                      <p className="text-[var(--text-secondary)] text-sm">Create new operational requests</p>
                      {!user.verified && (
                        <span className="inline-block mt-2 text-xs text-amber-500">⚠️ Requires verification</span>
                      )}
                    </button>

                    <button 
                      onClick={() => setCurrentPage('settings')}
                      className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card)] border-l-4 border-[var(--secondary)] rounded-r-xl p-6 text-left shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]"
                    >
                      <h4 className="text-[var(--text-primary)] font-semibold mb-2 group-hover:text-[var(--text-primary)] transition-colors">Settings</h4>
                      <p className="text-[var(--text-secondary)] text-sm">Manage your account settings</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
