import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Package, BoxSelect, FileText, AlertTriangle, RefreshCw, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { traderService, TraderStats } from '../../services/traderService';

interface TraderDashboardProps {
  language: Language;
  userEmail: string;
}

// TraderStats interface is imported from service

export function TraderDashboard({ language, userEmail }: TraderDashboardProps) {
  const isRTL = language === 'ar';
  const [stats, setStats] = useState<TraderStats>({
    arrived: 0,
    stored: 0,
    readyForDischarge: 0,
    unreadNotifications: 0,
    pendingDischarges: 0,
    statusChangeAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsData = await traderService.getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading trader dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setInitializing(true);
    try {
      await traderService.initializeData(userEmail);
      await loadDashboardData();
    } catch (error) {
      console.error('Error initializing trader data:', error);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userEmail]);

  const statCards = [
    {
      title: isRTL ? 'حاويات وصلت' : 'Arrived',
      value: stats.arrived,
      icon: Package,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-400/30',
      textColor: 'text-blue-300'
    },
    {
      title: isRTL ? 'حاويات مخزنة' : 'Stored',
      value: stats.stored,
      icon: BoxSelect,
      color: 'from-emerald-400 to-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-400/30',
      textColor: 'text-emerald-300'
    },
    {
      title: isRTL ? 'جاهزة للتفريغ' : 'Ready for Discharge',
      value: stats.readyForDischarge,
      icon: CheckCircle2,
      color: 'from-teal-400 to-teal-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-400/30',
      textColor: 'text-teal-300'
    },
    {
      title: isRTL ? 'إشعارات غير مقروءة' : 'Unread Notifications',
      value: stats.unreadNotifications,
      icon: AlertTriangle,
      color: 'from-amber-400 to-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-400/30',
      textColor: 'text-amber-300'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'لوحة تحكم التاجر' : 'Trader Dashboard'}
            </h1>
            <p className="text-emerald-200/70">
              {isRTL ? 'نظرة عامة على الحاويات وحالة التفريغ' : 'Overview of containers and discharge status'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
            </button>
            <button
              onClick={initializeData}
              disabled={initializing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 transition-all disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              <span className="text-sm">{isRTL ? 'تهيئة البيانات' : 'Initialize Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-white/5 backdrop-blur-xl border ${stat.borderColor} rounded-2xl p-6 hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                {stat.value > 0 && (
                  <div className="flex items-center gap-1 text-xs text-emerald-300">
                    <TrendingUp className="w-3 h-3" />
                    <span>{isRTL ? 'نشط' : 'Active'}</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className={`text-sm ${stat.textColor}`}>{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* Status Alerts */}
      {stats.statusChangeAlerts > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {isRTL ? 'تحديثات الحالة' : 'Status Updates'}
              </h3>
              <p className="text-amber-200/80 mb-3">
                {isRTL
                  ? `لديك ${stats.statusChangeAlerts} تنبيهات جديدة حول تغييرات حالة الحاوية`
                  : `You have ${stats.statusChangeAlerts} new alerts about container status changes`}
              </p>
              <button className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-lg text-amber-200 text-sm transition-all">
                {isRTL ? 'عرض التفاصيل' : 'View Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pending Discharges Card */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-400/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isRTL ? 'طلبات التفريغ المعلقة' : 'Pending Discharge Requests'}
              </h3>
              <p className="text-emerald-200/60 text-sm">
                {isRTL ? 'في انتظار الموافقة' : 'Awaiting approval'}
              </p>
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-4">{stats.pendingDischarges}</div>
          <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 text-sm transition-all">
            {isRTL ? 'عرض الطلبات' : 'View Requests'}
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
              </h3>
              <p className="text-blue-200/60 text-sm">
                {isRTL ? 'آخر التحديثات' : 'Latest updates'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-blue-200/60 text-sm">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : stats.readyForDischarge > 0 || stats.arrived > 0 ? (
              <>
                {stats.readyForDischarge > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span className="text-blue-200">
                      {isRTL ? `${stats.readyForDischarge} حاوية جاهزة للتفريغ` : `${stats.readyForDischarge} containers ready for discharge`}
                    </span>
                  </div>
                )}
                {stats.arrived > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-200">
                      {isRTL ? `${stats.arrived} حاوية وصلت حديثاً` : `${stats.arrived} containers recently arrived`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-blue-200/60 text-sm">
                {isRTL ? 'لا يوجد نشاط حديث' : 'No recent activity'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container Summary Legend */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {isRTL ? 'دليل حالة الحاوية' : 'Container Status Legend'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <span className="text-blue-300 text-sm font-medium">{isRTL ? 'وصلت' : 'Arrived'}</span>
            </div>
            <span className="text-blue-200/60 text-sm">
              {isRTL ? 'وصلت إلى الميناء' : 'Container arrived at port'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
              <span className="text-emerald-300 text-sm font-medium">{isRTL ? 'مخزنة' : 'Stored'}</span>
            </div>
            <span className="text-emerald-200/60 text-sm">
              {isRTL ? 'تم تعيين موقع التخزين' : 'Assigned to storage location'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-lg">
              <span className="text-teal-300 text-sm font-medium">{isRTL ? 'جاهزة' : 'Ready'}</span>
            </div>
            <span className="text-teal-200/60 text-sm">
              {isRTL ? 'جاهزة للتفريغ' : 'Ready for discharge'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
