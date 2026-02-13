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
      case 'approved': return 'bg-green-500/20 border-green-400/30 text-green-200';
      case 'rejected': return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'pending': return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      default: return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
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
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-blue-200">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-300" />
          <span className="text-blue-200 text-sm">
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
            <div key={stat.label} className={`bg-white/10 backdrop-blur-xl rounded-2xl border ${stat.borderColor} p-6 hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-blue-200 text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">{t.quickActions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('arrivals')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-white font-semibold">{t.submitArrival}</div>
              <div className="text-blue-200 text-sm">{t.submitArrivalDesc}</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('anchorage')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 rounded-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-white font-semibold">{t.requestAnchorage}</div>
              <div className="text-blue-200 text-sm">{t.requestAnchorageDesc}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">{t.recentActivity}</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-blue-200 text-sm p-4">{t.noRecentActivity || "No recent activity"}</div>
            ) : recentActivity.map((activity) => (
              <div key={activity.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{activity.action}</div>
                    <div className="text-blue-300 text-sm">{activity.details}</div>
                  </div>
                  {/* Status badge might not apply to general activity unless we map it */}
                </div>
                <div className="text-blue-200 text-xs">{new Date(activity.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('tracker')}
            className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
          >
            {t.viewAll}
          </button>
        </div>

        {/* Upcoming Arrivals */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">{t.upcomingArrivals}</h2>
          <div className="space-y-3">
            {upcomingArrivals.length === 0 ? (
              <div className="text-blue-200 text-sm p-4">{t.noUpcomingArrivals || "No upcoming arrivals"}</div>
            ) : upcomingArrivals.map((arrival) => (
              <div key={arrival.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Ship className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{arrival.vessel_name}</div>
                      <div className="text-blue-300 text-xs">{language === 'ar' ? 'الوصول المتوقع' : 'ETA'}: {arrival.eta}</div>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs border ${getStatusColor(arrival.status)}`}>
                    {getStatusLabel(arrival.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('vessels')}
            className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
          >
            {t.viewAll}
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-400/30 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-200 font-semibold mb-2">{t.alertTitle}</h3>
            <p className="text-red-200/80 text-sm mb-3">{t.alertMessage}</p>
            <button
              onClick={() => onNavigate('tracker')}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 text-sm transition-colors"
            >
              {t.viewDetails}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
