import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Ship, Anchor, FileText, Calendar, User as UserIcon } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface RequestStatusTrackerProps {
  language: Language;
  onNavigate: (page: string) => void;
}

interface TimelineStep {
  step: string;
  date: string;
  user: string;
  status: 'completed' | 'pending' | 'rejected';
}

interface RequestItem {
  id: string;
  type: 'arrival' | 'anchorage' | 'manifest';
  vessel: string;
  title: string;
  submittedDate: string;
  status: 'approved' | 'pending' | 'rejected' | 'completed';
  completedDate?: string;
  rejectionReason?: string;
  icon?: any; // LucideIcon type is hard to import sometimes, using any for icon component or generic
  timeline: TimelineStep[];
}

export function RequestStatusTracker({ language, onNavigate }: RequestStatusTrackerProps) {
  const t = translations[language]?.agent?.tracker || translations.en.agent.tracker;
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await agentService.getTrackerData();
        // Map icons based on type
        const mapped = data.map((item: any): RequestItem => ({
          ...item,
          icon: item.type === 'arrival' ? Ship : (item.type === 'anchorage' ? Anchor : FileText),
        }));
        setAllRequests(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-amber-600 animate-pulse" />;
      default:
        return <Clock className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100/50 border-green-200 text-green-700';
      case 'rejected':
        return 'bg-red-100/50 border-red-200 text-red-700';
      case 'pending':
        return 'bg-amber-100/50 border-amber-200 text-amber-700';
      default:
        return 'bg-blue-100/50 border-blue-200 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      completed: { ar: 'مكتمل', en: 'Completed' },
    };
    return labels[status]?.[language] || status;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'arrival':
        return 'from-blue-400 to-cyan-500';
      case 'anchorage':
        return 'from-purple-400 to-pink-500';
      case 'manifest':
        return 'from-green-400 to-emerald-500';
      default:
        return 'from-blue-400 to-cyan-500';
    }
  };

  const stats = {
    total: allRequests.length,
    approved: allRequests.filter(r => r.status === 'approved' || r.status === 'completed').length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
        <p className="text-[var(--text-secondary)]">{t.subtitle}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-4 shadow-sm">
          <div className="text-[var(--text-secondary)] text-sm mb-1">{t.totalRequests}</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 rounded-2xl border border-green-500/20 p-4">
          <div className="text-green-700 text-sm mb-1">{t.approved}</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.approved}</div>
        </div>
        <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-4">
          <div className="text-amber-700 text-sm mb-1">{t.pending}</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.pending}</div>
        </div>
        <div className="bg-red-500/10 rounded-2xl border border-red-500/20 p-4">
          <div className="text-red-700 text-sm mb-1">{t.rejected}</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.rejected}</div>
        </div>
      </div>

      {/* Unified Timeline */}
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">{t.unifiedTimeline}</h2>

        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-10">Loading requests...</div>
        ) : (
          <div className="relative">
            {/* Timeline Vertical Line */}
            <div className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-0 bottom-0 w-0.5 bg-[var(--secondary)]`}></div>

            <div className="space-y-6">
              {allRequests.map((request) => {
                const Icon = request.icon || Clock;
                return (
                  <div key={request.id} className="relative">
                    {/* Timeline Node */}
                    <div className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} w-12 h-12 bg-gradient-to-br ${getTypeColor(request.type)} rounded-full flex items-center justify-center shadow-sm z-10`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content Card */}
                    <div className={`${language === 'ar' ? 'mr-16' : 'ml-16'} bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-5 hover:border-[var(--primary)] transition-all hover:shadow-md`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-[var(--text-primary)] font-bold text-lg">{request.title}</h3>
                            <span className="text-[var(--text-secondary)] text-sm">#{request.id}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
                            <Ship className="w-4 h-4" />
                            <span>{request.vessel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]/70 text-xs">
                            <Calendar className="w-4 h-4" />
                            <span>{t.submitted}: {request.submittedDate}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          {request.completedDate && (
                            <span className="text-[var(--text-secondary)]/70 text-xs">{request.completedDate}</span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-red-200 font-semibold text-xs mb-1">{t.rejectionReason}</div>
                              <div className="text-red-200/80 text-xs">{request.rejectionReason}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mini Timeline */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {request.timeline.map((step, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${step.status === 'completed'
                              ? 'bg-green-100/50 text-green-700'
                              : step.status === 'pending'
                                ? 'bg-amber-100/50 text-amber-700'
                                : step.status === 'rejected'
                                  ? 'bg-red-100/50 text-red-700'
                                  : 'bg-[var(--secondary)]/20 text-[var(--text-primary)]'
                              }`}>
                              {step.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                              {step.status === 'pending' && <Clock className="w-3 h-3" />}
                              {step.status === 'rejected' && <XCircle className="w-3 h-3" />}
                              <span>{step.step}</span>
                            </div>
                            {index < request.timeline.length - 1 && (
                              <div className="w-2 h-0.5 bg-[var(--secondary)]"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Detailed Timeline Expansion */}
                      <details className="mt-3 group">
                        <summary className="cursor-pointer text-[var(--accent)] text-sm hover:underline transition-colors list-none flex items-center gap-2">
                          <span>{t.viewDetails}</span>
                          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--secondary)] p-4">
                          <div className="space-y-3">
                            {request.timeline.map((step, index) => (
                              <div key={index} className="flex items-start gap-3 pb-3 border-b border-[var(--secondary)] last:border-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'completed'
                                  ? 'bg-green-100/50 border border-green-200'
                                  : step.status === 'pending'
                                    ? 'bg-amber-100/50 border border-amber-200'
                                    : step.status === 'rejected'
                                      ? 'bg-red-100/50 border border-red-200'
                                      : 'bg-[var(--secondary)]/20 border border-[var(--secondary)]'
                                  }`}>
                                  {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                                  {step.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                                  {step.status === 'rejected' && <XCircle className="w-3 h-3 text-red-600" />}
                                </div>
                                <div className="flex-1">
                                  <div className="text-[var(--text-primary)] text-sm font-medium">{step.step}</div>
                                  {step.date && (
                                    <div className="text-[var(--text-secondary)] text-xs mt-1">{step.date}</div>
                                  )}
                                  {step.user && (
                                    <div className="flex items-center gap-1 text-[var(--text-secondary)]/70 text-xs mt-1">
                                      <UserIcon className="w-3 h-3" />
                                      <span>{step.user}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
