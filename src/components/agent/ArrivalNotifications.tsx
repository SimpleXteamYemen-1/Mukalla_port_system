import { useState, useEffect } from 'react';
import { Ship, Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { Language } from '../../App';
import { toast } from 'react-toastify';
import { translations } from '../../utils/translations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define Zod schema matching the backend StoreVesselArrivalRequest
const arrivalSchema = z.object({
  imo: z.string().regex(/^IMO\d{7}$/, { message: 'IMO number must be exactly 9 characters starting with "IMO" followed by 7 digits' }),
  vessel: z.string().min(1, { message: 'Vessel name is required' }),
  type: z.string().min(1, { message: 'Vessel type is required' }),
  flag: z.string().min(1, { message: 'Flag is required' }).optional().or(z.literal('')),
  arrivalDate: z.string().min(1, { message: 'Arrival date is required' }),
  arrivalTime: z.string().min(1, { message: 'Arrival time is required' }),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  cargo: z.string().optional(),
});

type ArrivalFormData = z.infer<typeof arrivalSchema>;

interface ArrivalNotificationsProps {
  language: Language;
}

export function ArrivalNotifications({ language }: ArrivalNotificationsProps) {
  const t = translations[language]?.agent?.arrivals || translations.en.agent.arrivals;
  const [showForm, setShowForm] = useState(false);
  const [vesselId, setVesselId] = useState<number | null>(null);
  const [imoVerified, setImoVerified] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIMO, setCheckingIMO] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ArrivalFormData>({
    resolver: zodResolver(arrivalSchema),
    defaultValues: {
      imo: '',
      vessel: '',
      type: '',
      flag: '',
      arrivalDate: '',
      arrivalTime: '',
      purpose: '',
      cargo: '',
    },
  });

  const watchImo = watch('imo');

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
    const currentImo = getValues('imo');
    if (!currentImo || !/^IMO\d{7}$/.test(currentImo)) {
      toast.error('IMO number must be exactly 9 characters starting with "IMO"');
      return;
    }
    setCheckingIMO(true);
    try {
      const result = await agentService.checkIMO(currentImo);
      if (result.found) {
        setImoVerified(true);
        setVesselId(result.vessel.id);
        setValue('vessel', result.vessel.name, { shouldValidate: true });
        setValue('type', result.vessel.type, { shouldValidate: true });
        setValue('flag', result.vessel.flag || '', { shouldValidate: true });
      } else {
        setImoVerified(true);
        setVesselId(null);
        setValue('vessel', '');
        setValue('type', '');
        setValue('flag', '');
        toast.info(language === 'ar' ? 'السفينة غير موجودة في قاعدة البيانات. الرجاء إدخال البيانات.' : 'Vessel not found in database. Please enter details.');
      }
    } catch (error) {
      console.error("IMO check failed", error);
      toast.error('Failed to verify IMO number');
    } finally {
      setCheckingIMO(false);
    }
  };

  const onSubmit = async (data: ArrivalFormData) => {
    try {
      const eta = `${data.arrivalDate}T${data.arrivalTime}:00`;

      await agentService.submitArrival({
        imo_number: data.imo,
        name: data.vessel,
        type: data.type || 'container',
        flag: data.flag || 'Unknown',
        eta: eta
      });

      toast.success(language === 'ar' ? 'تم إرسال طلب الوصول بنجاح!' : 'Arrival notification submitted successfully!');
      setShowForm(false);
      reset();
      setImoVerified(false);
      setVesselId(null);
      loadArrivals();
    } catch (error: any) {
      console.error("Submission failed", error);
      if (error.response?.data?.errors) {
        // Display Laravel validation errors
        Object.values(error.response.data.errors).forEach((err: any) => toast.error(err[0]));
      } else {
        toast.error(language === 'ar' ? 'فشل إرسال الطلب' : 'Submission failed');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-[var(--danger)]" />;
      case 'pending': return <Clock className="w-5 h-5 text-[var(--warning)] animate-pulse" />;
      default: return <AlertCircle className="w-5 h-5 text-[var(--info)]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'status-success';
      case 'rejected': return 'status-danger';
      case 'pending':
      case 'awaiting': return 'status-warning';
      default: return 'status-info';
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
      <div className="flex items-center justify-between mb-8 group">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 cursor-default">{t.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium">{t.subtitle}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
            {t.submitNew}
          </button>
        )}
      </div>

      {/* Submission Form - Glassmorphism */}
      {showForm && (
        <div className="bg-[var(--surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--secondary)]/30 p-8 mb-8 shadow-2xl animate-in fade-in zoom-in duration-500 ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6">{t.formTitle}</h2>

          {!imoVerified ? (
            /* Step 1: IMO Check */
            <div className="space-y-4">
              <div>
                <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{language === 'ar' ? 'رقم المنظمة البحرية الدولية (IMO)' : 'IMO Number'}</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    {...register('imo')}
                    maxLength={10}
                    placeholder="e.g. IMO1234567"
                    className={`flex-1 px-4 py-3 bg-[var(--background)] border ${errors.imo ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={handleCheckIMO}
                    disabled={checkingIMO || !watchImo}
                    className="btn-primary min-w-[160px]"
                  >
                    {checkingIMO ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'ar' ? 'تحقق من IMO' : 'Verify IMO')}
                  </button>
                </div>
                {errors.imo && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.imo.message}</p>}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                    setImoVerified(false);
                    setVesselId(null);
                  }}
                  className="btn-ghost"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Full Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="alert-info">
                <Ship className="w-5 h-5 flex-shrink-0" />
                <div className="font-bold">IMO: {getValues('imo')}</div>
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] ml-auto" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Vessel Selection */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{t.selectVessel}</label>
                  <input
                    type="text"
                    {...register('vessel')}
                    placeholder={language === 'ar' ? 'اسم السفينة' : 'Vessel Name'}
                    className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.vessel ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                    readOnly={!!vesselId} // Read-only if fetched from DB
                  />
                  {errors.vessel && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.vessel.message}</p>}
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{t.purpose}</label>
                  <input
                    type="text"
                    {...register('purpose')}
                    placeholder={t.purposePlaceholder}
                    className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.purpose ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                  />
                  {errors.purpose && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.purpose.message}</p>}
                </div>

                {/* Type & Flag (Visible if new vessel) */}
                {!vesselId && (
                  <>
                    <div>
                      <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{language === 'ar' ? 'نوع السفينة' : 'Vessel Type'}</label>
                      <select
                        {...register('type')}
                        className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.type ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all [&>option]:bg-[var(--surface)]`}
                      >
                        <option value="">Select Type</option>
                        <option value="general">General Cargo</option>
                        <option value="container">Container Ship</option>
                        <option value="tanker">Oil Tanker</option>
                        <option value="bulk">Bulk Carrier</option>
                        <option value="ro-ro">Ro-Ro</option>
                      </select>
                      {errors.type && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.type.message}</p>}
                    </div>
                    <div>
                      <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{language === 'ar' ? 'علم السفينة' : 'Flag'}</label>
                      <input
                        type="text"
                        {...register('flag')}
                        placeholder="e.g. Panama"
                        className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.flag ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                      />
                      {errors.flag && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.flag.message}</p>}
                    </div>
                  </>
                )}

                {/* Arrival Date */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{t.arrivalDate}</label>
                  <input
                    type="date"
                    {...register('arrivalDate')}
                    className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.arrivalDate ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                  />
                  {errors.arrivalDate && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.arrivalDate.message}</p>}
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{t.arrivalTime}</label>
                  <input
                    type="time"
                    {...register('arrivalTime')}
                    className={`w-full px-4 py-3 bg-[var(--background)] border ${errors.arrivalTime ? 'border-[var(--danger)]' : 'border-[var(--secondary)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all`}
                  />
                  {errors.arrivalTime && <p className="text-[var(--danger)] text-xs font-bold mt-2">{errors.arrivalTime.message}</p>}
                </div>

                {/* Cargo Info */}
                <div className="md:col-span-2">
                  <label className="block text-[var(--text-primary)] text-sm font-bold mb-3">{t.cargoInfo}</label>
                  <textarea
                    {...register('cargo')}
                    placeholder={t.cargoPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 py-4 text-lg"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t.submitButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                    setImoVerified(false);
                    setVesselId(null);
                  }}
                  className="btn-secondary px-10 py-4 font-bold"
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
          <div className="text-center text-[var(--text-secondary)] py-20 bg-[var(--surface)] border border-[var(--secondary)] rounded-3xl">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
            <p className="font-bold">{language === 'ar' ? 'جاري التحميل...' : 'Synchronizing Data...'}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-16 border-2 border-dashed border-[var(--secondary)] rounded-3xl bg-[var(--surface)]/50">
            <Ship className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">{language === 'ar' ? 'لا توجد إشعارات وصول.' : 'No arrival notifications found.'}</p>
          </div>
        ) : notifications.map((notification) => {
          const hasManifest = notification.manifests && notification.manifests.length > 0;
          return (
            <div key={notification.id} className="card-base card-hover p-6 group relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 ${getStatusColor(notification.status)}`}>
                    {getStatusIcon(notification.status)}
                  </div>
                  <div>
                    <h3 className="text-[var(--text-primary)] font-black text-xl mb-1">{notification.name}</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-[var(--text-secondary)] text-sm font-bold">{t.requestId}: <span className="font-mono">{notification.id}</span></p>
                      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]/80 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Ship className="w-3 h-3" /> IMO: {notification.imo_number}</span>
                        <span>Type: {notification.type}</span>
                        <span>Flag: {notification.flag}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <span className={`inline-block px-5 py-2 rounded-2xl text-sm font-black border-2 ${getStatusColor(notification.status)}`}>
                    {getStatusLabel(notification.status)}
                  </span>
                  {/* Manifest Status Badge */}
                  <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-bold border ${hasManifest ? 'status-success' : 'bg-[var(--surface)] border-[var(--secondary)] text-[var(--text-secondary)]'}`}>
                    {hasManifest ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Manifest Submitted
                      </span>
                    ) : (
                      <span>Manifest Pending</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-[var(--secondary)] rounded-2xl p-4 bg-[var(--background)]/40 hover:border-[var(--primary)] transition-colors">
                  <div className="text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest mb-1">{t.expectedArrival}</div>
                  <div className="text-[var(--text-primary)] font-black">{notification.eta}</div>
                </div>
                <div className="border border-[var(--secondary)] rounded-2xl p-4 bg-[var(--background)]/40 hover:border-[var(--primary)] transition-colors">
                  <div className="text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest mb-1">{t.submittedOn}</div>
                  <div className="text-[var(--text-primary)] font-black">{new Date(notification.created_at).toLocaleString()}</div>
                </div>
                {notification.approvedBy && (
                  <div className="border border-[var(--secondary)] rounded-2xl p-4 bg-[var(--background)]/40 hover:border-[var(--primary)] transition-colors">
                    <div className="text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest mb-1">{t.approvedBy}</div>
                    <div className="text-[var(--text-primary)] font-black">{notification.approvedBy}</div>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {notification.status === 'rejected' && notification.rejectionReason && (
                <div className="alert-danger mb-0">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-sm mb-1 uppercase tracking-wider">{t.rejectionReason}</div>
                    <div className="text-sm font-medium">{notification.rejectionReason}</div>
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
