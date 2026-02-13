import { useState } from 'react';
import { AlertCircle, LogOut, Shield, Ship, Package, BarChart3, Anchor, Bell, Globe, User as UserIcon, ChevronDown } from 'lucide-react';
import { User, Language } from '../App';
import { translations } from '../utils/translations';
import { MainLayout } from './MainLayout';
import { AgentDashboard } from './agent/AgentDashboard';
import { MyVessels } from './agent/MyVessels';
import { ArrivalNotifications } from './agent/ArrivalNotifications';
import { AnchorageRequests } from './agent/AnchorageRequests';
import { CargoManifests } from './agent/CargoManifests';
import { RequestStatusTracker } from './agent/RequestStatusTracker';
import { ExecutiveSidebar } from './executive/ExecutiveSidebar';
import { ExecutiveDashboard } from './executive/ExecutiveDashboard';
import { ArrivalApprovals } from './executive/ArrivalApprovals';
import { AnchorageApprovals } from './executive/AnchorageApprovals';
import { DecisionLogs } from './executive/DecisionLogs';
import { ReportsAnalytics } from './executive/ReportsAnalytics';
import { PortOfficerSidebar } from './portofficer/PortOfficerSidebar';
import { PortOfficerDashboard } from './portofficer/PortOfficerDashboard';
import { BerthingManagement } from './portofficer/BerthingManagement';
import { ActiveVessels } from './portofficer/ActiveVessels';
import { PortClearances } from './portofficer/PortClearances';
import { OperationalLogs } from './portofficer/OperationalLogs';
import { WharfSidebar } from './wharf/WharfSidebar';
import { WharfDashboard } from './wharf/WharfDashboard';
import { WharfAvailability } from './wharf/WharfAvailability';
import { StorageManagement } from './wharf/StorageManagement';
import { ContainerAssignment } from './wharf/ContainerAssignment';
import { CapacityOverview } from './wharf/CapacityOverview';
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
}

