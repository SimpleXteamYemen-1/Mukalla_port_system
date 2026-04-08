import { useState, useEffect } from 'react';
import { Anchor, CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, Loader2, Calendar, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchRequests();
  }, []);

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
      toast.success(language === 'ar' ? `تمت الموافقة على طلب الرسو` : `Anchorage request approved successfully`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to approve request', error);
      toast.error(language === 'ar' ? 'فشل الموافقة على الطلب' : 'Failed to approve request');
    }
  };

  const handleReject = (id: number) => {
    setSelectedRequest(id.toString());
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim() || !selectedRequest) {
      toast.warning(language === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason');
      return;
    }

    try {
      await executiveService.rejectAnchorage(parseInt(selectedRequest), rejectionReason);
      toast.success(language === 'ar' ? `تم رفض الطلب` : `Request rejected successfully`);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject request', error);
      toast.error(language === 'ar' ? 'فشل رفض الطلب' : 'Failed to reject request');
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-blue-200">{t.subtitle}</p>
      </div>

      {/* Dependency Info Banner */}
      <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-400/30 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-blue-300 flex-shrink-0" />
          <div>
            <h3 className="text-blue-200 font-semibold mb-2">{t.dependencyTitle}</h3>
            <p className="text-blue-200/80 text-sm mb-3">{t.dependencyMessage}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                {t.arrivalApproved}
              </span>
              <span className="text-blue-300">+</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                {t.wharfApproved}
              </span>
              <span className="text-blue-300">=</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-lg">
                <Unlock className="w-4 h-4" />
                {t.canApprove}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.total}</div>
          <div className="text-2xl font-bold text-white">{requests.length}</div>
        </div>
        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl border border-green-400/30 p-4">
          <div className="text-green-300 text-sm mb-1">{t.readyToApprove}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.canApprove).length}
          </div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.blocked}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.vessel?.status !== 'approved').length}
          </div>
        </div>
        <div className="bg-purple-500/10 backdrop-blur-xl rounded-xl border border-purple-400/30 p-4">
          <div className="text-purple-300 text-sm mb-1">{language === 'ar' ? 'مرفوضة' : 'Rejected'}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <Anchor className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
          <p className="text-blue-200">{language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests found'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Approval Cards */}
          {requests.map((request) => {
            const isVesselApproved = request.vessel?.status === 'approved';

            return (
              <div key={request.id} className={`bg-white/10 backdrop-blur-xl rounded-2xl border ${isVesselApproved ? 'border-white/20' : 'border-red-400/30'} p-6 transition-all ${isVesselApproved ? 'hover:border-white/30' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${isVesselApproved ? 'from-purple-400 to-pink-500' : 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                      {isVesselApproved ? (
                        <Anchor className="w-7 h-7 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{request.vessel?.name || 'Unknown Vessel'}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-300 text-sm mb-1">{t.requestId}: AR-{request.id}</span>
                        <div className="flex items-center gap-1.5 text-blue-300/70 text-xs font-bold uppercase tracking-wider mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(request.docking_time).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-blue-300/70 text-xs">{t.arrivalRef}: AN-{request.vessel_id}</div>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs border font-medium ${getPriorityColor('medium')}`}>
                    {t.priority}: MEDIUM
                  </span>
                </div>

                {/* Dependency State Machine Visualization */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <div className="text-white font-semibold text-sm mb-3">{t.approvalChecklist}</div>
                  <div className="space-y-3">
                    {/* Arrival Approval Check */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVesselApproved ? 'bg-green-500/20 border-2 border-green-400' : 'bg-amber-500/20 border-2 border-amber-400'}`}>
                        {isVesselApproved ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${isVesselApproved ? 'text-white' : 'text-amber-200'}`}>
                          {t.arrivalApprovalCheck}
                        </div>
                        <div className={`text-xs ${isVesselApproved ? 'text-green-300' : 'text-amber-300'}`}>
                          {isVesselApproved ? t.approved : t.notApproved}
                        </div>
                      </div>
                    </div>

                    {/* Wharf Approval Check (Simulated for Anchorage) */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 border-2 border-green-400`}>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm text-white`}>
                          {t.wharfApprovalCheck}
                        </div>
                        <div className={`text-xs text-green-300`}>
                          {t.approved}
                        </div>
                      </div>
                    </div>

                    {/* Executive Decision */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${request.status === 'approved' ? 'bg-green-500/20 border-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/20 border-red-400' :
                          isVesselApproved ? 'bg-blue-500/20 border-blue-400' : 'bg-gray-500/20 border-gray-400'
                        }`}>
                        {request.status === 'approved' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : request.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : isVesselApproved ? (
                          <Unlock className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${request.status === 'approved' ? 'text-green-300' :
                          request.status === 'rejected' ? 'text-red-300' :
                            isVesselApproved ? 'text-white' : 'text-gray-300'
                          }`}>
                          {t.executiveDecision}
                        </div>
                        <div className={`text-xs ${request.status === 'approved' ? 'text-green-400' :
                          request.status === 'rejected' ? 'text-red-400' :
                            isVesselApproved ? 'text-blue-300' : 'text-gray-400'
                          }`}>
                          {request.status === 'approved' ? t.approved :
                            request.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') :
                              isVesselApproved ? t.readyForDecision : t.blocked}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Block Warning */}
                {!isVesselApproved && request.status === 'pending' && (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-200 font-semibold text-sm mb-1">{t.approvalBlocked}</div>
                        <div className="text-red-200/80 text-sm">{language === 'ar' ? 'السفينة لم تتم الموافقة عليها أو غير نشطة' : 'Vessel is not approved or inactive'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-300 text-xs mb-1">{t.agent}</div>
                    <div className="text-white font-medium text-sm">{request.vessel?.owner?.name || 'Unknown Agent'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-300 text-xs mb-1">{t.duration}</div>
                    <div className="text-white font-medium text-sm">{request.duration} {language === 'ar' ? 'ساعات' : 'hours'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-300 text-xs mb-1">{t.location}</div>
                    <div className="text-white font-medium text-sm">{request.location || 'N/A'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-300 text-xs mb-1">{t.submitted}</div>
                    <div className="text-white font-medium text-sm">{new Date(request.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="text-blue-300 text-xs mb-1">{t.reason}</div>
                  <div className="text-white text-sm">{request.reason}</div>
                </div>

                {/* Decision Actions */}
                {request.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={!isVesselApproved}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${isVesselApproved
                        ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-200 hover:text-white transform hover:scale-[1.02] cursor-pointer'
                        : 'bg-gray-500/10 border border-gray-400/20 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {t.approve}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-200 hover:text-white font-semibold transition-all transform hover:scale-[1.02]"
                    >
                      <XCircle className="w-5 h-5" />
                      {t.reject}
                    </button>
                    <button
                      onClick={() => onNavigate('vessel-history', { vesselId: request.vessel_id || request.vessel?.id })}
                      className="flex-1 sm:flex-none sm:px-6 flex items-center justify-center gap-2 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-blue-200 hover:text-white font-semibold transition-all transform hover:scale-[1.02]"
                      title={language === 'ar' ? 'عرض السجل الكامل للسفينة' : 'View full history of the vessel'}
                    >
                      <Clock className="w-5 h-5" />
                      <span className="sm:hidden md:inline">{language === 'ar' ? 'السجل' : 'History'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">{t.rejectRequest}</h2>

            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">{t.justification}</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.justificationPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-red-400 transition-all resize-none"
              />
              <p className="text-blue-300/70 text-xs mt-2">{t.justificationNote}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-white font-semibold transition-all"
              >
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
