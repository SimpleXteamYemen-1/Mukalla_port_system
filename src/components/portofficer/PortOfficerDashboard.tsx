import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { Anchor, Ship, FileCheck, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getVessels, getWharves, getClearances, getLogs, initializeData, Vessel, Clearance, LogEntry } from '../../utils/portOfficerApi';
import { toast } from 'react-toastify';
import { StatCard } from '../ui/StatCard';

interface PortOfficerDashboardProps {
  language: Language;
}

export function PortOfficerDashboard({ language }: PortOfficerDashboardProps) {
  const t = translations[language].portOfficer;
  const isRTL = language === 'ar';

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vesselsData, clearancesData, logsData] = await Promise.all([
        getVessels(),
        getClearances(),
        getLogs()
      ]);

      setVessels(vesselsData);
      setClearances(clearancesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(isRTL ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await initializeData();
      await loadData();
      toast.success(isRTL ? 'تم تهيئة البيانات بنجاح' : 'Data initialized successfully');
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error(isRTL ? 'فشل تهيئة البيانات' : 'Failed to initialize data');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const stats = {
    activeVessels: vessels.filter(v => v.status !== 'awaiting').length,
    awaitingBerth: vessels.filter(v => v.status === 'awaiting').length,
    pendingClearances: vessels.filter(v => v.clearanceStatus === 'pending' || v.clearanceStatus === 'none').length,
    todayAssignments: logs.filter(l => l.action === 'berth_assignment').length
  };

  // Generate system alerts
  const systemAlerts = [
    ...clearances
      .filter(c => c.status === 'expiring-soon')
      .map(c => ({
        id: c.id,
        type: 'expiry',
        message: isRTL
          ? `تصريح المغادرة ${c.clearanceId} سينتهي خلال ${c.hoursRemaining} ساعة`
          : `Port clearance ${c.clearanceId} expires in ${c.hoursRemaining} hours`,
        severity: 'medium' as const,
        time: isRTL ? 'حديث' : 'Recent'
      })),
    ...clearances
      .filter(c => c.status === 'expired')
      .map(c => ({
        id: c.id + '-expired',
        type: 'expiry',
        message: isRTL
          ? `تصريح المغادرة ${c.clearanceId} انتهت صلاحيته`
          : `Port clearance ${c.clearanceId} has expired`,
        severity: 'high' as const,
        time: isRTL ? 'حديث' : 'Recent'
      }))
  ].slice(0, 5);

  // Get recent activity from logs
  const recentActivity = logs.slice(0, 4).map(log => ({
    id: log.id,
    action: isRTL
      ? (log.action === 'berth_assignment' ? 'تعيين رصيف' :
        log.action === 'clearance_issued' ? 'إصدار تصريح مغادرة' : 'تحرير رصيف')
      : (log.action === 'berth_assignment' ? 'Berth Assignment' :
        log.action === 'clearance_issued' ? 'Clearance Issued' : 'Berth Release'),
    vessel: log.vessel,
    wharf: log.wharf,
    clearanceId: log.clearanceId,
    time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: 'completed'
  }));

  if (loading && vessels.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] text-lg font-bold">{isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 group">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 cursor-default">
            {isRTL ? 'لوحة تحكم موظف الميناء' : 'Port Officer Operations'}
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-lg">
            {isRTL ? 'إدارة الرسو وإصدار تصاريح المغادرة' : 'Manage Berthing Operations & Port Clearances'}
          </p>
        </div>
        <div className="flex gap-3">
          {vessels.length === 0 && (
            <button
              onClick={handleInitialize}
              disabled={initializing}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none"
            >
              {initializing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {isRTL ? 'جاري التهيئة...' : 'Initializing...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {isRTL ? 'تهيئة البيانات' : 'Initialize Data'}
                </>
              )}
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={isRTL ? 'السفن الحالية' : 'Active Vessels'}
          value={stats.activeVessels}
          icon={Ship}
          color="cyan"
          language={language}
        />
        <StatCard
          label={isRTL ? 'انتظار الرصيف' : 'Awaiting Berth'}
          value={stats.awaitingBerth}
          icon={Clock}
          color="amber"
          language={language}
        />
        <StatCard
          label={isRTL ? 'تصاريح معلقة' : 'Pending Clearances'}
          value={stats.pendingClearances}
          icon={FileCheck}
          color="blue"
          language={language}
        />
        <StatCard
          label={isRTL ? 'تعيينات اليوم' : "Today's Assignments"}
          value={stats.todayAssignments}
          icon={Anchor}
          color="emerald"
          language={language}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="card-base p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {isRTL ? 'تنبيهات النظام' : 'System Alerts'}
            </h2>
          </div>

          {systemAlerts.length > 0 ? (
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border-l-4 shadow-sm ${alert.severity === 'high'
                      ? 'bg-red-500/5 border-l-red-500 border-y border-r border-red-500/10'
                      : 'bg-amber-500/5 border-l-amber-500 border-y border-r border-amber-500/10'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    {alert.severity === 'high' ? (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)] font-bold mb-1">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                        <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--surface)]/50">
              <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">{isRTL ? 'لا توجد تنبيهات' : 'No alerts'}</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card-base p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--primary)] font-black text-sm uppercase tracking-wide">
                      {activity.action}
                    </span>
                    <CheckCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110" />
                  </div>
                  <p className="text-[var(--text-primary)] font-bold mb-2 text-lg">{activity.vessel}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)] font-medium bg-[var(--background)] p-2 rounded-lg">
                    {activity.wharf && (
                      <span className="px-2 py-1 bg-[var(--surface)] rounded border border-[var(--border)]">
                        {isRTL ? 'الرصيف: ' : 'Wharf: '}<span className="text-[var(--text-primary)] font-bold">{activity.wharf}</span>
                      </span>
                    )}
                    {activity.clearanceId && (
                      <span className="px-2 py-1 bg-[var(--surface)] rounded border border-[var(--border)]">
                        {isRTL ? 'رقم التصريح: ' : 'ID: '}<span className="text-[var(--text-primary)] font-bold">{activity.clearanceId}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <p className="text-[10px] text-[var(--text-secondary)]/70 font-bold uppercase tracking-widest flex items-center gap-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--surface)]/50">
              <Clock className="w-12 h-12 text-[var(--text-secondary)]/30 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">{isRTL ? 'لا يوجد نشاط حديث' : 'No recent activity'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
