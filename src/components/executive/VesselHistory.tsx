import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Anchor, FileText, Ship, Info, Calendar, Clock, CheckCircle2, XCircle, Search, Navigation, Package, Hash, LogIn, LogOut } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService } from '../../services/executiveService';

interface VesselHistoryProps {
  language: Language;
  vesselId: string | number;
  onNavigate: (page: string) => void;
}

export function VesselHistory({ language, vesselId, onNavigate }: VesselHistoryProps) {
  const t = (translations[language]?.executive as any)?.history || {
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
    if (type.includes('Registration') || type.includes('Arrival')) return <Ship className="w-4 h-4 text-blue-700 dark:text-blue-400" />;
    if (type.includes('Cargo')) return <FileText className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />;
    if (type.includes('Wharfage')) return <Anchor className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
    if (type.includes('Clearance')) return <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />;
    return <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/30';
      case 'pending':
        return 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-900/30';
      case 'rejected':
      case 'failed':
        return 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-900/30';
      default:
        return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-900/30';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full flex items-center justify-center">
        <LoadingIndicator 
          type="line-spinner" 
          size="lg" 
          label={language === 'ar' ? 'جاري تحميل ملف السفينة...' : 'Loading comprehensive vessel profile...'} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full flex flex-col items-center justify-center space-y-6">
        <XCircle className="w-16 h-16 text-red-600 dark:text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">{error}</h2>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-sm font-medium"
        >
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Page Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* IMO Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 rounded-lg py-2.5 ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm shadow-sm`}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            {t.search}
          </button>
        </form>
      </div>

      {/* Master Record */}
      {vesselData && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500" />
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <Ship className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{vesselData.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5"/> ID: {vesselData.id}</span>
                <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5"/> {t.imo}: {vesselData.imo}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{t.flag}</div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-base line-clamp-1">{vesselData.flag}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{t.type}</div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-base line-clamp-1">{vesselData.type}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <Hash className="w-3.5 h-3.5" />{t.imo}
              </div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-base line-clamp-1">{vesselData.imoNumber || vesselData.imo}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <Package className="w-3.5 h-3.5" />{t.cargoType}
              </div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-base line-clamp-1">{vesselData.cargoType || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <Navigation className="w-3.5 h-3.5" />{t.previousPort}
              </div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-base line-clamp-1">{vesselData.previousPort || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />{t.arrivalDate}
              </div>
              <div className="text-slate-900 dark:text-slate-50 font-bold text-sm line-clamp-1">{vesselData.arrivalDate || 'N/A'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
             <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-1 uppercase tracking-wider">{t.totalArrivals}</div>
                <div className="text-emerald-800 dark:text-emerald-300 font-bold text-2xl">{vesselData.totalArrivals || 1}</div>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <LogIn className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1 uppercase tracking-wider">{t.totalDepartures}</div>
                <div className="text-blue-800 dark:text-blue-300 font-bold text-2xl">{vesselData.totalDepartures || 0}</div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <LogOut className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          {t.history}
        </h3>

        {historyItems.length === 0 ? (
          <div className="text-center py-12 px-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <Info className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">{t.noHistory}</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-slate-700 ml-4 sm:ml-6 md:ml-8 space-y-8">
            {historyItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative pl-6 sm:pl-8">
                {/* Timeline Dot */}
                <span className="absolute -left-4 top-1.5 flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                  {getEventIcon(item.type)}
                </span>
                
                {/* Content Card */}
                <div className="bg-slate-50 dark:bg-slate-700/25 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        {item.type}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          #{item.id}
                        </span>
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.timestamp}
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded border border-slate-100 dark:border-slate-700">
                    {item.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loadingMore ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
              {t.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
