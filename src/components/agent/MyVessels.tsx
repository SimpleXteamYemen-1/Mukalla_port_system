import { useState, useEffect } from 'react';
import { agentService } from '../../services/agentService';
import { Ship, Plus, Search, Navigation, ChevronRight, Trash2 } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface MyVesselsProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function MyVessels({ language, onNavigate }: MyVesselsProps) {
  const t = translations[language]?.agent?.vessels || translations.en.agent.vessels;
  const isRTL = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const data = await agentService.getVessels();
        const mapped = data.map((v: any) => ({
          ...v,
          arrivalStatus: v.status === 'active' ? 'approved' : (v.status === 'awaiting' ? 'pending' : v.status)
        }));
        setVessels(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVessels();
  }, []);

  const handleDeleteVessel = async (id: number) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من إزالة هذه السفينة؟' : 'Are you sure you want to remove this vessel?')) return;
    try {
      await api.delete(`/agent/vessels/${id}`);
      setVessels(vessels.filter(v => v.id !== id));
      toast.success(isRTL ? 'تم إزالة السفينة بنجاح' : 'Vessel removed successfully');
    } catch (error) {
      console.error(error);
      toast.error(isRTL ? 'حدث خطأ أثناء الإزالة' : 'Failed to remove vessel');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
      case 'awaiting': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'inactive': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getAccentBorder = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved': return 'border-l-4 border-l-green-500 dark:border-l-green-400';
      case 'rejected': return 'border-l-4 border-l-red-500 dark:border-l-red-400';
      case 'pending':
      case 'awaiting': return 'border-l-4 border-l-amber-500 dark:border-l-amber-400';
      case 'inactive': return 'border-l-4 border-l-slate-400';
      default: return 'border-l-4 border-l-blue-500 dark:border-l-blue-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      awaiting: { ar: 'قيد الانتظار', en: 'Awaiting' },
      active: { ar: 'نشط', en: 'Active' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
    };
    return labels[status]?.[language] || status;
  };

  const filteredVessels = vessels.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || v.imo_number?.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={() => onNavigate('arrivals')}
          className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.addVessel}
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث عن سفينة...' : 'Search vessels...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 dark:focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Vessels Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center">
          <LoadingIndicator type="line-spinner" size="lg" label={language === 'ar' ? 'جاري التحميل...' : 'Loading vessels...'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVessels.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 dark:text-slate-400 py-16 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
              <Ship className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p className="font-medium">{language === 'ar' ? 'لا توجد سفن متطابقة.' : 'No matching vessels found.'}</p>
            </div>
          ) : (
            filteredVessels.map((vessel) => (
              <div
                key={vessel.id}
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${getAccentBorder(vessel.status)} rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Ship className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(vessel.status)}`}>
                    {getStatusLabel(vessel.status)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1 line-clamp-1">{vessel.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">IMO: {vessel.imo_number}</p>

                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {[
                    { label: language === 'ar' ? 'النوع' : 'Type', value: vessel.type },
                    { label: language === 'ar' ? 'العلم' : 'Flag', value: vessel.flag },
                    { label: language === 'ar' ? 'حمولة الساكنة' : 'DWT', value: vessel.dwt || 'N/A' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-slate-900 dark:text-slate-50 font-medium truncate max-w-[50%]">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider mb-1">{language === 'ar' ? 'الموقع الحالي' : 'CURRENT POSITION'}</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium text-sm flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {vessel.location || 'At Sea'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteVessel(vessel.id)}
                      className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all shadow-sm"
                      title={isRTL ? 'إزالة' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('vesselId', vessel.imo_number);
                        window.history.pushState({}, '', url);
                        onNavigate('arrivals');
                      }}
                      className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                      <ChevronRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
