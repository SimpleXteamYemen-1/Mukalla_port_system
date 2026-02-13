import { useState, useEffect } from 'react';
import { agentService } from '../../services/agentService';
import { Ship, Plus, Search, Filter } from 'lucide-react';
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
        // Transform data to match UI expectations if necessary
        // The backend returns: { id, name, type, flag, arrivalStatus (inferred?), status, ... }
        // Actually backend returns generic Vessel model. We might need to map some fields or use them as is.
        // For now assuming backend returns needed fields or we display what we have.
        // Backend "status" is 'awaiting', 'active', etc.
        // Frontend expects "arrivalStatus" too. Let's map "status" to both for now or handle it.
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
      case 'approved': return 'bg-green-100/50 border-green-200 text-green-700';
      case 'rejected': return 'bg-red-100/50 border-red-200 text-red-700';
      case 'pending':
      case 'awaiting': return 'bg-amber-100/50 border-amber-200 text-amber-700';
      case 'active': return 'bg-blue-100/50 border-blue-200 text-blue-700';
      case 'inactive': return 'bg-gray-100/50 border-gray-200 text-gray-700';
      default: return 'bg-blue-100/50 border-blue-200 text-blue-700';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
          <p className="text-[var(--text-secondary)]">{t.subtitle}</p>
        </div>
        <button
          onClick={() => onNavigate('arrivals')}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl text-white font-bold transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          {t.addVessel}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-transparent border border-[var(--secondary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            >
              <option value="all" className="bg-[var(--bg-primary)]">{t.allVessels}</option>
              <option value="active" className="bg-[var(--bg-primary)]">{t.active}</option>
              <option value="inactive" className="bg-[var(--bg-primary)]">{t.inactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vessels Grid */}
      {loading ? (
        <div className="text-[var(--text-primary)] text-center py-10">Loading vessels...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVessels.map((vessel) => (
            <div key={vessel.id} className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--secondary)] p-6 hover:border-[var(--primary)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Ship className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[var(--text-primary)] font-bold text-lg">{vessel.name}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">{vessel.imo_number}</p>
                  </div>
                </div>
                <span className="text-2xl">{vessel.flag || '🏳️'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                  <div className="text-[var(--text-secondary)] text-xs mb-1">{t.vesselType}</div>
                  <div className="text-[var(--text-primary)] font-medium">{vessel.type}</div>
                </div>
                <div className="border border-[var(--secondary)] rounded-xl p-3 bg-[var(--bg-card)]/30">
                  <div className="text-[var(--text-secondary)] text-xs mb-1">ETA</div>
                  <div className="text-[var(--text-primary)] font-medium">{vessel.eta}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vessel.status)}`}>
                    {getStatusLabel(vessel.status)}
                  </span>
                </div>
                <button className="text-[var(--primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors hover:underline">
                  {t.viewDetails}
                </button>
              </div>
            </div>
          ))}
          {filteredVessels.length === 0 && (
            <div className="col-span-2 text-center text-[var(--text-secondary)] py-10 border border-dashed border-[var(--secondary)] rounded-md">
              No vessels found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
