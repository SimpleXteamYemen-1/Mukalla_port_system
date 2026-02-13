import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp, Ship, Anchor, BarChart3, RefreshCw } from 'lucide-react';
import { executiveService, ExecutiveStats, PendingApproval, RecentDecision } from '../../services/executiveService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface ExecutiveDashboardProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function ExecutiveDashboard({ language, onNavigate }: ExecutiveDashboardProps) {
  const t = translations[language]?.executive?.dashboard || translations.en.executive.dashboard;

  const [statsData, setStatsData] = useState<ExecutiveStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<RecentDecision[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, approvals, decisions] = await Promise.all([
        executiveService.getDashboardStats(),
        executiveService.getPendingApprovals(),
        executiveService.getRecentDecisions()
      ]);
      setStatsData(stats);
      setPendingApprovals(approvals);
      setRecentDecisions(decisions);
    } catch (error) {
      console.error("Failed to load executive dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    {
      label: t.pendingApprovals,
      value: statsData?.pending_approvals.toString() || '0',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-400/30',
      trend: ''
    },
    {
      label: t.blockedRequests,
      value: statsData?.blocked_requests.toString() || '0',
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/30',
      trend: ''
    },
    {
      label: t.approvalRate,
      value: statsData?.approval_rate || '0%',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30',
      trend: ''
    },
    {
      label: t.todayDecisions,
      value: statsData?.today_decisions.toString() || '0',
      icon: CheckCircle2,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30',
      trend: ''
    },
  ];

  const blockedRequests: any[] = []; // Mock empty for now as backend returns 0 count

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'medium': return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      case 'low': return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
      default: return 'bg-gray-500/20 border-gray-400/30 text-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      high: { ar: 'عاجل', en: 'High' },
      medium: { ar: 'متوسط', en: 'Medium' },
      low: { ar: 'منخفض', en: 'Low' },
    };
    return labels[priority]?.[language] || priority;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      arrival: { ar: 'وصول', en: 'Arrival' },
      anchorage: { ar: 'رسو', en: 'Anchorage' },
    };
    return labels[type]?.[language] || type;
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
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
                <span className="text-green-400 text-sm font-medium">{stat.trend}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-blue-200 text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">{t.quickApprovals}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('arrivals')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-white font-semibold">{t.arrivalApprovals}</div>
              <div className="text-blue-200 text-sm">8 {t.pending}</div>
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
              <div className="text-white font-semibold">{t.anchorageApprovals}</div>
              <div className="text-blue-200 text-sm">4 {t.pending}</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-400/30 rounded-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-white font-semibold">{t.viewReports}</div>
              <div className="text-blue-200 text-sm">{t.analytics}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">{t.pendingApprovals}</h2>
          <div className="space-y-3">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{approval.id}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs border ${getPriorityColor(approval.priority)}`}>
                        {getPriorityLabel(approval.priority)}
                      </span>
                    </div>
                    <div className="text-blue-200 text-sm">{approval.vessel}</div>
                    <div className="text-blue-300/70 text-xs mt-1">{approval.agent}</div>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-lg text-xs bg-blue-500/20 border border-blue-400/30 text-blue-200">
                    {getTypeLabel(approval.type)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-200 text-sm transition-colors">
                    {t.approve}
                  </button>
                  <button className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 text-sm transition-colors">
                    {t.reject}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('arrivals')}
            className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
          >
            {t.viewAll}
          </button>
        </div>

        {/* Blocked Requests Alert */}
        <div className="space-y-6">
          <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-400/30 p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-300 flex-shrink-0" />
              <div>
                <h3 className="text-red-200 font-semibold mb-1">{t.blockedRequests}</h3>
                <p className="text-red-200/80 text-sm">{t.blockedMessage}</p>
              </div>
            </div>
            <div className="space-y-2">
              {blockedRequests.map((request) => (
                <div key={request.id} className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-red-200 font-medium text-sm">{request.id} - {request.vessel}</div>
                      <div className="text-red-200/70 text-xs mt-1">{request.reason}</div>
                    </div>
                    <button className="text-red-300 hover:text-white text-xs transition-colors">
                      {t.review}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">{t.recentDecisions}</h2>
            <div className="space-y-2">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{decision.id} - {decision.vessel}</div>
                      <div className="text-blue-300 text-xs mt-1">{decision.time}</div>
                    </div>
                    {decision.decision === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              {t.viewAllDecisions}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
