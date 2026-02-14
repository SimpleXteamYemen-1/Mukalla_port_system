import { useState, useEffect } from 'react';
import { agentService } from '../../services/agentService';
import { Ship, Plus, Search, Filter, Navigation, ChevronRight, Loader2 } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface MyVesselsProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function MyVessels({ language, onNavigate }: MyVesselsProps) {
  const t = translations[language]?.agent?.vessels || translations.en.agent.vessels;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved': return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400';
      case 'rejected': return 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400';
      case 'pending':
      case 'awaiting': return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400';
      case 'inactive': return 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-400';
      default: return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400';
    }
  };

  const getAccentBorder = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved': return 'border-l-4 border-l-emerald-500';
      case 'rejected': return 'border-l-4 border-l-rose-500';
      case 'pending':
      case 'awaiting': return 'border-l-4 border-l-amber-500';
      case 'inactive': return 'border-l-4 border-l-slate-400';
      default: return 'border-l-4 border-l-blue-500';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 group">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 cursor-default">{t.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium">{t.subtitle}</p>
        </div>
        <button
          onClick={() => onNavigate('arrivals')}
          className="btn-primary"
        >
          <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
          {t.addVessel}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث عن سفينة...' : 'Search vessels...'}
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--secondary)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all placeholder-[var(--text-secondary)]/50"
            />
          </div>
          <button className="p-3 bg-[var(--surface)] border border-[var(--secondary)] rounded-2xl text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm hover:shadow-md">
            <Filter className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Vessels Grid */}
      {
        loading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center text-[var(--text-secondary)]">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
            <p className="font-bold">{language === 'ar' ? 'جاري التحميل...' : 'Loading vessels...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVessels.length === 0 ? (
              <div className="col-span-full text-center text-[var(--text-secondary)] py-16 border-2 border-dashed border-[var(--secondary)] rounded-3xl bg-[var(--surface)]/50">
                <Ship className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold">{language === 'ar' ? 'لا توجد سفن متطابقة.' : 'No matching vessels found.'}</p>
              </div>
            ) : (
              filteredVessels.map((vessel) => (
                <div
                  key={vessel.id}
                  className={`card-base card-hover ${getAccentBorder(vessel.status)} p-6 group relative overflow-hidden`}
                >
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                  <div className="flex justify-between items-start mb-6 relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <Ship className="w-8 h-8 text-white" />
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 shadow-sm ${getStatusColor(vessel.status)}`}>
                      {getStatusLabel(vessel.status)}
                    </span>
                  </div>

                  <div className="relative">
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1" title={vessel.name}>{vessel.name}</h3>
                    <p className="text-[var(--text-secondary)] text-sm font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                      IMO: {vessel.imo_number}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-[var(--secondary)]/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] font-bold">{language === 'ar' ? 'النوع' : 'Type'}</span>
                        <span className="text-[var(--text-primary)] font-black truncate max-w-[50%]">{vessel.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] font-bold">{language === 'ar' ? 'العلم' : 'Flag'}</span>
                        <span className="text-[var(--text-primary)] font-black truncate max-w-[50%]">{vessel.flag}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] font-bold">{language === 'ar' ? 'حمولة الساكنة' : 'DWT'}</span>
                        <span className="text-[var(--text-primary)] font-black">{vessel.dwt || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--secondary)]/50 flex items-center justify-between">
                      <div>
                        <div className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-tighter mb-1">{language === 'ar' ? 'الموقع الحالي' : 'CURRENT POSITION'}</div>
                        <div className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-[var(--primary)]" />
                          {vessel.location || 'At Sea'}
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-sm group-hover:translate-x-1">
                        <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      }
    </div>
  );
}
