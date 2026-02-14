import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Package, BoxSelect, FileText, AlertTriangle, RefreshCw, CheckCircle2, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { traderService, TraderStats } from '../../services/traderService';
import { StatCard } from '../ui/StatCard';
import { PageHeader } from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';

interface TraderDashboardProps {
  language: Language;
  userEmail: string;
}

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
      color: 'blue' as const,
      trend: { value: isRTL ? 'نشط' : 'Active', direction: 'neutral' as const }
    },
    {
      title: isRTL ? 'حاويات مخزنة' : 'Stored',
      value: stats.stored,
      icon: BoxSelect,
      color: 'emerald' as const,
      trend: { value: '', direction: 'neutral' as const }
    },
    {
      title: isRTL ? 'جاهزة للتفريغ' : 'Ready for Discharge',
      value: stats.readyForDischarge,
      icon: CheckCircle2,
      color: 'teal' as const,
      trend: { value: '', direction: 'neutral' as const }
    },
    {
      title: isRTL ? 'إشعارات غير مقروءة' : 'Unread Notifications',
      value: stats.unreadNotifications,
      icon: AlertTriangle,
      color: 'amber' as const,
      trend: { value: '', direction: 'neutral' as const }
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      {/* Header */}
      <PageHeader
        title={isRTL ? 'لوحة تحكم التاجر' : 'Trader Dashboard'}
        subtitle={isRTL ? 'نظرة عامة على الحاويات وحالة التفريغ' : 'Overview of containers and discharge status'}
        language={language}
        actions={[
          {
            label: isRTL ? 'تحديث' : 'Refresh',
            icon: RefreshCw,
            onClick: loadDashboardData,
            loading: loading,
            variant: 'secondary'
          },
          {
            label: isRTL ? 'تهيئة البيانات' : 'Initialize Data',
            icon: Package,
            onClick: initializeData,
            loading: initializing,
            variant: 'primary'
          }
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            language={language}
            trend={stat.value > 0 && stat.trend.value ? stat.trend : undefined}
          />
        ))}
      </div>

      {/* Status Alerts */}
      {stats.statusChangeAlerts > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {isRTL ? 'تحديثات الحالة' : 'Status Updates'}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-3 font-medium">
                {isRTL
                  ? `لديك ${stats.statusChangeAlerts} تنبيهات جديدة حول تغييرات حالة الحاوية`
                  : `You have ${stats.statusChangeAlerts} new alerts about container status changes`}
              </p>
              <button className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm font-bold transition-all">
                {isRTL ? 'عرض التفاصيل' : 'View Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Discharges Card */}
        <div className="card-base p-6 group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <FileText className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                {isRTL ? 'طلبات التفريغ المعلقة' : 'Pending Discharge Requests'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mt-1">
                {isRTL ? 'في انتظار الموافقة' : 'Awaiting approval'}
              </p>
            </div>
          </div>
          <div className="text-5xl font-black text-[var(--text-primary)] mb-6">{stats.pendingDischarges}</div>
          <button className="w-full flex items-center justify-between px-6 py-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-bold text-sm transition-all group-hover:border-emerald-500/30">
            {isRTL ? 'عرض الطلبات' : 'View Requests'}
            <ArrowRight className={`w-4 h-4 text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Recent Activity */}
        <div className="card-base p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mt-1">
                {isRTL ? 'آخر التحديثات' : 'Latest updates'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-[var(--text-secondary)] text-sm font-medium animate-pulse">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : stats.readyForDischarge > 0 || stats.arrived > 0 ? (
              <>
                {stats.readyForDischarge > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                    <span className="text-[var(--text-primary)] text-sm font-medium">
                      {isRTL ? `${stats.readyForDischarge} حاوية جاهزة للتفريغ` : `${stats.readyForDischarge} containers ready for discharge`}
                    </span>
                  </div>
                )}
                {stats.arrived > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[var(--text-primary)] text-sm font-medium">
                      {isRTL ? `${stats.arrived} حاوية وصلت حديثاً` : `${stats.arrived} containers recently arrived`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-[var(--text-secondary)] text-sm font-medium italic text-center py-4">
                {isRTL ? 'لا يوجد نشاط حديث' : 'No recent activity'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container Summary Legend */}
      <div className="card-base p-6">
        <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 pb-2 border-b border-[var(--border)] w-fit">
          {isRTL ? 'دليل حالة الحاوية' : 'Container Status Legend'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 rounded-2xl border border-[var(--border)] transition-colors">
            <StatusBadge status="arrived" type="info" label={isRTL ? 'وصلت' : 'Arrived'} />
            <span className="text-[var(--text-secondary)] text-xs font-medium">
              {isRTL ? 'وصلت إلى الميناء' : 'Container arrived at port'}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 rounded-2xl border border-[var(--border)] transition-colors">
             <StatusBadge status="stored" type="success" label={isRTL ? 'مخزنة' : 'Stored'} />
            <span className="text-[var(--text-secondary)] text-xs font-medium">
              {isRTL ? 'تم تعيين موقع التخزين' : 'Assigned to storage location'}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 rounded-2xl border border-[var(--border)] transition-colors">
            <StatusBadge status="ready" type="active" label={isRTL ? 'جاهزة' : 'Ready'} />
            <span className="text-[var(--text-secondary)] text-xs font-medium">
              {isRTL ? 'جاهزة للتفريغ' : 'Ready for discharge'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
