import { useState, useEffect } from 'react';
import { Anchor, AlertCircle, CheckCircle2, XCircle, Clock, Plus, Ship, Loader2 } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface AnchorageRequestsProps {
  language: Language;
}

export function AnchorageRequests({ language }: AnchorageRequestsProps) {
  const t = translations[language]?.agent?.anchorage || translations.en.agent.anchorage;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vesselId: '',
    duration: '',
    reason: '',
    preferredLocation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approvedVessels, setApprovedVessels] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vesselsData, requestsData] = await Promise.all([
        agentService.getVessels(),
        agentService.getAnchorageRequests()
      ]);

      // Filter for approved vessels only
      const approved = vesselsData.filter((v: any) => v.status === 'approved');
      setApprovedVessels(approved);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching anchorage data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.vesselId) newErrors.vessel = t.errors.vesselRequired;
    if (!formData.duration) newErrors.duration = t.errors.durationRequired;
    if (!formData.reason) newErrors.reason = t.errors.reasonRequired;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await agentService.submitAnchorageRequest({
        vessel_id: formData.vesselId,
        duration: formData.duration,
        reason: formData.reason,
        location: formData.preferredLocation
      });

      alert(language === 'ar' ? 'تم إرسال طلب الرسو بنجاح!' : 'Anchorage request submitted successfully!');
      setShowForm(false);
      setFormData({ vesselId: '', duration: '', reason: '', preferredLocation: '' });
      setErrors({});
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Submission failed", error);
      alert(language === 'ar' ? 'فشل إرسال الطلب' : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
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
      case 'cancelled':
        return 'bg-gray-500/20 border-gray-400/30 text-gray-200';
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
      cancelled: { ar: 'ملغى', en: 'Cancelled' },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-blue-200">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={approvedVessels.length === 0}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:transform-none"
        >
          <Plus className="w-5 h-5" />
          {t.submitNew}
        </button>
      </div>

      {/* Dependency Notice */}
      <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-400/30 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-300 flex-shrink-0" />
          <div>
            <h3 className="text-blue-200 font-semibold mb-2">{t.dependencyTitle}</h3>
            <p className="text-blue-200/80 text-sm">{t.dependencyMessage}</p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {showForm && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">{t.formTitle}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Vessel Selection - Only Approved Arrivals */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.selectVessel}</label>
                <select
                  value={formData.vesselId}
                  onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                  className={`w-full px-4 py-3 bg-white/10 border ${errors.vessel ? 'border-red-400' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-purple-400 transition-all`}
                >
                  <option value="">{t.selectVesselPlaceholder}</option>
                  {approvedVessels.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {errors.vessel && <p className="text-red-300 text-xs mt-1">{errors.vessel}</p>}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.duration}</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className={`w-full px-4 py-3 bg-white/10 border ${errors.duration ? 'border-red-400' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-purple-400 transition-all`}
                >
                  <option value="">{t.selectDuration}</option>
                  <option value="24">24 {t.hours}</option>
                  <option value="48">48 {t.hours}</option>
                  <option value="72">72 {t.hours}</option>
                  <option value="custom">{t.custom}</option>
                </select>
                {errors.duration && <p className="text-red-300 text-xs mt-1">{errors.duration}</p>}
              </div>

              {/* Preferred Location */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.preferredLocation}</label>
                <select
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-all"
                >
                  <option value="">{t.selectLocation}</option>
                  <option value="zone-a">{t.zoneA}</option>
                  <option value="zone-b">{t.zoneB}</option>
                  <option value="zone-c">{t.zoneC}</option>
                </select>
              </div>

              {/* Reason */}
              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">{t.reason}</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t.reasonPlaceholder}
                  rows={3}
                  className={`w-full px-4 py-3 bg-white/10 border ${errors.reason ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-purple-400 transition-all resize-none`}
                />
                {errors.reason && <p className="text-red-300 text-xs mt-1">{errors.reason}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold transition-all"
              >
                {t.submitButton}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-blue-200 py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center text-blue-200 py-8 border border-white/10 rounded-2xl bg-white/5">
            {language === 'ar' ? 'لا توجد طلبات رسو.' : 'No anchorage requests found.'}
          </div>
        ) : requests.map((request) => (
          <div key={request.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  {getStatusIcon(request.status)}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{request.vessel?.name || 'Unknown Vessel'}</h3>
                  <p className="text-blue-300 text-sm">
                    {t.requestId}: {request.id}
                  </p>
                </div>
              </div>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.duration}</div>
                <div className="text-white font-medium">{request.duration}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.location}</div>
                <div className="text-white font-medium">{request.location || 'N/A'}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.submittedOn}</div>
                <div className="text-white font-medium">{new Date(request.created_at).toLocaleDateString()}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.status}</div>
                <div className="text-white font-medium capitalize">{request.status}</div>
              </div>
            </div>

            {/* Rejection Info */}
            {request.status === 'rejected' && request.rejection_reason && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-200/80 text-sm mb-1">{request.rejection_reason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Simple Status Info instead of fake timeline */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white font-semibold text-sm mb-4">{t.approvalProcess}</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/20 border-2 border-green-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="font-medium mb-1 text-white">Submitted</div>
                    <div className="text-blue-300 text-xs mb-1">{new Date(request.created_at).toLocaleString()}</div>
                    <div className="text-blue-300/70 text-xs">Agent</div>
                  </div>
                </div>

                {request.status !== 'pending' && (
                  <div className="flex items-start gap-4">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${request.status === 'approved' ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'
                      }`}>
                      {request.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className={`font-medium mb-1 ${request.status === 'approved' ? 'text-white' : 'text-red-200'}`}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </div>
                      <div className="text-blue-300 text-xs mb-1">{new Date(request.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
