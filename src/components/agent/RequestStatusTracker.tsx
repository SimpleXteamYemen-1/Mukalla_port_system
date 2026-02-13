import { CheckCircle2, XCircle, Clock, Ship, Anchor, FileText, Calendar, User as UserIcon } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface RequestStatusTrackerProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function RequestStatusTracker({ language, onNavigate }: RequestStatusTrackerProps) {
  const t = translations[language]?.agent?.tracker || translations.en.agent.tracker;

  const allRequests = [
    {
      id: 'AN-001',
      type: 'arrival',
      vessel: 'MV Ocean Star',
      title: language === 'ar' ? 'إشعار وصول' : 'Arrival Notification',
      submittedDate: '2026-02-05 10:00',
      status: 'approved',
      completedDate: '2026-02-06 09:15',
      icon: Ship,
      timeline: [
        { step: language === 'ar' ? 'مقدم' : 'Submitted', date: '2026-02-05 10:00', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'قيد المراجعة' : 'Under Review', date: '2026-02-05 14:30', user: 'Port Officer', status: 'completed' },
        { step: language === 'ar' ? 'موافق عليه' : 'Approved', date: '2026-02-06 09:15', user: 'Port Officer Ahmed', status: 'completed' },
      ],
    },
    {
      id: 'AR-001',
      type: 'anchorage',
      vessel: 'MV Ocean Star',
      title: language === 'ar' ? 'طلب رسو' : 'Anchorage Request',
      submittedDate: '2026-02-06 10:00',
      status: 'approved',
      completedDate: '2026-02-06 17:15',
      icon: Anchor,
      timeline: [
        { step: language === 'ar' ? 'مقدم' : 'Submitted', date: '2026-02-06 10:00', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'موافقة تنفيذية' : 'Executive Approval', date: '2026-02-06 14:30', user: 'Executive Manager', status: 'completed' },
        { step: language === 'ar' ? 'فحص الرصيف' : 'Wharf Check', date: '2026-02-06 16:00', user: 'Wharf Officer', status: 'completed' },
        { step: language === 'ar' ? 'موافقة نهائية' : 'Final Approval', date: '2026-02-06 17:15', user: 'Port Officer', status: 'completed' },
      ],
    },
    {
      id: 'CM-001',
      type: 'manifest',
      vessel: 'MV Ocean Star',
      title: language === 'ar' ? 'بيان شحن' : 'Cargo Manifest',
      submittedDate: '2026-02-06 11:30',
      status: 'approved',
      completedDate: '2026-02-06 15:30',
      icon: FileText,
      timeline: [
        { step: language === 'ar' ? 'مرفوع' : 'Uploaded', date: '2026-02-06 11:30', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'قيد المراجعة' : 'Under Review', date: '2026-02-06 13:00', user: 'Port Officer', status: 'completed' },
        { step: language === 'ar' ? 'موافق عليه' : 'Approved', date: '2026-02-06 15:30', user: 'Port Officer Ahmed', status: 'completed' },
      ],
    },
    {
      id: 'AN-002',
      type: 'arrival',
      vessel: 'MV Pacific Glory',
      title: language === 'ar' ? 'إشعار وصول' : 'Arrival Notification',
      submittedDate: '2026-02-07 11:20',
      status: 'pending',
      icon: Ship,
      timeline: [
        { step: language === 'ar' ? 'مقدم' : 'Submitted', date: '2026-02-07 11:20', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'قيد المراجعة' : 'Under Review', date: '2026-02-07 15:00', user: 'Port Officer', status: 'completed' },
        { step: language === 'ar' ? 'في انتظار الموافقة' : 'Awaiting Approval', date: '', user: '', status: 'pending' },
      ],
    },
    {
      id: 'AR-002',
      type: 'anchorage',
      vessel: 'MV Blue Horizon',
      title: language === 'ar' ? 'طلب رسو' : 'Anchorage Request',
      submittedDate: '2026-02-07 09:00',
      status: 'pending',
      icon: Anchor,
      timeline: [
        { step: language === 'ar' ? 'مقدم' : 'Submitted', date: '2026-02-07 09:00', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'موافقة تنفيذية' : 'Executive Approval', date: '', user: '', status: 'pending' },
        { step: language === 'ar' ? 'فحص الرصيف' : 'Wharf Check', date: '', user: '', status: 'pending' },
        { step: language === 'ar' ? 'موافقة نهائية' : 'Final Approval', date: '', user: '', status: 'pending' },
      ],
    },
    {
      id: 'AN-003',
      type: 'arrival',
      vessel: 'MV Cargo Express',
      title: language === 'ar' ? 'إشعار وصول' : 'Arrival Notification',
      submittedDate: '2026-02-04 09:00',
      status: 'rejected',
      completedDate: '2026-02-05 08:30',
      rejectionReason: language === 'ar' ? 'ازدحام الميناء - لا يوجد رصيف متاح' : 'Port congestion - berth unavailable',
      icon: Ship,
      timeline: [
        { step: language === 'ar' ? 'مقدم' : 'Submitted', date: '2026-02-04 09:00', user: 'Agent', status: 'completed' },
        { step: language === 'ar' ? 'قيد المراجعة' : 'Under Review', date: '2026-02-04 12:00', user: 'Port Officer', status: 'completed' },
        { step: language === 'ar' ? 'مرفوض' : 'Rejected', date: '2026-02-05 08:30', user: 'Port Officer Hassan', status: 'rejected' },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-amber-400 animate-pulse" />;
      default:
        return <Clock className="w-6 h-6 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-500/20 border-green-400/30 text-green-200';
      case 'rejected':
        return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'pending':
        return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      default:
        return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
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
    approved: allRequests.filter(r => r.status === 'approved').length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-blue-200">{t.subtitle}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.totalRequests}</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl border border-green-400/30 p-4">
          <div className="text-green-300 text-sm mb-1">{t.approved}</div>
          <div className="text-3xl font-bold text-white">{stats.approved}</div>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.pending}</div>
          <div className="text-3xl font-bold text-white">{stats.pending}</div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.rejected}</div>
          <div className="text-3xl font-bold text-white">{stats.rejected}</div>
        </div>
      </div>

      {/* Unified Timeline */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-6">{t.unifiedTimeline}</h2>
        
        <div className="relative">
          {/* Timeline Vertical Line */}
          <div className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-0 bottom-0 w-0.5 bg-white/10`}></div>

          <div className="space-y-6">
            {allRequests.map((request) => {
              const Icon = request.icon;
              return (
                <div key={request.id} className="relative">
                  {/* Timeline Node */}
                  <div className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} w-12 h-12 bg-gradient-to-br ${getTypeColor(request.type)} rounded-full flex items-center justify-center shadow-lg z-10`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content Card */}
                  <div className={`${language === 'ar' ? 'mr-16' : 'ml-16'} bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{request.title}</h3>
                          <span className="text-blue-300 text-sm">#{request.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
                          <Ship className="w-4 h-4" />
                          <span>{request.vessel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-300/70 text-xs">
                          <Calendar className="w-4 h-4" />
                          <span>{t.submitted}: {request.submittedDate}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                        {request.completedDate && (
                          <span className="text-blue-300/70 text-xs">{request.completedDate}</span>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-3">
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
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs ${
                            step.status === 'completed'
                              ? 'bg-green-500/20 text-green-200'
                              : step.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-200'
                              : step.status === 'rejected'
                              ? 'bg-red-500/20 text-red-200'
                              : 'bg-white/5 text-blue-300'
                          }`}>
                            {step.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                            {step.status === 'pending' && <Clock className="w-3 h-3" />}
                            {step.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            <span>{step.step}</span>
                          </div>
                          {index < request.timeline.length - 1 && (
                            <div className="w-2 h-0.5 bg-white/20"></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Detailed Timeline Expansion */}
                    <details className="mt-3 group">
                      <summary className="cursor-pointer text-blue-300 text-sm hover:text-white transition-colors list-none flex items-center gap-2">
                        <span>{t.viewDetails}</span>
                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 bg-white/5 rounded-lg p-4">
                        <div className="space-y-3">
                          {request.timeline.map((step, index) => (
                            <div key={index} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.status === 'completed'
                                  ? 'bg-green-500/20 border border-green-400'
                                  : step.status === 'pending'
                                  ? 'bg-amber-500/20 border border-amber-400'
                                  : step.status === 'rejected'
                                  ? 'bg-red-500/20 border border-red-400'
                                  : 'bg-white/5 border border-white/20'
                              }`}>
                                {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                                {step.status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                                {step.status === 'rejected' && <XCircle className="w-3 h-3 text-red-400" />}
                              </div>
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium">{step.step}</div>
                                {step.date && (
                                  <div className="text-blue-300 text-xs mt-1">{step.date}</div>
                                )}
                                {step.user && (
                                  <div className="flex items-center gap-1 text-blue-300/70 text-xs mt-1">
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
      </div>
    </div>
  );
}
