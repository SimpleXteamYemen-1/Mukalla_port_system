import { useState } from 'react';
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

  const vessels = [
    { id: 1, name: 'MV Ocean Star', imo: 'IMO9123456', flag: '🇦🇪', type: 'Container', length: 250, status: 'active', arrivalStatus: 'approved' },
    { id: 2, name: 'MV Pacific Glory', imo: 'IMO9234567', flag: '🇸🇦', type: 'Tanker', length: 300, status: 'active', arrivalStatus: 'pending' },
    { id: 3, name: 'MV Cargo Express', imo: 'IMO9345678', flag: '🇦🇪', type: 'Bulk Carrier', length: 280, status: 'inactive', arrivalStatus: 'rejected' },
    { id: 4, name: 'MV Blue Horizon', imo: 'IMO9456789', flag: '🇴🇲', type: 'Container', length: 270, status: 'active', arrivalStatus: 'approved' },
    { id: 5, name: 'MV Desert Wind', imo: 'IMO9567890', flag: '🇦🇪', type: 'Tanker', length: 320, status: 'active', arrivalStatus: 'approved' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 border-green-400/30 text-green-200';
      case 'rejected': return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'pending': return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      case 'active': return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
      case 'inactive': return 'bg-gray-500/20 border-gray-400/30 text-gray-200';
      default: return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      active: { ar: 'نشط', en: 'Active' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
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
          onClick={() => onNavigate('arrivals')}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          {t.addVessel}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full ${language === 'ar' ? 'pr-11 text-right' : 'pl-11'} py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-all`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-300" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="all">{t.allVessels}</option>
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vessels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vessels.map((vessel) => (
          <div key={vessel.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Ship className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{vessel.name}</h3>
                  <p className="text-blue-300 text-sm">{vessel.imo}</p>
                </div>
              </div>
              <span className="text-2xl">{vessel.flag}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.vesselType}</div>
                <div className="text-white font-medium">{vessel.type}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.length}</div>
                <div className="text-white font-medium">{vessel.length}m</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs border ${getStatusColor(vessel.status)}`}>
                  {getStatusLabel(vessel.status)}
                </span>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs border ${getStatusColor(vessel.arrivalStatus)}`}>
                  {getStatusLabel(vessel.arrivalStatus)}
                </span>
              </div>
              <button className="text-blue-300 hover:text-white text-sm transition-colors">
                {t.viewDetails}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
