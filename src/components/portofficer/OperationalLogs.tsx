import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { FileText, Anchor, FileCheck, Filter, Calendar, Ship, Download, RefreshCw } from 'lucide-react';
import { getLogs, LogEntry } from '../../utils/portOfficerApi';

interface OperationalLogsProps {
  language: Language;
}

export function OperationalLogs({ language }: OperationalLogsProps) {
  const t = translations[language].portOfficer;
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
    if (searchVessel && !log.vessel.toLowerCase().includes(searchVessel.toLowerCase())) return false;
    return true;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'berth_assignment': return 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30';
      case 'clearance_issued': return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
      case 'berth_release': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F] p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">{isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F] p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'السجلات التشغيلية' : 'Operational Logs'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'سجل كامل لجميع العمليات والإجراءات' : 'Complete Audit Trail of All Operations'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Refresh'}
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-3">
              <Download className="w-5 h-5" />
              {isRTL ? 'تصدير السجلات' : 'Export Logs'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            {isRTL ? 'تصفية السجلات' : 'Filter Logs'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Type Filter */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              {isRTL ? 'نوع الإجراء' : 'Action Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all" className="bg-gray-800">
                {isRTL ? 'جميع الإجراءات' : 'All Actions'}
              </option>
              <option value="berth_assignment" className="bg-gray-800">
                {isRTL ? 'تعيين رصيف' : 'Berth Assignment'}
              </option>
              <option value="clearance_issued" className="bg-gray-800">
                {isRTL ? 'إصدار تصريح' : 'Clearance Issued'}
              </option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              {isRTL ? 'التاريخ' : 'Date'}
            </label>
            <div className="relative">
              <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>
          </div>

          {/* Vessel Search */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              {isRTL ? 'بحث بالسفينة' : 'Search Vessel'}
            </label>
            <div className="relative">
              <Ship className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                value={searchVessel}
                onChange={(e) => setSearchVessel(e.target.value)}
                placeholder={isRTL ? 'اسم السفينة...' : 'Vessel name...'}
                className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>
          </div>
        </div>

        {(filterType !== 'all' || filterDate || searchVessel) && (
          <div className="mt-4 flex items-center justify-between bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-3">
            <p className="text-cyan-300 text-sm">
              {isRTL 
                ? `عرض ${filteredLogs.length} من ${logs.length} سجل`
                : `Showing ${filteredLogs.length} of ${logs.length} logs`
              }
            </p>
            <button
              onClick={() => {
                setFilterType('all');
                setFilterDate('');
                setSearchVessel('');
              }}
              className="text-cyan-300 hover:text-cyan-100 text-sm font-semibold"
            >
              {isRTL ? 'إعادة تعيين التصفية' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Logs Timeline */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">
          {isRTL ? 'سجل الأنشطة' : 'Activity Timeline'}
        </h2>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Action Icon */}
                <div className={`p-3 rounded-xl border-2 ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>

                {/* Log Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold text-lg">{log.vessel}</h3>
                    <span className="text-xs text-gray-400">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    {log.wharf && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30">
                        {log.wharf}
                      </span>
                    )}
                    {log.clearanceId && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-400/30">
                        {log.clearanceId}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-300 mb-2">{log.details}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{isRTL ? 'بواسطة:' : 'By:'}</span>
                    <span className="text-cyan-400 font-semibold">{log.officer}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {isRTL ? 'لا توجد سجلات متطابقة مع المعايير المحددة' : 'No logs match the selected criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
