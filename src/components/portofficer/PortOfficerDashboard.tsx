import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { Anchor, Ship, FileCheck, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getVessels, getWharves, getClearances, getLogs, initializeData, Vessel, Clearance, LogEntry } from '../../utils/portOfficerApi';

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
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await initializeData();
      await loadData();
    } catch (error) {
      console.error('Error initializing data:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F] p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">{isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F] p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'لوحة تحكم موظف الميناء' : 'Port Officer Operations Dashboard'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'إدارة الرسو وإصدار تصاريح المغادرة' : 'Manage Berthing Operations & Port Clearances'}
            </p>
          </div>
          <div className="flex gap-3">
            {vessels.length === 0 && (
              <button
                onClick={handleInitialize}
                disabled={initializing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                {initializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isRTL ? 'جاري التهيئة...' : 'Initializing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isRTL ? 'تهيئة البيانات' : 'Initialize Data'}
                  </>
                )}
              </button>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Vessels */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Ship className="w-8 h-8 text-cyan-400" />
            </div>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              <div className="text-3xl font-bold text-white">{stats.activeVessels}</div>
              <div className="text-xs text-cyan-300">{isRTL ? 'نشط' : 'Active'}</div>
            </div>
          </div>
          <h3 className="text-white font-semibold">
            {isRTL ? 'السفن الحالية في الميناء' : 'Active Vessels in Port'}
          </h3>
        </div>

        {/* Awaiting Berth */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              <div className="text-3xl font-bold text-white">{stats.awaitingBerth}</div>
              <div className="text-xs text-amber-300">{isRTL ? 'انتظار' : 'Waiting'}</div>
            </div>
          </div>
          <h3 className="text-white font-semibold">
            {isRTL ? 'سفن تنتظر تعيين رصيف' : 'Vessels Awaiting Berth'}
          </h3>
        </div>

        {/* Pending Clearances */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FileCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              <div className="text-3xl font-bold text-white">{stats.pendingClearances}</div>
              <div className="text-xs text-blue-300">{isRTL ? 'قيد الانتظار' : 'Pending'}</div>
            </div>
          </div>
          <h3 className="text-white font-semibold">
            {isRTL ? 'تصاريح مغادرة معلقة' : 'Clearances Pending Issue'}
          </h3>
        </div>

        {/* Today's Assignments */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Anchor className="w-8 h-8 text-emerald-400" />
            </div>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              <div className="text-3xl font-bold text-white">{stats.todayAssignments}</div>
              <div className="text-xs text-emerald-300">{isRTL ? 'اليوم' : 'Today'}</div>
            </div>
          </div>
          <h3 className="text-white font-semibold">
            {isRTL ? 'تعيينات اليوم' : "Today's Berth Assignments"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">
              {isRTL ? 'تنبيهات النظام' : 'System Alerts'}
            </h2>
          </div>

          {systemAlerts.length > 0 ? (
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border-2 ${
                    alert.severity === 'high'
                      ? 'bg-red-500/10 border-red-400/30'
                      : 'bg-amber-500/10 border-amber-400/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.severity === 'high' ? (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-300">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-400">{isRTL ? 'لا توجد تنبيهات' : 'No alerts'}</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">
              {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 font-semibold text-sm">
                      {activity.action}
                    </span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-white font-medium mb-1">{activity.vessel}</p>
                  {activity.wharf && (
                    <p className="text-sm text-blue-300">
                      {isRTL ? 'الرصيف: ' : 'Wharf: '}{activity.wharf}
                    </p>
                  )}
                  {activity.clearanceId && (
                    <p className="text-sm text-blue-300">
                      {isRTL ? 'رقم التصريح: ' : 'Clearance ID: '}{activity.clearanceId}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">{isRTL ? 'لا يوجد نشاط حديث' : 'No recent activity'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
