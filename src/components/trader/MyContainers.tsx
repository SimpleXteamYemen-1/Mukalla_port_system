import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CheckSquare, Clock, FileText, Ship, Search, Filter, RefreshCw, Link } from 'lucide-react';
import { Language } from '../../App';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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
  vessel?: {
    id: number;
    name: string;
    wharf?: {
      name: string;
    };
  };
  arrival_notification?: {
    id: number;
    name: string;
    wharf?: {
      name: string;
    };
  };
}

export function MyContainers({ language, userEmail }: { language: Language; userEmail: string }) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trader/my-containers');
      setContainers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'discharged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <CheckSquare className="w-3.5 h-3.5" /> {isRTL ? 'تم التفريغ' : 'Discharged'}
          </span>
        );
      case 'in storage':
      case 'in_storage':
      case 'in_wharf':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <MapPin className="w-3.5 h-3.5" /> {isRTL ? 'في التخزين' : 'In Storage'}
          </span>
        );
      case 'cleared':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
             <CheckSquare className="w-3.5 h-3.5" /> {isRTL ? 'جاهزة للاستلام' : 'Ready for Pickup'}
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <Ship className="w-3.5 h-3.5" /> {isRTL ? 'وصلت' : 'Arrived'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <Clock className="w-3.5 h-3.5" /> {isRTL ? 'قيد المراجعة' : 'Pending'}
          </span>
        );
    }
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch =
      container.description_of_goods.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (container.arrival_notification?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] min-h-full">
        <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري تحميل البضائع...' : 'Retrieving secure assets...'} />
      </div>
    );
  }

  return (
    <div className={`p-6 bg-[var(--bg-primary)] min-h-full space-y-6 ${isRTL ? 'rtl rtl-text-right' : 'ltr'}`}>
      {/* Immersive Header Block */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Background Decorative Graphic */}
        <Package className={`absolute -bottom-16 opacity-10 w-80 h-80 ${isRTL ? '-left-16 rotate-12' : '-right-16 -rotate-12'} pointer-events-none`} />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    <Link className="w-3 h-3" /> {isRTL ? 'إتصال آمن' : 'Encrypted Registry Link'}
                  </span>
                  <button onClick={fetchContainers} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
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

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]`} />
          <input
            type="text"
            placeholder={isRTL ? 'ابحث عن حاوية أو سفينة...' : 'Search by container or vessel...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-2.5 bg-[var(--card)] border border-[var(--secondary)]/30 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
          />
        </div>
        <div className="relative">
          <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none`} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${isRTL ? 'pr-10' : 'pl-10'} pr-8 py-2.5 bg-[var(--card)] border border-[var(--secondary)]/30 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[180px]`}
          >
            <option value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
            <option value="Discharged">{isRTL ? 'تم التفريغ' : 'Discharged'}</option>
            <option value="In Storage">{isRTL ? 'في التخزين' : 'In Storage'}</option>
          </select>
        </div>
      </div>

      {filteredContainers.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--secondary)]/20 rounded-2xl p-16 text-center shadow-sm">
          <div className="bg-[var(--secondary)]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--secondary)]/20">
             <Link className="w-8 h-8 text-[var(--text-secondary)] opacity-40" />
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
          {filteredContainers.map((container, idx) => (
            <div key={container.id} 
              className="bg-[var(--card)] border border-[var(--secondary)]/20 hover:border-blue-500/50 transition-all rounded-2xl p-6 shadow-sm group flex flex-col h-full"
              style={{animationDelay: `${idx * 100}ms`}}
            >
              <div className="flex justify-between items-start mb-5 border-b border-[var(--secondary)]/10 pb-4">
                <div>
                   <h3 className="font-extrabold text-lg text-[var(--text-primary)] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      {container.arrival_notification?.name || 'Carrier Matrix'}
                   </h3>
                   <span className="text-xs text-[var(--text-secondary)] font-mono tracking-widest opacity-80 mt-1 block uppercase">
                      ID: {container.id.toString().padStart(6, '0')} • {container.port_of_loading}
                   </span>
                </div>
                {getStatusBadge(container.status)}
              </div>

              <div className="space-y-5 flex-grow">
                {/* Description Focus */}
                <div className="flex items-start gap-4 bg-[var(--bg-primary)]/40 p-4 rounded-xl border border-[var(--secondary)]/10">
                   <div className={`p-2.5 rounded-lg flex-shrink-0 ${container.storage_type==='chemical'?'bg-amber-500/10 text-amber-500':container.storage_type==='frozen'?'bg-cyan-500/10 text-cyan-500':'bg-slate-500/10 text-slate-500'}`}>
                      <Package className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold tracking-wider mb-0.5">{isRTL ? 'المستخرج المعترف به' : 'Identified Payload Details'}</span>
                     <span className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{container.description_of_goods}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-full border border-blue-500/20">
                         <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                          <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold">{isRTL ? 'تاريخ الرسو' : 'Arrival Date'}</span>
                          <span className="text-sm font-black text-[var(--text-primary)]">{container.arrival_date}</span>
                      </div>
                  </div>

                  <div className="flex items-center gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-full border border-amber-500/20">
                         <MapPin className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                          <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold">{isRTL ? 'موقع الرصيف' : 'Wharf Location'}</span>
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {container.vessel?.wharf?.name || container.arrival_notification?.wharf?.name || (isRTL ? 'قيد التخصيص' : 'TBD')}
                          </span>
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
