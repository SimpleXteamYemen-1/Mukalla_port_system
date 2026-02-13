import { useState } from 'react';
import { CheckCircle2, XCircle, Search, Filter, Download, Calendar, User as UserIcon } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface DecisionLogsProps {
  language: Language;
}

export function DecisionLogs({ language }: DecisionLogsProps) {
  const t = translations[language]?.executive?.logs || translations.en.executive.logs;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const logs = [
    {
      id: 'AN-007',
      type: 'arrival',
      vessel: 'MV Pacific Glory',
      agent: 'Ocean Freight Inc.',
      decision: 'approved',
      decidedBy: 'Executive Manager Ali',
      timestamp: '2026-02-07 15:30',
      justification: 'All documents verified. Low risk cargo. Berth available.',
    },
    {
      id: 'AR-005',
      type: 'anchorage',
      vessel: 'MV Ocean Star',
      agent: 'Maritime Express Co.',
      decision: 'approved',
      decidedBy: 'Executive Manager Ali',
      timestamp: '2026-02-07 14:15',
      justification: 'Arrival approved. Wharf clearance received. 48-hour duration acceptable.',
    },
    {
      id: 'AN-006',
      type: 'arrival',
      vessel: 'MV Cargo Express',
      agent: 'Global Shipping Ltd.',
      decision: 'rejected',
      decidedBy: 'Executive Manager Ali',
      timestamp: '2026-02-07 12:45',
      justification: 'Port congestion. No berth available for requested time slot. Recommend rescheduling to Feb 12.',
    },
    {
      id: 'AR-004',
      type: 'anchorage',
      vessel: 'MV Blue Horizon',
      agent: 'Emirates Marine',
      decision: 'approved',
      decidedBy: 'Executive Manager Sara',
      timestamp: '2026-02-07 10:20',
      justification: 'All dependencies met. Zone B available for 24 hours.',
    },
    {
      id: 'AN-005',
      type: 'arrival',
      vessel: 'MV Desert Wind',
      agent: 'Pacific Logistics',
      decision: 'approved',
      decidedBy: 'Executive Manager Sara',
      timestamp: '2026-02-07 09:00',
      justification: 'Standard cargo. All safety certificates valid.',
    },
    {
      id: 'AR-003',
      type: 'anchorage',
      vessel: 'MV Atlantic Pride',
      agent: 'Ocean Freight Inc.',
      decision: 'rejected',
      decidedBy: 'Executive Manager Ali',
      timestamp: '2026-02-06 16:30',
      justification: 'Wharf approval pending. Cannot proceed until wharf inspection complete.',
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.decision === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getDecisionIcon = (decision: string) => {
    return decision === 'approved' ? (
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'approved'
      ? 'bg-green-500/20 border-green-400/30 text-green-200'
      : 'bg-red-500/20 border-red-400/30 text-red-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      arrival: { ar: 'وصول', en: 'Arrival' },
      anchorage: { ar: 'رسو', en: 'Anchorage' },
    };
    return labels[type]?.[language] || type;
  };

  const getDecisionLabel = (decision: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
    };
    return labels[decision]?.[language] || decision;
  };

  const exportToCSV = () => {
    alert(language === 'ar' ? 'تصدير السجلات...' : 'Exporting logs...');
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
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        >
          <Download className="w-5 h-5" />
          {t.export}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.totalDecisions}</div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>
        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl border border-green-400/30 p-4">
          <div className="text-green-300 text-sm mb-1">{t.approved}</div>
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.decision === 'approved').length}
          </div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.rejected}</div>
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.decision === 'rejected').length}
          </div>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-400/30 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.approvalRate}</div>
          <div className="text-2xl font-bold text-white">
            {Math.round((logs.filter(l => l.decision === 'approved').length / logs.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
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
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="all">{t.allDecisions}</option>
              <option value="approved">{t.approved}</option>
              <option value="rejected">{t.rejected}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-300" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="all">{t.allTypes}</option>
              <option value="arrival">{t.arrivals}</option>
              <option value="anchorage">{t.anchorage}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.requestId}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.type}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.vessel}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.decision}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.decidedBy}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.timestamp}
                </th>
                <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'} text-sm font-semibold text-blue-200`}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{log.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-lg text-xs">
                      {getTypeLabel(log.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{log.vessel}</div>
                    <div className="text-blue-300 text-xs mt-1">{log.agent}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs border ${getDecisionColor(log.decision)}`}>
                      {getDecisionIcon(log.decision)}
                      {getDecisionLabel(log.decision)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <UserIcon className="w-4 h-4 text-blue-300" />
                      {log.decidedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-blue-300 text-sm">
                      <Calendar className="w-4 h-4" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-300 hover:text-white text-sm transition-colors">
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-blue-300">{t.noResults}</p>
          </div>
        )}
      </div>

      {/* Justification Details Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">{t.recentJustifications}</h2>
        <div className="space-y-3">
          {filteredLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{log.id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getDecisionColor(log.decision)}`}>
                    {getDecisionIcon(log.decision)}
                    {getDecisionLabel(log.decision)}
                  </span>
                </div>
                <span className="text-blue-300 text-xs">{log.timestamp}</span>
              </div>
              <div className="text-blue-200 text-sm mb-2">{log.vessel} - {log.agent}</div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.justification}:</div>
                <div className="text-white text-sm">{log.justification}</div>
              </div>
              <div className="text-blue-300/70 text-xs mt-2">{t.decidedBy}: {log.decidedBy}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
