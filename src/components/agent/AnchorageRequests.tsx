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
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
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
      case 'cancelled':
        return 'bg-gray-100/50 border-gray-200 text-gray-700';
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
      cancelled: { ar: 'ملغى', en: 'Cancelled' },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
          <p className="text-[var(--text-secondary)]">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={approvedVessels.length === 0}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          {t.submitNew}
        </button>
      </div>

      {/* Dependency Notice */}
      <div className="bg-[var(--secondary)]/10 rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-2">{t.dependencyTitle}</h3>
            <p className="text-[var(--text-secondary)] text-sm">{t.dependencyMessage}</p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {showForm && (
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-lg shadow-black/5">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t.formTitle}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Vessel Selection - Only Approved Arrivals */}
              <div>
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.selectVessel}</label>
                <select
                  value={formData.vesselId}
                  onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                  className={`w-full px-4 py-3 bg-transparent border ${errors.vessel ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--bg-primary)]`}
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
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.duration}</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className={`w-full px-4 py-3 bg-transparent border ${errors.duration ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--bg-primary)]`}
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
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.preferredLocation}</label>
                <select
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  className="w-full px-4 py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--bg-primary)]"
                >
                  <option value="">{t.selectLocation}</option>
                  <option value="zone-a">{t.zoneA}</option>
                  <option value="zone-b">{t.zoneB}</option>
                  <option value="zone-c">{t.zoneC}</option>
                </select>
              </div>

              {/* Reason */}
              <div className="md:col-span-2">
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.reason}</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t.reasonPlaceholder}
                  rows={3}
                  className={`w-full px-4 py-3 bg-transparent border ${errors.reason ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none`}
                />
                {errors.reason && <p className="text-red-300 text-xs mt-1">{errors.reason}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl text-white font-bold transition-all duration-300"
              >
                {t.submitButton}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="px-6 py-3 border border-[var(--secondary)] hover:border-[var(--primary)] rounded-xl text-[var(--text-primary)] transition-all hover:bg-[var(--secondary)]/10"
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
          <div className="text-center text-[var(--text-secondary)] py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-8 border border-[var(--secondary)] rounded-md bg-[var(--bg-primary)]">
            {language === 'ar' ? 'لا توجد طلبات رسو.' : 'No anchorage requests found.'}
          </div>
        ) : requests.map((request) => (
          <div key={request.id} className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-400/20">
                  {getStatusIcon(request.status)}
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1">{request.vessel?.name || 'Unknown Vessel'}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    {t.requestId}: {request.id}
                  </p>
                </div>
              </div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                <div className="text-[var(--text-secondary)] text-xs mb-1">{t.duration}</div>
                <div className="text-[var(--text-primary)] font-medium">{request.duration}</div>
              </div>
              <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                <div className="text-[var(--text-secondary)] text-xs mb-1">{t.location}</div>
                <div className="text-[var(--text-primary)] font-medium">{request.location || 'N/A'}</div>
              </div>
              <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                <div className="text-[var(--text-secondary)] text-xs mb-1">{t.submittedOn}</div>
                <div className="text-[var(--text-primary)] font-medium">{new Date(request.created_at).toLocaleDateString()}</div>
              </div>
              <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                <div className="text-[var(--text-secondary)] text-xs mb-1">{t.status}</div>
                <div className="text-[var(--text-primary)] font-medium capitalize">{request.status}</div>
              </div>
            </div>

            {/* Rejection Info */}
            {request.status === 'rejected' && request.rejection_reason && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-700 text-sm mb-1">{request.rejection_reason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Simple Status Info instead of fake timeline */}
            <div className="border border-[var(--secondary)] rounded-xl p-4 bg-[var(--bg-primary)]">
              <h4 className="text-[var(--text-primary)] font-semibold text-sm mb-4">{t.approvalProcess}</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/20 border-2 border-green-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="font-medium mb-1 text-[var(--text-primary)]">Submitted</div>
                    <div className="text-[var(--text-secondary)] text-xs mb-1">{new Date(request.created_at).toLocaleString()}</div>
                    <div className="text-[var(--text-secondary)]/70 text-xs">Agent</div>
                  </div>
                </div>

                {request.status !== 'pending' && (
                  <div className="flex items-start gap-4">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${request.status === 'approved' ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'
                      }`}>
                      {request.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className={`font-medium mb-1 ${request.status === 'approved' ? 'text-[var(--text-primary)]' : 'text-red-700'}`}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </div>
                      <div className="text-[var(--text-secondary)] text-xs mb-1">{new Date(request.updated_at).toLocaleString()}</div>
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
