import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { FileText, Anchor, FileCheck, Filter, Calendar, Ship, Download, RefreshCw, Search } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { getLogs, LogEntry } from '../../utils/portOfficerApi';

interface OperationalLogsProps {
  language: Language;
}

export function OperationalLogs({ language }: OperationalLogsProps) {
  const isRTL = language === 'ar';

  const [filterType, setFilterType] = useState<'all' | 'berth_assignment' | 'clearance_issued'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchVessel, setSearchVessel] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const logsData = await getLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.action !== filterType) return false;
    if (filterDate && !log.timestamp.startsWith(filterDate)) return false;
    if (searchVessel && !(log.vessel || '').toLowerCase().includes(searchVessel.trim().toLowerCase())) return false;
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'berth_assignment': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'clearance_issued': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'berth_release': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getActionIconBg = (action: string) => {
    switch (action) {
      case 'berth_assignment': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'clearance_issued': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'berth_release': return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'berth_assignment': return <Anchor className="w-5 h-5" />;
      case 'clearance_issued': return <FileCheck className="w-5 h-5" />;
      case 'berth_release': return <Ship className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getActionLabel = (action: string) => {
    if (isRTL) {
      switch (action) {
        case 'berth_assignment': return 'تعيين رصيف';
        case 'clearance_issued': return 'إصدار تصريح';
        case 'berth_release': return 'تحرير رصيف';
        default: return 'إجراء';
      }
    } else {
      switch (action) {
        case 'berth_assignment': return 'Berth Assignment';
        case 'clearance_issued': return 'Clearance Issued';
        case 'berth_release': return 'Berth Release';
        default: return 'Action';
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full flex items-center justify-center">
        <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isRTL ? 'السجلات التشغيلية' : 'Operational Logs'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL ? 'سجل كامل لجميع العمليات والإجراءات' : 'Complete Audit Trail of All Operations'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
          >
            {loading ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
          <button className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
            {isRTL ? 'تصدير السجلات' : 'Export Logs'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{isRTL ? 'تصفية السجلات' : 'Filter Logs'}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {isRTL ? 'نوع الإجراء' : 'Action Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors"
            >
              <option value="all">{isRTL ? 'جميع الإجراءات' : 'All Actions'}</option>
              <option value="berth_assignment">{isRTL ? 'تعيين رصيف' : 'Berth Assignment'}</option>
              <option value="clearance_issued">{isRTL ? 'إصدار تصريح' : 'Clearance Issued'}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {isRTL ? 'التاريخ' : 'Date'}
            </label>
            <div className="relative">
              <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors`}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {isRTL ? 'بحث بالسفينة' : 'Search Vessel'}
            </label>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
              <input
                type="text"
                value={searchVessel}
                onChange={(e) => setSearchVessel(e.target.value)}
                placeholder={isRTL ? 'اسم السفينة...' : 'Vessel name...'}
                className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors`}
              />
            </div>
          </div>
        </div>

        {(filterType !== 'all' || filterDate || searchVessel) && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3">
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              {isRTL ? `عرض ${filteredLogs.length} من ${logs.length} سجل` : `Showing ${filteredLogs.length} of ${logs.length} logs`}
            </p>
            <button
              onClick={() => { setFilterType('all'); setFilterDate(''); setSearchVessel(''); }}
              className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 text-sm font-medium transition-colors"
            >
              {isRTL ? 'إعادة تعيين التصفية' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Logs Timeline */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          {isRTL ? 'سجل الأنشطة' : 'Activity Timeline'}
        </h2>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getActionIconBg(log.action)} flex-shrink-0`}>
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-slate-900 dark:text-slate-50 font-semibold">{log.vessel}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    {log.wharf && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {log.wharf}
                      </span>
                    )}
                    {log.clearanceId && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {log.clearanceId}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{log.details}</p>

                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>{isRTL ? 'بواسطة:' : 'By:'}</span>
                    <span className="font-medium text-blue-700 dark:text-blue-400">{log.officer}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{isRTL ? 'لا توجد سجلات متطابقة مع المعايير المحددة' : 'No logs match the selected criteria'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
