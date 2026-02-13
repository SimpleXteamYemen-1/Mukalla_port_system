import { useState } from 'react';
import { Ship, CheckCircle2, XCircle, AlertTriangle, Calendar, User as UserIcon, Clock, FileText } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface ArrivalApprovalsProps {
  language: Language;
}

export function ArrivalApprovals({ language }: ArrivalApprovalsProps) {
  const t = translations[language]?.executive?.arrivals || translations.en.executive.arrivals;
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const requests = [
    {
      id: 'AN-008',
      vessel: { name: 'MV Ocean Breeze', imo: 'IMO9234567', flag: '🇦🇪', type: 'Container' },
      agent: { name: 'Maritime Express Co.', contact: 'agent@maritime-express.com' },
      eta: '2026-02-10 09:00',
      purpose: 'Cargo discharge and loading',
      submittedDate: '2026-02-07 14:30',
      priority: 'high',
      riskLevel: 'low',
      cargoType: 'General Cargo',
      containers: 145,
      documents: ['Manifest', 'Bill of Lading', 'Safety Certificate'],
    },
    {
      id: 'AN-009',
      vessel: { name: 'MV Desert Star', imo: 'IMO9345678', flag: '🇸🇦', type: 'Tanker' },
      agent: { name: 'Emirates Marine', contact: 'ops@emirates-marine.ae' },
      eta: '2026-02-12 14:30',
      purpose: 'Fuel discharge',
      submittedDate: '2026-02-06 16:45',
      priority: 'medium',
      riskLevel: 'medium',
      cargoType: 'Petroleum Products',
      containers: 0,
      documents: ['Manifest', 'Hazmat Declaration', 'Insurance'],
    },
    {
      id: 'AN-010',
      vessel: { name: 'MV Cargo Master', imo: 'IMO9456789', flag: '🇴🇲', type: 'Bulk Carrier' },
      agent: { name: 'Global Shipping Ltd.', contact: 'support@globalship.com' },
      eta: '2026-02-11 08:00',
      purpose: 'Bulk cargo loading',
      submittedDate: '2026-02-07 11:20',
      priority: 'low',
      riskLevel: 'low',
      cargoType: 'Bulk Materials',
      containers: 0,
      documents: ['Manifest', 'Bill of Lading'],
    },
  ];

  const handleApprove = (id: string) => {
    alert(language === 'ar' ? `تمت الموافقة على الطلب ${id}` : `Request ${id} approved successfully`);
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'medium': return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      case 'low': return 'bg-green-500/20 border-green-400/30 text-green-200';
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

  const getRiskLabel = (risk: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      high: { ar: 'مرتفع', en: 'High' },
      medium: { ar: 'متوسط', en: 'Medium' },
      low: { ar: 'منخفض', en: 'Low' },
    };
    return labels[risk]?.[language] || risk;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-blue-200">{t.subtitle}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.pendingApprovals}</div>
          <div className="text-2xl font-bold text-white">{requests.length}</div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.highPriority}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.priority === 'high').length}
          </div>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.mediumRisk}</div>
          <div className="text-2xl font-bold text-white">
            {requests.filter(r => r.riskLevel === 'medium').length}
          </div>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-400/30 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.avgProcessTime}</div>
          <div className="text-2xl font-bold text-white">2.5h</div>
        </div>
      </div>

      {/* Approval Cards */}
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
                <span className={`inline-block px-3 py-1 rounded-lg text-xs border font-medium ${getPriorityColor(request.priority)}`}>
                  {t.priority}: {getPriorityLabel(request.priority)}
                </span>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs border font-medium ${getRiskColor(request.riskLevel)}`}>
                  {t.risk}: {getRiskLabel(request.riskLevel)}
                </span>
              </div>
            </div>

            {/* Risk Warning */}
            {request.riskLevel === 'medium' || request.riskLevel === 'high' ? (
              <div className={`mb-4 p-3 rounded-xl border ${request.riskLevel === 'high' ? 'bg-red-500/10 border-red-400/30' : 'bg-amber-500/10 border-amber-400/30'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${request.riskLevel === 'high' ? 'text-red-300' : 'text-amber-300'}`} />
                  <div>
                    <div className={`font-semibold text-sm ${request.riskLevel === 'high' ? 'text-red-200' : 'text-amber-200'}`}>
                      {t.riskWarning}
                    </div>
                    <div className={`text-xs mt-1 ${request.riskLevel === 'high' ? 'text-red-200/80' : 'text-amber-200/80'}`}>
                      {request.cargoType} - {t.requiresExtraReview}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

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
                onClick={() => handleApprove(request.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-xl text-green-200 hover:text-white font-semibold transition-all transform hover:scale-[1.02]"
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
