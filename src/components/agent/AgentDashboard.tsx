import { useState, useEffect } from 'react';
import { Ship, Bell, Anchor, AlertCircle, TrendingUp, Clock, Plus } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { agentService, AgentStats, Activity, Arrival } from '../../services/agentService';

interface AgentDashboardProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function AgentDashboard({ language, onNavigate }: AgentDashboardProps) {
  const t = translations[language]?.agent?.dashboard || translations.en.agent.dashboard;

  const [statsData, setStatsData] = useState<AgentStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingArrivals, setUpcomingArrivals] = useState<Arrival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, activity, arrivals] = await Promise.all([
          agentService.getStats(),
          agentService.getRecentActivity(),
          agentService.getUpcomingArrivals()
        ]);

        setStatsData(stats);
        setRecentActivity(activity);
        setUpcomingArrivals(arrivals);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      label: t.activeVessels,
      value: statsData?.activeVessels.toString() || '0',
      icon: Ship,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    },
    {
      label: t.pendingArrivals,
      value: upcomingArrivals.filter(a => a.status === 'pending').length.toString(),
      icon: Bell,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-400/30'
    },
    {
      label: t.anchorageRequests,
      value: statsData?.pendingClearances.toString() || '0',
      icon: Anchor,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30'
    },
    {
      label: t.alerts,
      value: statsData?.notifications.toString() || '0',
      icon: AlertCircle,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/30'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100/50 border-green-200 text-green-700'; // Darker text for light mode
      case 'rejected':
        return 'bg-red-100/50 border-red-200 text-red-700';
      case 'pending':
        return 'bg-amber-100/50 border-amber-200 text-amber-700'; // Darker text for light mode
      default:
        return 'bg-blue-100/50 border-blue-200 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
          <p className="text-[var(--text-secondary)]">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--secondary)] rounded-2xl px-4 py-2 shadow-sm">
          <Clock className="w-5 h-5 text-[var(--primary)]" />
          <span className="text-[var(--text-primary)] text-sm font-medium">
            {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 hover:border-[var(--primary)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg shadow-${stat.color.split(' ')[0].replace('from-', '')}/20`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">{stat.value}</div>
              <div className="text-[var(--text-secondary)] text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t.quickActions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('arrivals')}
            className="flex items-center gap-4 p-4 border border-[var(--secondary)] hover:border-[var(--primary)] rounded-2xl transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-card)]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-[var(--text-primary)] font-bold group-hover:text-blue-600 transition-colors">{t.submitArrival}</div>
              <div className="text-[var(--text-secondary)] text-sm">{t.submitArrivalDesc}</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('anchorage')}
            className="flex items-center gap-4 p-4 border border-[var(--secondary)] hover:border-[var(--primary)] rounded-2xl transition-all duration-300 hover:shadow-md group bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-card)]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-[var(--text-primary)] font-bold group-hover:text-blue-600 transition-colors">{t.requestAnchorage}</div>
              <div className="text-[var(--text-secondary)] text-sm">{t.requestAnchorageDesc}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t.recentActivity}</h2>
            <button
              onClick={() => onNavigate('tracker')}
              className="text-[var(--accent)] text-sm hover:underline"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-[var(--text-secondary)] text-sm p-4 text-center border border-dashed border-[var(--secondary)] rounded-xl">
                {t.noRecentActivity || "No recent activity"}
              </div>
            ) : recentActivity.map((activity) => (
              <div key={activity.id} className="border border-[var(--secondary)] rounded-xl p-4 hover:border-[var(--primary)] hover:bg-[var(--bg-card)] transition-all duration-300 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)] font-medium mb-1">{activity.action}</div>
                    <div className="text-[var(--text-secondary)] text-sm">{activity.details}</div>
                  </div>
                </div>
                <div className="text-[var(--text-secondary)] text-xs mt-2 border-t border-[var(--secondary)] pt-2">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Arrivals */}
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t.upcomingArrivals}</h2>
            <button
              onClick={() => onNavigate('vessels')}
              className="text-[var(--accent)] text-sm hover:underline"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="space-y-3">
            {upcomingArrivals.length === 0 ? (
              <div className="text-[var(--text-secondary)] text-sm p-4 text-center border border-dashed border-[var(--secondary)] rounded-md">
                {t.noUpcomingArrivals || "No upcoming arrivals"}
              </div>
            ) : upcomingArrivals.map((arrival) => (
              <div key={arrival.id} className="border border-[var(--secondary)] rounded-xl p-4 hover:border-[var(--primary)] hover:bg-[var(--bg-card)] transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Ship className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">{arrival.vessel_name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{language === 'ar' ? 'الوصول المتوقع' : 'ETA'}: {new Date(arrival.eta).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(arrival.status)}`}>
                    {getStatusLabel(arrival.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
