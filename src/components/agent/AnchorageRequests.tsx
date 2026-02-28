import { useState, useEffect } from 'react';
import { Anchor, AlertCircle, CheckCircle2, XCircle, Clock, Plus, Loader2, Calendar } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { Language } from '../../App';
import { toast } from 'react-toastify';
import { translations } from '../../utils/translations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const anchorageSchema = z.object({
  vesselId: z.string().min(1, { message: 'Please select a vessel' }),
  duration: z.string().min(1, { message: 'Duration is required' }),
  reason: z.string().min(1, { message: 'Reason is required' }),
  preferredLocation: z.string().optional(),
});

type AnchorageFormData = z.infer<typeof anchorageSchema>;

interface AnchorageRequestsProps {
  language: Language;
}

export function AnchorageRequests({ language }: AnchorageRequestsProps) {
  const t = translations[language]?.agent?.anchorage || translations.en.agent.anchorage;
  const [showForm, setShowForm] = useState(false);
  const [approvedVessels, setApprovedVessels] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnchorageFormData>({
    resolver: zodResolver(anchorageSchema),
    defaultValues: {
      vesselId: '',
      duration: '',
      reason: '',
      preferredLocation: '',
    },
  });

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

  const onSubmit = async (data: AnchorageFormData) => {
    try {
      await agentService.submitAnchorageRequest({
        vessel_id: data.vesselId,
        duration: data.duration,
        reason: data.reason,
        location: data.preferredLocation
      });

      toast.success(language === 'ar' ? 'تم إرسال طلب الرسو بنجاح!' : 'Anchorage request submitted successfully!');
      setShowForm(false);
      reset();
      fetchData();
    } catch (error: any) {
      console.error("Submission failed", error);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((err: any) => toast.error(err[0]));
      } else {
        toast.error(language === 'ar' ? 'فشل إرسال الطلب' : 'Submission failed');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-[var(--danger)]" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-[var(--warning)] animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[var(--info)]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed': return 'status-success';
      case 'rejected': return 'status-danger';
      case 'pending': return 'status-warning';
      case 'cancelled': return 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--secondary)]';
      default: return 'status-info';
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
      <div className="flex items-center justify-between mb-8 group">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 cursor-default">{t.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium">{t.subtitle}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={approvedVessels.length === 0}
            className="btn-primary"
          >
            <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
            {t.submitNew}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--secondary)] p-8 mb-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <Anchor className="w-6 h-6 text-[var(--primary)]" />
            {t.formTitle}
          </h2>

          <div className="alert-warning mb-8">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold mb-1">{t.dependencyTitle}</h3>
              <p className="text-sm font-medium opacity-90">{t.dependencyMessage}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[var(--text-primary)] text-sm font-black uppercase tracking-widest">{t.selectVessel}</label>
                <select
                  {...register('vesselId')}
                  className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.vesselId ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--surface)]`}
                >
                  <option value="">{t.selectVesselPlaceholder}</option>
                  {approvedVessels.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {errors.vesselId && <p className="text-[var(--danger)] text-xs font-bold mt-1">{errors.vesselId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-[var(--text-primary)] text-sm font-black uppercase tracking-widest">{t.duration}</label>
                <select
                  {...register('duration')}
                  className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.duration ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--surface)]`}
                >
                  <option value="">{t.selectDuration}</option>
                  <option value="24">24 {t.hours}</option>
                  <option value="48">48 {t.hours}</option>
                  <option value="72">72 {t.hours}</option>
                  <option value="custom">{t.custom}</option>
                </select>
                {errors.duration && <p className="text-[var(--danger)] text-xs font-bold mt-1">{errors.duration.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-[var(--text-primary)] text-sm font-black uppercase tracking-widest">{t.preferredLocation}</label>
                <select
                  {...register('preferredLocation')}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--secondary)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all [&>option]:bg-[var(--surface)]"
                >
                  <option value="">{t.selectLocation}</option>
                  <option value="zone-a">{t.zoneA}</option>
                  <option value="zone-b">{t.zoneB}</option>
                  <option value="zone-c">{t.zoneC}</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[var(--text-primary)] text-sm font-black uppercase tracking-widest">{t.reason}</label>
                <textarea
                  {...register('reason')}
                  placeholder={t.reasonPlaceholder}
                  rows={3}
                  className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.reason ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-2xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all resize-none`}
                />
                {errors.reason && <p className="text-[var(--danger)] text-xs font-bold mt-1">{errors.reason.message}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 py-4"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t.submitButton}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="btn-secondary px-8 py-4"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-bold">{language === 'ar' ? 'جاري التحميل...' : 'Synchronizing anchorage data...'}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[var(--secondary)] rounded-3xl bg-[var(--surface)]/50">
            <Anchor className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'لا توجد طلبات رسو.' : 'No anchorage requests found.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-[var(--surface)] rounded-3xl border border-[var(--secondary)] p-6 card-interaction group relative overflow-hidden shadow-sm">
                {/* Accent line for request type */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <Anchor className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[var(--text-primary)] font-black text-xl mb-1 group-hover:text-[var(--primary)] transition-colors">{request.vessel?.name || 'Unknown Vessel'}</h3>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-[var(--secondary)] rounded-lg text-[var(--text-secondary)] text-[10px] font-black font-mono">#{request.id}</span>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-black border-2 shadow-sm ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="border border-[var(--secondary)]/50 rounded-2xl p-4 bg-[var(--background)]/50">
                    <div className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-1">{t.duration}</div>
                    <div className="text-[var(--text-primary)] font-black text-lg">{request.duration} <span className="text-xs font-bold opacity-60">HRS</span></div>
                  </div>
                  <div className="border border-[var(--secondary)]/50 rounded-2xl p-4 bg-[var(--background)]/50">
                    <div className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-1">{t.location}</div>
                    <div className="text-[var(--text-primary)] font-black text-lg truncate">{request.location || 'N/A'}</div>
                  </div>
                  <div className="md:col-span-2 border border-[var(--secondary)]/50 rounded-2xl p-4 bg-[var(--background)]/50">
                    <div className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-1">{t.reason}</div>
                    <div className="text-[var(--text-primary)] font-medium text-sm line-clamp-2">{request.reason || 'N/A'}</div>
                  </div>
                </div>

                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="alert-danger mb-8">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm mb-1 uppercase tracking-widest">Rejection Reason</div>
                      <div className="text-sm font-medium opacity-90">{request.rejection_reason}</div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-[var(--secondary)]/30">
                  <h4 className="text-[var(--text-primary)] font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    {t.approvalProcess}
                  </h4>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--success)]/10 border-2 border-[var(--success)] shadow-sm shadow-[var(--success)]/20">
                        <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-black text-xs">{language === 'ar' ? 'تم التقديم' : 'Submitted'}</div>
                        <div className="text-[var(--text-secondary)] text-[10px] font-bold">{new Date(request.created_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex-1 border-t-2 border-dashed border-[var(--secondary)]" />

                    {request.status !== 'pending' ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${request.status === 'approved' ? 'bg-[var(--success)]/10 border-[var(--success)] shadow-[var(--success)]/20' : 'bg-[var(--danger)]/10 border-[var(--danger)] shadow-[var(--danger)]/20'
                          }`}>
                          {request.status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-[var(--success)]" /> : <XCircle className="w-5 h-5 text-[var(--danger)]" />}
                        </div>
                        <div>
                          <div className={`font-black text-xs ${request.status === 'approved' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {request.status === 'approved' ? (language === 'ar' ? 'مقبول' : 'Approved') : (language === 'ar' ? 'مرفوض' : 'Rejected')}
                          </div>
                          <div className="text-[var(--text-secondary)] text-[10px] font-bold">{new Date(request.updated_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--background)] border-2 border-[var(--secondary)] border-dashed">
                          <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
                        </div>
                        <div className="text-[var(--text-secondary)] font-black text-xs uppercase tracking-widest">{t.pending}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
