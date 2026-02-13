import { useState, useEffect } from 'react';
import { Ship, Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface ArrivalNotificationsProps {
  language: Language;
}

export function ArrivalNotifications({ language }: ArrivalNotificationsProps) {
  const t = translations[language]?.agent?.arrivals || translations.en.agent.arrivals;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vessel: '',
    imo: '',
    imoVerified: false,
    vesselId: null, // If found
    type: '',
    flag: '',
    arrivalDate: '',
    arrivalTime: '',
    purpose: '',
    cargo: '',
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIMO, setCheckingIMO] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadArrivals();
  }, []);

  const loadArrivals = async () => {
    try {
      const data = await agentService.getUpcomingArrivals();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load arrivals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIMO = async () => {
    if (!formData.imo || formData.imo.length !== 9) {
      setErrors({ ...errors, imo: 'IMO number must be 9 digits' });
      return;
    }
    setCheckingIMO(true);
    setErrors({});
    try {
      const result = await agentService.checkIMO(formData.imo);
      if (result.found) {
        setFormData({
          ...formData,
          imoVerified: true,
          vesselId: result.vessel.id,
          vessel: result.vessel.name,
          type: result.vessel.type,
          flag: result.vessel.flag || '',
        });
        // alert or toast that vessel found
      } else {
        setFormData({
          ...formData,
          imoVerified: true,
          vesselId: null,
          vessel: '', // clear to allow input
          type: '',
          flag: '',
        });
        alert(language === 'ar' ? 'السفينة غير موجودة في قاعدة البيانات. الرجاء إدخال البيانات.' : 'Vessel not found in database. Please enter details.');
      }
    } catch (error) {
      console.error("IMO check failed", error);
      setErrors({ ...errors, imo: 'Failed to verify IMO number' });
    } finally {
      setCheckingIMO(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.vessel) newErrors.vessel = t.errors.vesselRequired;
    if (!formData.arrivalDate) newErrors.arrivalDate = t.errors.dateRequired;
    if (!formData.arrivalTime) newErrors.arrivalTime = t.errors.timeRequired;
    // Type checking could be added

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time for ETA
      const eta = `${formData.arrivalDate}T${formData.arrivalTime}:00`;

      await agentService.submitArrival({
        imo_number: formData.imo,
        name: formData.vessel,
        type: formData.type || 'General Cargo',
        flag: formData.flag || 'Unknown',
        eta: eta
      });

      alert(language === 'ar' ? 'تم إرسال طلب الوصول بنجاح!' : 'Arrival notification submitted successfully!');
      setShowForm(false);
      setFormData({ vessel: '', imo: '', imoVerified: false, vesselId: null, type: '', flag: '', arrivalDate: '', arrivalTime: '', purpose: '', cargo: '' });
      setErrors({});
      loadArrivals(); // Refresh list
    } catch (error) {
      console.error("Submission failed", error);
      alert(language === 'ar' ? 'فشل إرسال الطلب' : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-600 animate-pulse" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100/50 border-green-200 text-green-700';
      case 'rejected': return 'bg-red-100/50 border-red-200 text-red-700';
      case 'pending': return 'bg-amber-100/50 border-amber-200 text-amber-700';
      default: return 'bg-blue-100/50 border-blue-200 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
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
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl text-white font-bold transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          {t.submitNew}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-lg shadow-black/5">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t.formTitle}</h2>

          {!formData.imoVerified ? (
            /* Step 1: IMO Check */
            <div className="space-y-4">
              <div>
                <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{language === 'ar' ? 'رقم المنظمة البحرية الدولية (IMO)' : 'IMO Number'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imo}
                    onChange={(e) => setFormData({ ...formData, imo: e.target.value })}
                    maxLength={9}
                    placeholder="9-digit IMO Number"
                    className={`flex-1 px-4 py-3 bg-transparent border ${errors.imo ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={handleCheckIMO}
                    disabled={checkingIMO || formData.imo.length !== 9}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-300"
                  >
                    {checkingIMO ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'ar' ? 'تحقق' : 'Check')}
                  </button>
                </div>
                {errors.imo && <p className="text-red-300 text-xs mt-1">{errors.imo}</p>}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                    setFormData({ vessel: '', imo: '', imoVerified: false, vesselId: null, type: '', flag: '', arrivalDate: '', arrivalTime: '', purpose: '', cargo: '' });
                  }}
                  className="px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-xl hover:bg-[var(--secondary)]/10"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Full Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[var(--secondary)]/10 border border-[var(--secondary)] rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 text-[var(--text-primary)] text-sm">
                  <Ship className="w-4 h-4" />
                  <span>IMO: {formData.imo}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Vessel Selection */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.selectVessel}</label>
                  <input
                    type="text"
                    value={formData.vessel}
                    onChange={(e) => setFormData({ ...formData, vessel: e.target.value })}
                    placeholder={language === 'ar' ? 'اسم السفينة' : 'Vessel Name'}
                    className={`w-full px-4 py-3 bg-transparent border ${errors.vessel ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
                    readOnly={!!formData.vesselId} // Read-only if fetched from DB
                  />
                  {errors.vessel && <p className="text-red-300 text-xs mt-1">{errors.vessel}</p>}
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.purpose}</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder={t.purposePlaceholder}
                    className={`w-full px-4 py-3 bg-transparent border ${errors.purpose ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
                  />
                  {errors.purpose && <p className="text-red-300 text-xs mt-1">{errors.purpose}</p>}
                </div>

                {/* Type & Flag (Visible if new vessel) */}
                {!formData.vesselId && (
                  <>
                    <div>
                      <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{language === 'ar' ? 'نوع السفينة' : 'Vessel Type'}</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--bg-primary)]"
                      >
                        <option value="">Select Type</option>
                        <option value="General Cargo">General Cargo</option>
                        <option value="Container Ship">Container Ship</option>
                        <option value="Oil Tanker">Oil Tanker</option>
                        <option value="Bulk Carrier">Bulk Carrier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{language === 'ar' ? 'علم السفينة' : 'Flag'}</label>
                      <input
                        type="text"
                        value={formData.flag}
                        onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                        placeholder="e.g. Panama"
                        className="w-full px-4 py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Arrival Date */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.arrivalDate}</label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    className={`w-full px-4 py-3 bg-transparent border ${errors.arrivalDate ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
                  />
                  {errors.arrivalDate && <p className="text-red-300 text-xs mt-1">{errors.arrivalDate}</p>}
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.arrivalTime}</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className={`w-full px-4 py-3 bg-transparent border ${errors.arrivalTime ? 'border-red-400' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
                  />
                  {errors.arrivalTime && <p className="text-red-300 text-xs mt-1">{errors.arrivalTime}</p>}
                </div>

                {/* Cargo Info */}
                <div className="md:col-span-2">
                  <label className="block text-[var(--text-primary)] text-sm font-medium mb-2">{t.cargoInfo}</label>
                  <textarea
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder={t.cargoPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl text-white font-bold transition-all duration-300"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.submitButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                    setFormData({ vessel: '', imo: '', imoVerified: false, vesselId: null, type: '', flag: '', arrivalDate: '', arrivalTime: '', purpose: '', cargo: '' });
                  }}
                  className="px-6 py-3 border border-[var(--secondary)] hover:border-[var(--primary)] rounded-xl text-[var(--text-primary)] transition-all hover:bg-[var(--secondary)]/10"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-8 border border-[var(--secondary)] rounded-md bg-[var(--bg-primary)]">
            {language === 'ar' ? 'لا توجد إشعارات وصول.' : 'No arrival notifications found.'}
          </div>
        ) : notifications.map((notification) => {
          const hasManifest = notification.manifests && notification.manifests.length > 0;
          return (
            <div key={notification.id} className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-400/20">
                    {getStatusIcon(notification.status)}
                  </div>
                  <div>
                    <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1">{notification.name}</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-[var(--text-secondary)] text-sm">{t.requestId}: {notification.id}</p>
                      <div className="flex gap-4 text-xs text-[var(--text-secondary)]/70">
                        <span>IMO: {notification.imo_number}</span>
                        <span>Type: {notification.type}</span>
                        <span>Flag: {notification.flag}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(notification.status)}`}>
                    {getStatusLabel(notification.status)}
                  </span>
                  {/* Manifest Status Badge */}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs border ${hasManifest ? 'bg-green-100/50 border-green-200 text-green-700' : 'bg-[var(--bg-primary)] border-[var(--secondary)] text-[var(--text-secondary)]'}`}>
                    {hasManifest ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Manifest Submitted
                      </span>
                    ) : (
                      <span>Manifest Pending</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                  <div className="text-[var(--text-secondary)] text-xs mb-1">{t.expectedArrival}</div>
                  <div className="text-[var(--text-primary)] font-medium">{notification.eta}</div>
                </div>
                <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                  <div className="text-[var(--text-secondary)] text-xs mb-1">{t.submittedOn}</div>
                  <div className="text-[var(--text-primary)] font-medium">{new Date(notification.created_at).toLocaleString()}</div>
                </div>
                {notification.approvedBy && (
                  <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                    <div className="text-[var(--text-secondary)] text-xs mb-1">{t.approvedBy}</div>
                    <div className="text-[var(--text-primary)] font-medium">{notification.approvedBy}</div>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {notification.status === 'rejected' && notification.rejectionReason && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-red-200 font-semibold text-sm mb-1">{t.rejectionReason}</div>
                      <div className="text-red-200/80 text-sm">{notification.rejectionReason}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
