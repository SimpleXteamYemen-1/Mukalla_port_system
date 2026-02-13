import { useState } from 'react';
import { Anchor, CheckCircle2, XCircle, AlertTriangle, Ship, Lock, Unlock } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface AnchorageApprovalsProps {
  language: Language;
}

export function AnchorageApprovals({ language }: AnchorageApprovalsProps) {
  const t = translations[language]?.executive?.anchorage || translations.en.executive.anchorage;
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const requests = [
    {
      id: 'AR-009',
      vessel: 'MV Ocean Breeze',
      agent: 'Maritime Express Co.',
      arrivalId: 'AN-008',
      arrivalApproved: true,
      wharfApproved: true,
      duration: '48 hours',
      location: 'Anchorage Zone A',
      reason: 'Waiting for berth availability',
      submittedDate: '2026-02-07 15:00',
      priority: 'high',
      canApprove: true,
    },
    {
      id: 'AR-010',
      vessel: 'MV Cargo Master',
      agent: 'Global Shipping Ltd.',
      arrivalId: 'AN-010',
      arrivalApproved: true,
      wharfApproved: false,
      duration: '24 hours',
      location: 'Anchorage Zone B',
      reason: 'Cargo inspection pending',
      submittedDate: '2026-02-07 12:30',
      priority: 'medium',
      canApprove: false,
      blockReason: language === 'ar' ? 'في انتظار موافقة الرصيف' : 'Awaiting Wharf Approval',
    },
    {
      id: 'AR-011',
      vessel: 'MV Blue Wave',
      agent: 'Pacific Logistics',
      arrivalId: 'AN-011',
      arrivalApproved: false,
      wharfApproved: false,
      duration: '72 hours',
      location: 'Anchorage Zone C',
      reason: 'Weather delay',
      submittedDate: '2026-02-06 18:00',
      priority: 'low',
      canApprove: false,
      blockReason: language === 'ar' ? 'لم يتم الموافقة على الوصول' : 'No Arrival Approval',
    },
  ];

  const handleApprove = (id: string) => {
    alert(language === 'ar' ? `تمت الموافقة على طلب الرسو ${id}` : `Anchorage request ${id} approved successfully`);
  };

  const handleReject = (id: string) => {
    setSelectedRequest(id);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason');
      return;
    }
    alert(language === 'ar' ? `تم رفض الطلب ${selectedRequest}` : `Request ${selectedRequest} rejected`);
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedRequest(null);
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
            {requests.filter(r => !r.canApprove).length}
          </div>
        </div>
        <div className="bg-purple-500/10 backdrop-blur-xl rounded-xl border border-purple-400/30 p-4">
          <div className="text-purple-300 text-sm mb-1">{t.awaitingWharf}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.arrivalApproved && !r.wharfApproved).length}
          </div>
        </div>
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className={`bg-white/10 backdrop-blur-xl rounded-2xl border ${request.canApprove ? 'border-white/20' : 'border-red-400/30'} p-6 transition-all ${request.canApprove ? 'hover:border-white/30' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${request.canApprove ? 'from-purple-400 to-pink-500' : 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                  {request.canApprove ? (
                    <Anchor className="w-7 h-7 text-white" />
                  ) : (
                    <Lock className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{request.vessel}</h3>
                  <div className="text-blue-300 text-sm mb-1">{t.requestId}: {request.id}</div>
                  <div className="text-blue-300/70 text-xs">{t.arrivalRef}: {request.arrivalId}</div>
                </div>
              </div>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs border font-medium ${getPriorityColor(request.priority)}`}>
                {t.priority}: {request.priority.toUpperCase()}
              </span>
            </div>

            {/* Dependency State Machine Visualization */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="text-white font-semibold text-sm mb-3">{t.approvalChecklist}</div>
              <div className="space-y-3">
                {/* Arrival Approval Check */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${request.arrivalApproved ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'}`}>
                    {request.arrivalApproved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${request.arrivalApproved ? 'text-white' : 'text-red-200'}`}>
                      {t.arrivalApprovalCheck}
                    </div>
                    <div className={`text-xs ${request.arrivalApproved ? 'text-green-300' : 'text-red-300'}`}>
                      {request.arrivalApproved ? t.approved : t.notApproved}
                    </div>
                  </div>
                </div>

                {/* Wharf Approval Check */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${request.wharfApproved ? 'bg-green-500/20 border-2 border-green-400' : 'bg-amber-500/20 border-2 border-amber-400'}`}>
                    {request.wharfApproved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${request.wharfApproved ? 'text-white' : 'text-amber-200'}`}>
                      {t.wharfApprovalCheck}
                    </div>
                    <div className={`text-xs ${request.wharfApproved ? 'text-green-300' : 'text-amber-300'}`}>
                      {request.wharfApproved ? t.approved : t.pending}
                    </div>
                  </div>
                </div>

                {/* Executive Decision */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${request.canApprove ? 'bg-blue-500/20 border-2 border-blue-400' : 'bg-gray-500/20 border-2 border-gray-400'}`}>
                    {request.canApprove ? (
                      <Unlock className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${request.canApprove ? 'text-white' : 'text-gray-300'}`}>
                      {t.executiveDecision}
                    </div>
                    <div className={`text-xs ${request.canApprove ? 'text-blue-300' : 'text-gray-400'}`}>
                      {request.canApprove ? t.readyForDecision : t.blocked}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block Warning */}
            {!request.canApprove && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-200 font-semibold text-sm mb-1">{t.approvalBlocked}</div>
                    <div className="text-red-200/80 text-sm">{request.blockReason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.agent}</div>
                <div className="text-white font-medium text-sm">{request.agent}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.duration}</div>
                <div className="text-white font-medium text-sm">{request.duration}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.location}</div>
                <div className="text-white font-medium text-sm">{request.location}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.submitted}</div>
                <div className="text-white font-medium text-sm">{request.submittedDate}</div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="text-blue-300 text-xs mb-1">{t.reason}</div>
              <div className="text-white text-sm">{request.reason}</div>
            </div>

            {/* Decision Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={!request.canApprove}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${request.canApprove
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
            </div>
          </div>
        ))}
      </div>

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
