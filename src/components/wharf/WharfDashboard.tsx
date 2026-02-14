import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Package, BoxSelect, AlertTriangle, TrendingUp, RefreshCw, Database } from 'lucide-react';
import { wharfService, WharfStats, WharfAlert } from '../../services/wharfService';
import { toast } from 'react-toastify';
import { StatCard } from '../ui/StatCard';
import { PageHeader } from '../ui/PageHeader';

interface WharfDashboardProps {
  language: Language;
}

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
      toast.error(isRTL ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setInitializing(true);
    try {
      await wharfService.initializeData();
      await loadDashboardData();
      toast.success(isRTL ? 'تم تهيئة البيانات بنجاح' : 'Data initialized successfully');
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error(isRTL ? 'فشل تهيئة البيانات' : 'Failed to initialize data');
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
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      {/* Header */}
      <PageHeader
        title={isRTL ? 'لوحة تحكم الأرصفة والتخزين' : 'Wharf & Storage Dashboard'}
        subtitle={isRTL ? 'نظرة عامة على العمليات' : 'Operations Overview'}
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
            icon: Database,
            onClick: initializeData,
            loading: initializing,
            variant: 'primary'
          }
        ]}
      />

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label={isRTL ? 'طلبات توفر معلقة' : 'Pending Availability'}
          value={stats.pendingAvailability}
          icon={Anchor}
          color="amber"
          language={language}
          trend={{ value: isRTL ? 'تتطلب مراجعة' : 'Requires review', direction: 'neutral' }}
        />

        <StatCard
          label={isRTL ? 'حالة الأرصفة' : 'Wharf Status'}
          value={stats.approvedWharves}
          icon={Anchor}
          color="blue"
          language={language}
          trend={{ value: `${stats.occupiedWharves} ${isRTL ? 'محتل' : 'occupied'}`, direction: 'neutral' }}
        />

        <div className="card-base p-6 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
              <Package className="w-8 h-8 text-purple-500" />
            </div>
            <span className="text-4xl font-black text-[var(--text-primary)]">{storagePercentage}%</span>
          </div>
          <h3 className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wide mb-3">
            {isRTL ? 'سعة التخزين' : 'Storage Capacity'}
          </h3>
          <div className="w-full bg-[var(--secondary)]/30 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[var(--text-secondary)] text-xs font-medium">
            <span className="font-bold text-[var(--text-primary)]">{stats.storageUsed}</span> / {stats.storageUsed + stats.storageAvailable} {isRTL ? 'مستخدم' : 'used'}
          </p>
        </div>

        <StatCard
          label={isRTL ? 'حاويات في الانتظار' : 'Containers Awaiting'}
          value={stats.containersAwaiting}
          icon={BoxSelect}
          color="green"
          language={language}
          trend={{ value: isRTL ? 'تتطلب تعيين' : 'Requires assignment', direction: 'neutral' }}
        />

        <StatCard
          label={isRTL ? 'اتجاه السعة' : 'Capacity Trend'}
          value="+12%"
          icon={TrendingUp}
          color="indigo"
          language={language}
          trend={{ value: isRTL ? 'آخر 7 أيام' : 'Last 7 days', direction: 'up' }}
        />

        <StatCard
          label={isRTL ? 'التنبيهات النشطة' : 'Active Alerts'}
          value={alerts.length}
          icon={AlertTriangle}
          color="orange"
          language={language}
          trend={{ value: isRTL ? 'تتطلب اهتمام' : 'Requires attention', direction: 'neutral' }}
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card-base p-6">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            {isRTL ? 'تنبيهات النظام' : 'System Alerts'}
          </h2>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border-l-4 shadow-sm ${alert.type === 'critical'
                  ? 'bg-red-500/5 border-l-red-500 border-y border-r border-red-500/10'
                  : 'bg-amber-500/5 border-l-amber-500 border-y border-r border-amber-500/10'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${alert.type === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-bold text-lg">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.pendingAvailability === 0 && stats.containersAwaiting === 0 && (
        <div className="card-base p-12 text-center border-dashed border-2 border-[var(--border)] bg-[var(--surface)]/50">
          <Package className="w-16 h-16 text-[var(--text-secondary)]/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
            {isRTL ? 'لا توجد إجراءات معلقة' : 'No Pending Actions'}
          </h3>
          <p className="text-[var(--text-secondary)] font-medium max-w-md mx-auto">
            {isRTL
              ? 'جميع الطلبات تمت معالجتها. انقر على "تهيئة البيانات" لإنشاء بيانات عينة.'
              : 'All requests have been processed. Click "Initialize Data" to create sample data.'}
          </p>
        </div>
      )}
    </div>
  );
}
