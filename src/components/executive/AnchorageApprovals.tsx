import { useState, useEffect } from 'react';
import { Anchor, CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, Calendar, Clock, X } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService } from '../../services/executiveService';
import { toast } from 'react-toastify';

interface AnchorageApprovalsProps {
  language: Language;
  onNavigate: (page: string, params?: { vesselId?: number | string }) => void;
}

export function AnchorageApprovals({ language, onNavigate }: AnchorageApprovalsProps) {
  const t = translations[language]?.executive?.anchorage || translations.en.executive.anchorage;
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await executiveService.getAnchorageRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching anchorage requests', error);
      toast.error(language === 'ar' ? 'فشل جلب الطلبات' : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await executiveService.approveAnchorage(id);
      toast.success(language === 'ar' ? 'تمت الموافقة على طلب الرسو' : 'Anchorage request approved successfully');
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve request', error);
      toast.error(language === 'ar' ? 'فشل الموافقة على الطلب' : 'Failed to approve request');
    }
  };

  const handleReject = (id: number) => { setSelectedRequest(id.toString()); setShowRejectModal(true); };

  const confirmReject = async () => {
    if (!rejectionReason.trim() || !selectedRequest) {
      toast.warning(language === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason');
      return;
    }
    try {
      await executiveService.rejectAnchorage(parseInt(selectedRequest), rejectionReason);
      toast.success(language === 'ar' ? 'تم رفض الطلب' : 'Request rejected successfully');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request', error);
      toast.error(language === 'ar' ? 'فشل رفض الطلب' : 'Failed to reject request');
    }
  };

  const getDecisionStatusIcon = (request: any, isVesselApproved: boolean) => {
    if (request.status === 'approved') return <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />;
    if (request.status === 'rejected') return <XCircle className="w-4 h-4 text-red-700 dark:text-red-400" />;
    if (isVesselApproved) return <Unlock className="w-4 h-4 text-blue-700 dark:text-blue-400" />;
    return <Lock className="w-4 h-4 text-slate-400" />;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'low':
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return 'LOW';
    if (language === 'ar') {
      const arMap: Record<string, string> = { 'high': 'عالي', 'medium': 'متوسط', 'low': 'منخفض' };
      return arMap[priority.toLowerCase()] || priority.toUpperCase();
    }
    return priority.toUpperCase();
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* Dependency Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-700 dark:text-blue-400 font-semibold text-sm mb-1">{t.dependencyTitle}</h3>
            <p className="text-blue-600 dark:text-blue-300 text-sm mb-3">{t.dependencyMessage}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />{t.arrivalApproved}
              </span>
              <span className="text-slate-400">+</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />{t.wharfApproved}
              </span>
              <span className="text-slate-400">=</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                <Unlock className="w-3.5 h-3.5" />{t.canApprove}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.total, value: requests.length, borderColor: 'border-b-amber-500 dark:border-b-amber-400', textColor: 'text-amber-700 dark:text-amber-400' },
          { label: t.readyToApprove, value: requests.filter(r => r.canApprove).length, borderColor: 'border-b-green-500 dark:border-b-green-400', textColor: 'text-green-700 dark:text-green-400' },
          { label: t.blocked, value: requests.filter(r => r.vessel?.status !== 'approved').length, borderColor: 'border-b-red-500 dark:border-b-red-400', textColor: 'text-red-700 dark:text-red-400' },
          { label: language === 'ar' ? 'مرفوضة' : 'Rejected', value: requests.filter(r => r.status === 'rejected').length, borderColor: 'border-b-slate-400 dark:border-b-slate-500', textColor: 'text-slate-700 dark:text-slate-300' },
        ].map((item) => (
          <div key={item.label} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-b-4 ${item.borderColor} rounded-lg p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${item.textColor} mb-1`}>{item.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingIndicator type="line-spinner" size="lg" label={language === 'ar' ? 'جاري جلب الطلبات...' : 'Fetching requests...'} />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <Anchor className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests found'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isVesselApproved = request.vessel?.status === 'approved';
            return (
              <div key={request.id} className={`bg-white dark:bg-slate-800 border rounded-lg shadow-sm overflow-hidden ${isVesselApproved ? 'border-slate-200 dark:border-slate-700' : 'border-red-200 dark:border-red-900/30'}`}>
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${isVesselApproved ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {isVesselApproved ? <Anchor className="w-5 h-5 text-blue-700 dark:text-blue-400" /> : <Lock className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-slate-50 font-semibold">{request.vessel?.name || 'Unknown Vessel'}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-slate-500 dark:text-slate-400 text-xs">{t.requestId}: AR-{request.id}</span>
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs"><Calendar className="w-3 h-3" />{new Date(request.docking_time).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{t.arrivalRef}: AN-{request.vessel_id}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.vessel?.priority)}`}>
                      {t.priority}: {getPriorityLabel(request.vessel?.priority)}
                    </span>
                  </div>

                  {/* Approval Checklist */}
                  <div className="bg-slate-50 dark:bg-slate-700/25 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-4">
                    <div className="text-slate-900 dark:text-slate-50 font-medium text-sm mb-3">{t.approvalChecklist}</div>
                    <div className="space-y-3">
                      {[
                        {
                          label: t.arrivalApprovalCheck,
                          subLabel: isVesselApproved ? t.approved : t.notApproved,
                          passed: isVesselApproved,
                        },
                        { label: t.wharfApprovalCheck, subLabel: t.approved, passed: true },
                        {
                          label: t.executiveDecision,
                          subLabel: request.status === 'approved' ? t.approved : request.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') : isVesselApproved ? t.readyForDecision : t.blocked,
                          icon: getDecisionStatusIcon(request, isVesselApproved),
                        },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.passed === true ? 'bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-400' : step.passed === false ? 'bg-amber-100 border-amber-500 dark:bg-amber-900/30 dark:border-amber-400' : 'bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'}`}>
                            {i === 2 ? step.icon : step.passed ? <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-slate-50 text-sm font-medium">{step.label}</div>
                            <div className={`text-xs ${step.passed ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>{step.subLabel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Block Warning */}
                  {!isVesselApproved && request.status === 'pending' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-red-700 dark:text-red-400 font-semibold text-sm mb-0.5">{t.approvalBlocked}</div>
                          <div className="text-red-600 dark:text-red-300 text-xs">{language === 'ar' ? 'السفينة لم تتم الموافقة عليها أو غير نشطة' : 'Vessel is not approved or inactive'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: t.agent, value: request.vessel?.owner?.name || 'Unknown Agent' },
                      { label: t.duration, value: `${request.duration} ${language === 'ar' ? 'ساعات' : 'hours'}` },
                      { label: t.location, value: request.location || 'N/A' },
                      { label: t.submitted, value: new Date(request.created_at).toLocaleString() },
                    ].map((item) => (
                      <div key={item.label} className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</div>
                        <div className="text-slate-900 dark:text-slate-50 font-medium text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Reason */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.reason}</div>
                    <div className="text-slate-900 dark:text-slate-50 text-sm">
                      {request.vessel?.priority_reason || request.vessel?.purpose || request.reason}
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button onClick={() => handleApprove(request.id)} disabled={!isVesselApproved} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${isVesselApproved ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
                        <CheckCircle2 className="w-4 h-4" />{t.approve}
                      </button>
                      <button onClick={() => handleReject(request.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium text-sm transition-colors">
                        <XCircle className="w-4 h-4" />{t.reject}
                      </button>
                      <button onClick={() => onNavigate('vessel-history', { vesselId: request.vessel_id || request.vessel?.id })} className="flex-1 sm:flex-none sm:px-4 flex items-center justify-center gap-2 py-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium text-sm transition-colors">
                        <Clock className="w-4 h-4" /><span className="sm:hidden md:inline">{language === 'ar' ? 'السجل' : 'History'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><XCircle className="w-5 h-5 text-red-700 dark:text-red-400" /></div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t.rejectRequest}</h2>
              </div>
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedRequest(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{t.justification}</label>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder={t.justificationPlaceholder} rows={4} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none text-sm mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-xs mb-5">{t.justificationNote}</p>
            <div className="flex gap-3">
              <button onClick={confirmReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">{t.confirmReject}</button>
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedRequest(null); }} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-2.5 rounded-lg font-medium text-sm transition-colors">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
