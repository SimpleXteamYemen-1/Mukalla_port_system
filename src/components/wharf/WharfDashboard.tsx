import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Package, BoxSelect, AlertTriangle, TrendingUp, RefreshCw, Database } from 'lucide-react';
import { wharfService, WharfStats, WharfAlert } from '../../services/wharfService';

interface WharfDashboardProps {
  language: Language;
}

// WharfStats and Alert interfaces are imported from service

export function WharfDashboard({ language }: WharfDashboardProps) {
  const isRTL = language === 'ar';
  const [stats, setStats] = useState<WharfStats>({
    pendingAvailability: 0,
    approvedWharves: 0,
    occupiedWharves: 0,
    storageUsed: 0,
    storageAvailable: 0,
    containersAwaiting: 0
  });
  const [alerts, setAlerts] = useState<WharfAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, alertsData] = await Promise.all([
        wharfService.getDashboardStats(),
        wharfService.getAlerts()
      ]);

      setStats(statsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setInitializing(true);
    try {
      await wharfService.initializeData();
      await loadDashboardData();
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const storagePercentage = stats.storageAvailable > 0
    ? Math.round((stats.storageUsed / (stats.storageUsed + stats.storageAvailable)) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'لوحة تحكم الأرصفة والتخزين' : 'Wharf & Storage Dashboard'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'نظرة عامة على العمليات' : 'Operations Overview'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
          <button
            onClick={initializeData}
            disabled={initializing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
          >
            <Database className={`w-4 h-4 ${initializing ? 'animate-spin' : ''}`} />
            {isRTL ? 'تهيئة البيانات' : 'Initialize Data'}
          </button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Availability */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/30 rounded-xl">
              <Anchor className="w-6 h-6 text-amber-300" />
            </div>
            <span className="text-3xl font-bold text-white">{stats.pendingAvailability}</span>
          </div>
          <h3 className="text-amber-200 font-semibold mb-1">
            {isRTL ? 'طلبات توفر معلقة' : 'Pending Availability'}
          </h3>
          <p className="text-amber-300/70 text-sm">
            {isRTL ? 'تتطلب مراجعة' : 'Requires review'}
          </p>
        </div>

        {/* Wharf Status */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/30 rounded-xl">
              <Anchor className="w-6 h-6 text-blue-300" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.approvedWharves}</div>
              <div className="text-sm text-blue-300">
                {isRTL ? 'معتمد' : 'Approved'}
              </div>
            </div>
          </div>
          <h3 className="text-blue-200 font-semibold mb-1">
            {isRTL ? 'حالة الأرصفة' : 'Wharf Status'}
          </h3>
          <p className="text-blue-300/70 text-sm">
            {stats.occupiedWharves} {isRTL ? 'محتل' : 'occupied'}
          </p>
        </div>

        {/* Storage Capacity */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/30 rounded-xl">
              <Package className="w-6 h-6 text-purple-300" />
            </div>
            <span className="text-3xl font-bold text-white">{storagePercentage}%</span>
          </div>
          <h3 className="text-purple-200 font-semibold mb-1">
            {isRTL ? 'سعة التخزين' : 'Storage Capacity'}
          </h3>
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-purple-300/70 text-sm">
            {stats.storageUsed} / {stats.storageUsed + stats.storageAvailable} {isRTL ? 'مستخدم' : 'used'}
          </p>
        </div>

        {/* Containers Awaiting */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/30 rounded-xl">
              <BoxSelect className="w-6 h-6 text-green-300" />
            </div>
            <span className="text-3xl font-bold text-white">{stats.containersAwaiting}</span>
          </div>
          <h3 className="text-green-200 font-semibold mb-1">
            {isRTL ? 'حاويات في الانتظار' : 'Containers Awaiting'}
          </h3>
          <p className="text-green-300/70 text-sm">
            {isRTL ? 'تتطلب تعيين' : 'Requires assignment'}
          </p>
        </div>

        {/* Capacity Trend */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-6 border border-indigo-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-300" />
            </div>
            <span className="text-3xl font-bold text-white">+12%</span>
          </div>
          <h3 className="text-indigo-200 font-semibold mb-1">
            {isRTL ? 'اتجاه السعة' : 'Capacity Trend'}
          </h3>
          <p className="text-indigo-300/70 text-sm">
            {isRTL ? 'آخر 7 أيام' : 'Last 7 days'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-300" />
            </div>
            <span className="text-3xl font-bold text-white">{alerts.length}</span>
          </div>
          <h3 className="text-orange-200 font-semibold mb-1">
            {isRTL ? 'التنبيهات النشطة' : 'Active Alerts'}
          </h3>
          <p className="text-orange-300/70 text-sm">
            {isRTL ? 'تتطلب اهتمام' : 'Requires attention'}
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            {isRTL ? 'تنبيهات النظام' : 'System Alerts'}
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${alert.type === 'critical'
                    ? 'bg-red-500/20 border-red-400/40'
                    : 'bg-amber-500/20 border-amber-400/40'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`} />
                  <div className="flex-1">
                    <p className="text-white font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.pendingAvailability === 0 && stats.containersAwaiting === 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isRTL ? 'لا توجد إجراءات معلقة' : 'No Pending Actions'}
          </h3>
          <p className="text-gray-400">
            {isRTL
              ? 'جميع الطلبات تمت معالجتها. انقر على "تهيئة البيانات" لإنشاء بيانات عينة.'
              : 'All requests have been processed. Click "Initialize Data" to create sample data.'}
          </p>
        </div>
      )}
    </div>
  );
}
