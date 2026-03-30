import { useState, useEffect } from 'react';
import { Ship, CheckCircle2, XCircle, AlertTriangle, Calendar, User as UserIcon, Clock, FileText, Loader2 } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService, PendingApproval } from '../../services/executiveService';

interface ArrivalApprovalsProps {
  language: Language;
}

export function ArrivalApprovals({ language }: ArrivalApprovalsProps) {
  const t = translations[language]?.executive?.arrivals || translations.en.executive.arrivals;
  const [requests, setRequests] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await executiveService.getPendingApprovals();
      setRequests(data);
    } catch (err) {
      setError(language === 'ar' ? 'فشل تحميل الطلبات' : 'Failed to load requests');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setIsProcessing(true);
      await executiveService.approveArrival(id);
      setRequests(requests.filter(r => r.vesselId !== id));
      // Optional: Add a success toast here
    } catch (err) {
      console.error('Error approving:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء الموافقة' : 'An error occurred during approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (id: number) => {
    setSelectedRequest(id);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim() || !selectedRequest) {
      alert(language === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason');
      return;
    }

    try {
      setIsProcessing(true);
      await executiveService.rejectArrival(selectedRequest, rejectionReason);
      setRequests(requests.filter(r => r.vesselId !== selectedRequest));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error rejecting:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء الرفض' : 'An error occurred during rejection');
    } finally {
      setIsProcessing(false);
    }
  };

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


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-blue-200">{t.subtitle}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.pendingApprovals}</div>
          <div className="text-2xl font-bold text-white">{requests.length}</div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.highPriority}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.priority.toLowerCase() === 'high').length}
          </div>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-400/30 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.avgProcessTime}</div>
          <div className="text-2xl font-bold text-white">2.5h</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-6 text-center">
          {error}
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
          >
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/5 border border-white/10 text-white rounded-xl p-12 text-center">
          <Ship className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests'}
          </h3>
          <p className="text-blue-200/60 text-sm">
            {language === 'ar'
              ? 'جميع طلبات الوصول تمت معالجتها'
              : 'All arrival requests have been processed'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-white/30 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Ship className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{request.vessel.name}</h3>
                      <span className="text-2xl">{request.vessel.flag}</span>
                    </div>
                    <div className="text-blue-300 text-sm mb-1">{t.requestId}: {request.id}</div>
                    <div className="text-blue-300/70 text-xs">{request.vessel.imo} • {request.vessel.type}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs border font-medium ${getPriorityColor(request.priority.toLowerCase())}`}>
                    {t.priority}: {getPriorityLabel(request.priority.toLowerCase())}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t.expectedArrival}</span>
                  </div>
                  <div className="text-white font-medium text-sm">{request.eta}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{t.agent}</span>
                  </div>
                  <div className="text-white font-medium text-sm">{request.agent.name}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
                    <Clock className="w-4 h-4" />
                    <span>{t.submitted}</span>
                  </div>
                  <div className="text-white font-medium text-sm">{request.submittedDate}</div>
                </div>
              </div>

              {/* Purpose & Cargo */}
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="text-blue-300 text-xs mb-1">{t.purpose}</div>
                <div className="text-white text-sm mb-2">{request.purpose}</div>
                <div className="flex gap-4 text-xs">
                  <span className="text-blue-300">{t.cargoType}: <span className="text-white">{request.cargoType}</span></span>
                  {request.containers > 0 && (
                    <span className="text-blue-300">{t.containers}: <span className="text-white">{request.containers}</span></span>
                  )}
                </div>
              </div>

              {/* Conditional Agent Notes */}
              {(request.priority.toLowerCase() === 'medium' && request.priorityReason) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-amber-300 text-xs mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider">{(t as any).agentJustification || 'Agent Justification'}</span>
                  </div>
                  <div className="text-amber-100/90 text-sm italic leading-relaxed">"{request.priorityReason}"</div>
                </div>
              )}
              {(request.priority.toLowerCase() === 'high' && request.priorityDocumentPath) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 flex items-center justify-between group hover:bg-red-500/20 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-red-300 text-xs mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold uppercase tracking-wider">{(t as any).priorityDocumentation || 'Priority Documentation'}</span>
                    </div>
                    <div className="text-red-100/70 text-xs">{(t as any).docRequiresReview || 'Review attached document before deciding.'}</div>
                  </div>
                  <a
                    href={request.priorityDocumentPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 border border-red-500/30 rounded-lg text-red-100 text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    {(t as any).viewDocument || 'View Document'}
                    <span className="text-lg">→</span>
                  </a>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-300 text-xs mb-2">
                  <FileText className="w-4 h-4" />
                  <span>{t.documents}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.documents.map((doc, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-green-500/20 border border-green-400/30 text-green-200 text-xs rounded">
                      ✓ {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Decision Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleApprove(request.vesselId)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-xl text-green-200 hover:text-white font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {t.approve}
                </button>
                <button
                  onClick={() => handleReject(request.vesselId)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-200 hover:text-white font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <XCircle className="w-5 h-5" />
                  {t.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">{t.rejectRequest}</h2>

            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">{t.rejectionReason}</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.rejectionPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-red-400 transition-all resize-none"
              />
              <p className="text-blue-300/70 text-xs mt-2">{t.rejectionNote}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {t.confirmReject}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