export function DashboardRouter({ user, language, onLogout, onToggleLanguage }: DashboardRouterProps) {
  const t = translations[language]?.dashboard || translations.en.dashboard;
  const isRTL = language === 'ar';
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Executive Management Interface
  if (user.role === 'executive') {
    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0A1628] via-[#1A0E2E] to-[#2D1B4E]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Sidebar */}
        <ExecutiveSidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-64' : 'ml-64'} min-h-screen`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center justify-between px-6 py-4">
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
                <button className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-white text-sm font-medium">{user.name}</div>
                      <div className="text-purple-300 text-xs">{t.roles.executive}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 hover:text-white transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {currentPage === 'dashboard' && <ExecutiveDashboard language={language} onNavigate={setCurrentPage} />}
            {currentPage === 'arrivals' && <ArrivalApprovals language={language} />}
            {currentPage === 'anchorage' && <AnchorageApprovals language={language} />}
            {currentPage === 'logs' && <DecisionLogs language={language} />}
            {currentPage === 'reports' && <ReportsAnalytics language={language} />}
          </main>
        </div>
      </div>
    );
  }

  // Port Officer Interface
  if (user.role === 'officer') {
    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0A1628] via-[#0F2744] to-[#1A3A5C] -z-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Sidebar */}
        <PortOfficerSidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'berthing' && (isRTL ? 'إدارة الرسو' : 'Berthing Management')}
                  {currentPage === 'vessels' && (isRTL ? 'السفن النشطة' : 'Active Vessels')}
                  {currentPage === 'clearances' && (isRTL ? 'تصاريح المغادرة' : 'Port Clearances')}
                  {currentPage === 'logs' && (isRTL ? 'السجلات التشغيلية' : 'Operational Logs')}
                </h2>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                {/* Language Toggle */}
                <button
                  onClick={onToggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-white text-sm font-medium">{user.name}</div>
                      <div className="text-blue-300 text-xs">{t.roles.officer}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 hover:text-white transition-all"
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
          </main>
        </div>
      </div>
    );
  }

  // Wharf & Storage Officer Interface
  if (user.role === 'wharf') {
    const t = translations[language].dashboard;
    const isRTL = language === 'ar';
    
    return (
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0A1628] via-[#0F2744] to-[#153B5E] -z-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Sidebar */}
        <WharfSidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'availability' && (isRTL ? 'توفر الأرصفة' : 'Wharf Availability')}
                  {currentPage === 'storage' && (isRTL ? 'إدارة التخزين' : 'Storage Management')}
                  {currentPage === 'containers' && (isRTL ? 'تعيين الحاويات' : 'Container Assignment')}
                  {currentPage === 'capacity' && (isRTL ? 'نظرة عامة على السعة' : 'Capacity Overview')}
                </h2>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                {/* Language Toggle */}
                <button
                  onClick={onToggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-white text-sm font-medium">{user.name}</div>
                      <div className="text-amber-300 text-xs">{t.roles.wharf}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 hover:text-white transition-all"
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
      <div className={`min-h-screen ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0A1628] via-[#0F2744] to-[#153B5E] -z-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Sidebar */}
        <TraderSidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          language={language}
        />

        {/* Main Content Area */}
        <div className={`${language === 'ar' ? 'mr-72' : 'ml-72'} min-h-screen`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg">
                  {currentPage === 'dashboard' && (isRTL ? 'لوحة التحكم' : 'Dashboard')}
                  {currentPage === 'containers' && (isRTL ? 'حاوياتي' : 'My Containers')}
                  {currentPage === 'discharge' && (isRTL ? 'طلبات التفريغ' : 'Discharge Requests')}
                  {currentPage === 'notifications' && (isRTL ? 'الإشعارات' : 'Notifications')}
                </h2>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                {/* Language Toggle */}
                <button
                  onClick={onToggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'ع'}</span>
                </button>

                {/* Notifications */}
                <button 
                  onClick={() => setCurrentPage('notifications')}
                  className="relative p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-white"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
                      <div className="text-white text-sm font-medium">{user.name}</div>
                      <div className="text-emerald-300 text-xs">{t.roles.trader}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 hover:text-white transition-all"
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
      >
        {currentPage === 'dashboard' && <AgentDashboard language={language} onNavigate={setCurrentPage} />}
        {currentPage === 'vessels' && <MyVessels language={language} onNavigate={setCurrentPage} />}
        {currentPage === 'arrivals' && <ArrivalNotifications language={language} />}
        {currentPage === 'anchorage' && <AnchorageRequests language={language} />}
        {currentPage === 'manifests' && <CargoManifests language={language} />}
        {currentPage === 'tracker' && <RequestStatusTracker language={language} onNavigate={setCurrentPage} />}
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F]">
      {/* Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold">{getRoleDashboardTitle()}</h1>
                <p className="text-blue-200 text-xs">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">{t.logout}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Verification Warning Banner */}
        {!user.verified && (
          <div className="mb-8 bg-amber-500/20 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-amber-200 font-semibold mb-1">{t.pendingVerification}</h3>
                <p className="text-amber-200/80 text-sm">{t.verificationMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl mb-6 shadow-lg">
              {getRoleIcon()}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {t.welcome}, {user.name}
            </h2>
            <p className="text-blue-200 mb-8">{getRoleDashboardTitle()}</p>

            {/* Role-specific Dashboard Content */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-blue-200 text-sm mb-2">Status</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${
                  user.verified 
                    ? 'bg-green-500/20 border border-green-400/30 text-green-200' 
                    : 'bg-amber-500/20 border border-amber-400/30 text-amber-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
                  <span className="text-sm font-medium">{user.verified ? 'Verified' : 'Pending'}</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-blue-200 text-sm mb-2">Role</div>
                <div className="text-white font-semibold capitalize">{user.role.replace('_', ' ')}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-blue-200 text-sm mb-2">Access Level</div>
                <div className="text-white font-semibold">{user.verified ? 'Full Access' : 'Limited'}</div>
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="mt-12 text-left">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-xl p-6 text-left transition-all transform hover:scale-[1.02]">
                  <h4 className="text-white font-semibold mb-2">View Reports</h4>
                  <p className="text-blue-200 text-sm">Access system reports and analytics</p>
                </button>
                
                <button className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 rounded-xl p-6 text-left transition-all transform hover:scale-[1.02]">
                  <h4 className="text-white font-semibold mb-2">Manage Operations</h4>
                  <p className="text-blue-200 text-sm">Handle daily operations and tasks</p>
                </button>
                
                <button className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-400/30 rounded-xl p-6 text-left transition-all transform hover:scale-[1.02]" disabled={!user.verified}>
                  <h4 className="text-white font-semibold mb-2">Submit Requests</h4>
                  <p className="text-blue-200 text-sm">Create new operational requests</p>
                  {!user.verified && (
                    <span className="inline-block mt-2 text-xs text-amber-300">⚠️ Requires verification</span>
                  )}
                </button>
                
                <button className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-400/30 rounded-xl p-6 text-left transition-all transform hover:scale-[1.02]">
                  <h4 className="text-white font-semibold mb-2">Settings</h4>
                  <p className="text-blue-200 text-sm">Manage your account settings</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
