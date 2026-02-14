import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp, Ship, Anchor, BarChart3, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { executiveService, ExecutiveStats, PendingApproval, RecentDecision } from '../../services/executiveService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { StatCard } from '../ui/StatCard';
import { PageHeader } from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';

interface ExecutiveDashboardProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function ExecutiveDashboard({ language, onNavigate }: ExecutiveDashboardProps) {
  const t = translations[language]?.executive?.dashboard || translations.en.executive.dashboard;
  const isRTL = language === 'ar';

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
      color: 'amber' as const,
      trend: ''
    },
    {
      label: t.blockedRequests,
      value: statsData?.blocked_requests.toString() || '0',
      icon: AlertTriangle,
      color: 'red' as const,
      trend: ''
    },
    {
      label: t.approvalRate,
      value: statsData?.approval_rate || '0%',
      icon: TrendingUp,
      color: 'emerald' as const,
      trend: ''
    },
    {
      label: t.todayDecisions,
      value: statsData?.today_decisions.toString() || '0',
      icon: CheckCircle2,
      color: 'blue' as const,
      trend: ''
    },
  ];

  const blockedRequests: any[] = [];

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
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      {/* Page Header */}
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        language={language}
        actions={[
          {
            label: '',
            icon: RefreshCw,
            onClick: loadData,
            loading: loading,
            variant: 'secondary'
          },
          {
            label: new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            icon: Clock,
            onClick: () => { },
            variant: 'ghost',
            disabled: true
          }
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            language={language}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-base p-8">
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">{t.quickApprovals}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate('arrivals')}
            className="flex items-center gap-4 p-5 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] hover:border-[var(--primary)] rounded-2xl transition-all transform hover:-translate-y-1 group"
          >
            <div className="p-4 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
              <Ship className="w-8 h-8 text-cyan-500" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-[var(--text-primary)] font-bold text-lg">{t.arrivalApprovals}</div>
              <div className="text-[var(--text-secondary)] font-medium text-sm mt-1">8 {t.pending}</div>
            </div>
            <ArrowRight className={`w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('anchorage')}
            className="flex items-center gap-4 p-5 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] hover:border-[var(--primary)] rounded-2xl transition-all transform hover:-translate-y-1 group"
          >
            <div className="p-4 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <Anchor className="w-8 h-8 text-purple-500" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-[var(--text-primary)] font-bold text-lg">{t.anchorageApprovals}</div>
              <div className="text-[var(--text-secondary)] font-medium text-sm mt-1">4 {t.pending}</div>
            </div>
            <ArrowRight className={`w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-4 p-5 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] hover:border-[var(--primary)] rounded-2xl transition-all transform hover:-translate-y-1 group"
          >
            <div className="p-4 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'} flex-1`}>
              <div className="text-[var(--text-primary)] font-bold text-lg">{t.viewReports}</div>
              <div className="text-[var(--text-secondary)] font-medium text-sm mt-1">{t.analytics}</div>
            </div>
            <ArrowRight className={`w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <div className="card-base p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-black text-[var(--text-primary)]">{t.pendingApprovals}</h2>
            <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold">
              {pendingApprovals.length} {t.pending}
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/5 rounded-2xl border border-[var(--border)] transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[var(--text-primary)] font-bold text-lg">{approval.id}</span>
                      <StatusBadge
                        status={approval.priority}
                        type={approval.priority === 'high' ? 'error' : approval.priority === 'medium' ? 'warning' : 'info'}
                        label={getPriorityLabel(approval.priority)}
                      />
                    </div>
                    <div className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {approval.vessel}
                    </div>
                    <div className="text-[var(--text-secondary)]/70 text-xs mt-1 font-medium">{approval.agent}</div>
                  </div>
                  <StatusBadge
                    status={approval.type}
                    type="info"
                    label={getTypeLabel(approval.type)}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-600 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.approve}
                  </button>
                  <button className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-600 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t.reject}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('arrivals')}
            className="w-full mt-6 py-3 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-bold text-sm transition-colors uppercase tracking-wide"
          >
            {t.viewAll}
          </button>
        </div>

        {/* Blocked Requests Alert & Decisions */}
        <div className="space-y-6">
          <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1">{t.blockedRequests}</h3>
                <p className="text-[var(--text-secondary)] text-sm">{t.blockedMessage}</p>
              </div>
            </div>
            <div className="space-y-3">
              {blockedRequests.map((request) => (
                <div key={request.id} className="bg-white/50 dark:bg-black/20 border border-red-500/10 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-[var(--text-primary)] font-bold text-sm">{request.id} - {request.vessel}</div>
                      <div className="text-red-500/80 text-xs mt-1 font-medium">{request.reason}</div>
                    </div>
                    <button className="text-red-500 hover:text-red-600 text-xs font-bold underline transition-colors">
                      {t.review}
                    </button>
                  </div>
                </div>
              ))}
              {blockedRequests.length === 0 && (
                <div className="text-center py-4 text-[var(--text-secondary)] text-sm font-medium italic">
                  {isRTL ? 'لا توجد طلبات محظورة' : 'No blocked requests'}
                </div>
              )}
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="card-base p-6">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border)]">{t.recentDecisions}</h2>
            <div className="space-y-3">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="p-4 bg-[var(--surface)] hover:bg-[var(--secondary)]/5 rounded-2xl border border-[var(--border)] transition-all flex items-center justify-between group">
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)] text-sm font-bold">{decision.id} - {decision.vessel}</div>
                    <div className="text-[var(--text-secondary)] text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {decision.time}
                    </div>
                  </div>
                  {decision.decision === 'approved' ? (
                    <div className="p-2 bg-emerald-500/10 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-500/10 rounded-full">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="w-full mt-6 py-3 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-bold text-sm transition-colors uppercase tracking-wide"
            >
              {t.viewAllDecisions}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
