import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CheckSquare, Clock, FileText, Loader2, Link } from 'lucide-react';
import api from '../../services/api';

// Defined based on new model schema
interface ContainerData {
  id: number;
  vessel_id: number;
  manifest_file_path: string;
  port_of_loading: string;
  arrival_date: string;
  description_of_goods: string;
  storage_type: 'chemical' | 'frozen' | 'dry';
  consignee_name: string;
  consignee_phone: string;
  status: string;
  arrival_notification?: {
    id: number;
    name: string;
  };
}

export function MyContainers({ language, userEmail }: { language: 'ar' | 'en'; userEmail: string }) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/trader/my-containers');
      setContainers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'cleared':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"><CheckSquare className="w-3.5 h-3.5" /> {isRTL ? 'متاحة للاستلام' : 'Cleared for Pickup'}</span>;
      case 'in_wharf':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"><MapPin className="w-3.5 h-3.5" /> {isRTL ? 'في المخزن' : 'Routed to Block'}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"><Clock className="w-3.5 h-3.5" /> {isRTL ? 'قيد المراجعة' : 'Pending Allocation'}</span>;
    }
  };

  if (isLoading) {
    return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] drop-shadow-md" /></div>;
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl rtl-text-right' : 'ltr'}`}>
      {/* Immersive Header Block */}
      <div className="bg-gradient-to-br from-[var(--primary)] via-blue-600 to-indigo-700 rounded-2xl p-8 lg:p-10 text-white shadow-xl shadow-[var(--primary)]/20 relative overflow-hidden">
        {/* Background Decorative Graphic */}
        <Package className={`absolute -bottom-16 opacity-10 w-80 h-80 ${isRTL ? '-left-16 rotate-12' : '-right-16 -rotate-12'} pointer-events-none`} />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md mb-2">
                  <Link className="w-3 h-3" /> {isRTL ? 'إتصال آمن' : 'Encrypted Registry Link'}
                </span>
                <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                   {isRTL ? 'البضائع و الحاويات المسجلة' : 'My Monitored Payloads'}
                </h2>
                <p className="text-blue-50 text-sm lg:text-base max-w-xl font-medium opacity-90">
                   {isRTL 
                       ? 'الأنظمة الذكية بالميناء قامت بمقارنة حسابك تلقائياً مع بوالص الشحن لتمنحك تحكماً كاملاً قبل الاستخراج.' 
                       : 'Algorithms successfully matched your user profile parameters globally linking incoming logistics assets seamlessly into your direct workflow overview.'}
                </p>
            </div>

            <div className="mt-6 md:mt-0 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center min-w-[120px]">
                <span className="text-4xl font-black drop-shadow-md">{containers.length}</span>
                <span className="text-xs mt-1 font-bold tracking-wider uppercase opacity-90">{isRTL ? 'أرصدة مجمعة' : 'Matched Assets'}</span>
            </div>
        </div>
      </div>

      {containers.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--secondary)]/20 rounded-2xl p-16 text-center shadow-sm">
          <div className="bg-[var(--secondary)]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--secondary)]/20">
             <Link className="w-8 h-8 text-[var(--secondary)] opacity-60" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
             {isRTL ? 'لم يتم رصد ارتباطات نشطة' : 'No Active Shipments Bridged'}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
             {isRTL 
               ? 'سيتم تحديث هذا السجل الخفي تلقائياً في ثوانٍ بمجرد أن يقوم المخلص الجمركي برفع بوالص شحن تحتوي على رقم هاتفك.' 
               : 'This intelligent table will dynamically map contents anytime the authorities securely upload incoming arrival manifests associated explicitly via your numeric phone profile identifiers.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {containers.map((container, idx) => (
            <div key={container.id} 
              className="bg-[var(--bg-card)] border border-[var(--secondary)]/20 hover:border-[var(--primary)]/50 transition-all rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] group flex flex-col h-full"
              style={{animationDelay: `${idx * 100}ms`}}
            >
              <div className="flex justify-between items-start mb-5 border-b border-[var(--secondary)]/10 pb-4">
                <div>
                   <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[var(--primary)]" />
                      {container.arrival_notification?.name || 'Carrier Matrix'}
                   </h3>
                   <span className="text-xs text-[var(--text-secondary)] font-mono tracking-widest opacity-80 mt-1 block">
                      #{btoa(container.id.toString()).toUpperCase().substring(0,6)} • {container.port_of_loading}
                   </span>
                </div>
                {getStatusBadge(container.status)}
              </div>

              <div className="space-y-5 flex-grow">
                {/* Description Focus */}
                <div className="flex items-start gap-4 bg-[var(--bg-primary)]/40 p-4 rounded-xl border border-[var(--secondary)]/10">
                   <div className={`p-2.5 rounded-lg flex-shrink-0 ${container.storage_type==='chemical'?'bg-amber-100 text-amber-600':container.storage_type==='frozen'?'bg-cyan-100 text-cyan-600':'bg-slate-100 text-slate-600'} dark:bg-opacity-10`}>
                      <Package className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold tracking-wider mb-0.5">{isRTL ? 'المستخرج المعترف به' : 'Identified Payload Details'}</span>
                     <span className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{container.description_of_goods}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-[var(--primary)]/10 p-2 rounded-full border border-[var(--primary)]/20">
                           <Calendar className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                        <div>
                            <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold">{isRTL ? 'تاريخ الرسو' : 'Arrival Point'}</span>
                            <span className="text-sm font-black text-[var(--text-primary)]">{container.arrival_date}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
