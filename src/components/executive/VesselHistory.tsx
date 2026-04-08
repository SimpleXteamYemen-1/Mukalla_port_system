import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Anchor, FileText, Ship, Info, Calendar, Loader2, Clock, CheckCircle2, XCircle, Search, Navigation, Package, Hash, LogIn, LogOut } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService } from '../../services/executiveService';

interface VesselHistoryProps {
  language: Language;
  vesselId: string | number;
  onNavigate: (page: string) => void;
}

export function VesselHistory({ language, vesselId, onNavigate }: VesselHistoryProps) {
  const t = translations[language]?.executive?.history || {
    title: 'Vessel History',
    subtitle: 'Comprehensive chronicle of all port calls and operational interactions',
    back: 'Back to Dashboard',
    masterRecord: 'Master Record',
    imo: 'IMO Number',
    flag: 'Flag State',
    type: 'Vessel Type',
    tonnage: 'Gross Tonnage',
    history: 'Historical Timeline',
    loadMore: 'Load More',
    noHistory: 'No historical port calls found. First recorded entry.',
    error: 'Failed to load vessel profile',
    status: 'Status',
    date: 'Date & Time',
    searchPlaceholder: 'Search by IMO Number (e.g. 9876543)',
    search: 'Search',
    arrivalDate: 'Arrival Date',
    departureDate: 'Expected Departure',
    cargoType: 'Cargo Type',
    previousPort: 'Previous Port',
    totalArrivals: 'Total Arrivals',
    totalDepartures: 'Total Clearances'
  };

  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vesselData, setVesselData] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeVesselId, setActiveVesselId] = useState<string | number>(vesselId);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async (targetPage: number, vid: string | number) => {
    try {
      const data = await executiveService.getVesselHistory(vid, targetPage);
      
      if (targetPage === 1) {
        setVesselData(data.vessel);
        setHistoryItems(data.history.data);
      } else {
        setHistoryItems(prev => [...prev, ...data.history.data]);
      }
      
      setHasMore(data.history.current_page < data.history.last_page);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      if (err.response?.status === 404) {
        setError(isRTL ? 'لم يتم العثور على بيانات السفينة' : 'Vessel not found in database');
      } else {
        setError(t.error);
      }
    }
  };

  useEffect(() => {
    setActiveVesselId(vesselId);
  }, [vesselId]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      await fetchHistory(1, activeVesselId);
      setLoading(false);
    };
    if (activeVesselId) {
      initialize();
    }
  }, [activeVesselId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveVesselId(searchQuery.trim());
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchHistory(nextPage, activeVesselId);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const getEventIcon = (type: string) => {
    if (type.includes('Registration') || type.includes('Arrival')) return <Ship className="w-5 h-5 text-blue-400" />;
    if (type.includes('Cargo')) return <FileText className="w-5 h-5 text-indigo-400" />;
    if (type.includes('Wharfage')) return <Anchor className="w-5 h-5 text-amber-400" />;
    if (type.includes('Clearance')) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    return <Info className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'pending':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'rejected':
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-blue-200">Loading comprehensive vessel profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-3 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] transition-all"
        >
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      {/* Page Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-[var(--surface)] hover:bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] transition-all group"
          >
            <ArrowLeft className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-blue-200">{t.subtitle}</p>
          </div>
        </div>

        {/* IMO Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full md:w-64 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} focus:outline-none focus:border-[var(--primary)] transition-colors`}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary)]/90 transition-colors whitespace-nowrap"
          >
            {t.search}
          </button>
        </form>
      </div>

      {/* Master Record */}
      {vesselData && (
        <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center">
              <Ship className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{vesselData.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><Info className="w-4 h-4"/> ID: {vesselData.id}</span>
                <span className="flex items-center gap-1"><Info className="w-4 h-4"/> {t.imo}: {vesselData.imo}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.flag}</div>
              <div className="text-[var(--text-primary)] font-bold text-lg">{vesselData.flag}</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.type}</div>
              <div className="text-[var(--text-primary)] font-bold text-lg">{vesselData.type}</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Hash className="w-5 h-5 text-[var(--primary)] mb-2" />
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.imo}</div>
              <div className="text-[var(--text-primary)] font-bold text-lg">{vesselData.imoNumber || vesselData.imo}</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Package className="w-5 h-5 text-[var(--primary)] mb-2" />
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.cargoType}</div>
              <div className="text-[var(--text-primary)] font-bold text-base truncate w-full" title={vesselData.cargoType}>{vesselData.cargoType || 'N/A'}</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Navigation className="w-5 h-5 text-[var(--primary)] mb-2" />
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.previousPort}</div>
              <div className="text-[var(--text-primary)] font-bold text-lg">{vesselData.previousPort || 'N/A'}</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Calendar className="w-5 h-5 text-[var(--primary)] mb-2" />
              <div className="text-[var(--text-secondary)] text-xs mb-1">{t.arrivalDate}</div>
              <div className="text-[var(--text-primary)] font-bold text-sm">{vesselData.arrivalDate || 'N/A'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mt-6">
             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-emerald-400 text-xs mb-1 font-medium">{t.totalArrivals}</div>
                <div className="text-emerald-300 font-bold text-3xl">{vesselData.totalArrivals || 1}</div>
              </div>
              <LogIn className="w-10 h-10 text-emerald-400/50" />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-blue-400 text-xs mb-1 font-medium">{t.totalDepartures}</div>
                <div className="text-blue-300 font-bold text-3xl">{vesselData.totalDepartures || 0}</div>
              </div>
              <LogOut className="w-10 h-10 text-blue-400/50" />
            </div>
          </div>
        </div>
      )}

      {/* Historical Timeline */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
          <Clock className="w-6 h-6 text-[var(--primary)]" />
          {t.history}
        </h3>

        {historyItems.length === 0 ? (
          <div className="text-center py-12 px-6 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]">
            <Info className="w-12 h-12 text-[var(--text-secondary)]/50 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-medium text-lg">{t.noHistory}</p>
          </div>
        ) : (
          <div className="relative border-l border-[var(--border)] ml-4 sm:ml-6 md:ml-8 space-y-10">
            {historyItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative pl-8 sm:pl-10">
                {/* Timeline Dot */}
                <span className="absolute -left-5 top-1 flex items-center justify-center w-10 h-10 bg-[var(--bg-primary)] rounded-full border-4 border-[var(--border)] shadow-sm">
                  {getEventIcon(item.type)}
                </span>
                
                {/* Content Card */}
                <div className="bg-[var(--surface)] hover:bg-[var(--secondary)]/5 transition-all border border-[var(--border)] rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {item.type}
                        <span className="text-xs font-normal text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                          {item.id}
                        </span>
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1.5">
                        <Calendar className="w-4 h-4 opacity-70" />
                        {item.timestamp}
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-primary)]/90 leading-relaxed">
                    {item.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-xl text-[var(--primary)] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loadingMore && <Loader2 className="w-5 h-5 animate-spin" />}
              {t.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
