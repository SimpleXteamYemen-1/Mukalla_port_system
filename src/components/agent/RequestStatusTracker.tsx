import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Ship, Anchor, FileText, Calendar, Loader2 } from 'lucide-react';
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
  icon?: any;
  timeline: TimelineStep[];
}

export function RequestStatusTracker({ language }: RequestStatusTrackerProps) {
  const t = translations[language]?.agent?.tracker || translations.en.agent.tracker;
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await agentService.getTrackerData();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'status-success';
      case 'rejected':
        return 'status-danger';
      case 'pending':
        return 'status-warning';
      default:
        return 'status-info';
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
      case 'arrival': return 'from-blue-600 via-blue-500 to-cyan-500';
      case 'anchorage': return 'from-purple-600 via-purple-500 to-pink-500';
      case 'manifest': return 'from-emerald-600 via-emerald-500 to-teal-500';
      default: return 'from-blue-600 to-blue-500';
    }
  };

  const stats = {
    total: allRequests.length,
    approved: allRequests.filter(r => r.status === 'approved' || r.status === 'completed').length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between group">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 cursor-default">{t.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-base p-6 border-b-4 border-b-blue-600 dark:border-b-blue-500 group">
          <div className="text-[var(--text-secondary)] text-xs font-bold mb-2 uppercase tracking-wider group-hover:text-blue-500 transition-colors">{t.totalRequests}</div>
          <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{stats.total}</div>
        </div>
        <div className="card-base p-6 border-b-4 border-b-emerald-600 dark:border-b-emerald-500 group">
          <div className="text-[var(--text-secondary)] text-xs font-bold mb-2 uppercase tracking-wider group-hover:text-emerald-500 transition-colors">{t.approved}</div>
          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</div>
        </div>
        <div className="card-base p-6 border-b-4 border-b-amber-600 dark:border-b-amber-500 group">
          <div className="text-[var(--text-secondary)] text-xs font-bold mb-2 uppercase tracking-wider group-hover:text-amber-500 transition-colors">{t.pending}</div>
          <div className="text-4xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</div>
        </div>
        <div className="card-base p-6 border-b-4 border-b-rose-600 dark:border-b-rose-500 group">
          <div className="text-[var(--text-secondary)] text-xs font-bold mb-2 uppercase tracking-wider group-hover:text-rose-500 transition-colors">{t.rejected}</div>
          <div className="text-4xl font-black text-rose-600 dark:text-rose-400">{stats.rejected}</div>
        </div>
      </div>

      <div className="card-base p-8 relative overflow-hidden">
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3 relative z-10">
          <span className="w-2 h-8 bg-blue-500 rounded-full" />
          {t.unifiedTimeline}
        </h2>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">Synchronizing tracking data...</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className={`absolute ${language === 'ar' ? 'right-7' : 'left-7'} top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--primary)]/20 via-[var(--accent)]/20 to-[var(--success)]/20 rounded-full`} />

            <div className="space-y-10">
              {allRequests.map((request) => {
                const Icon = request.icon || Clock;
                return (
                  <div key={request.id} className="relative group/item">
                    <div className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} w-14 h-14 bg-gradient-to-br ${getTypeColor(request.type)} rounded-2xl flex items-center justify-center shadow-2xl shadow-black/10 z-10 transition-transform duration-500 group-hover/item:scale-110 group-hover/item:rotate-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <div className={`${language === 'ar' ? 'mr-20' : 'ml-20'} card-base card-hover p-6 group-hover/item:border-[var(--primary)]`}>
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-[var(--text-primary)] font-black text-xl">{request.title}</h3>
                            <span className="px-2 py-0.5 bg-[var(--secondary)] rounded-lg text-[var(--text-secondary)] text-xs font-bold font-mono">#{request.id}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium mb-3">
                            <Ship className="w-4 h-4 text-[var(--primary)]" />
                            <span>{request.vessel}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]/70 text-xs text-bold">
                              <Calendar className="w-4 h-4" />
                              <span>{t.submitted}: {request.submittedDate}</span>
                            </div>
                            {request.completedDate && (
                              <div className="flex items-center gap-2 text-[var(--success)] text-xs font-black">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{request.completedDate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`inline-block px-5 py-2 rounded-2xl text-sm font-black border-2 ${getStatusColor(request.status)} shadow-sm`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="mt-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-red-500 font-bold text-sm mb-1 uppercase tracking-wider">
                              {language === 'ar' ? 'ملاحظات الإدارة' : 'Executive Feedback'}
                            </div>
                            <div className="text-red-400 text-sm font-medium">{request.rejectionReason}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        {request.timeline.map((step, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black ${step.status === 'completed' ? 'status-success' :
                              step.status === 'pending' ? 'status-warning' :
                                step.status === 'rejected' ? 'status-danger' :
                                  'bg-[var(--secondary)] text-[var(--text-secondary)]'
                              } border border-transparent hover:border-current transition-all cursor-default`}>
                              <span>{step.step}</span>
                            </div>
                            {index < request.timeline.length - 1 && (
                              <div className="w-4 h-0.5 bg-[var(--secondary)] rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>
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
