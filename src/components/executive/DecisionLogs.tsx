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
    { id: 'AN-007', type: 'arrival', vessel: 'MV Pacific Glory', agent: 'Ocean Freight Inc.', decision: 'approved', decidedBy: 'Executive Manager Ali', timestamp: '2026-02-07 15:30', justification: 'All documents verified. Low risk cargo. Berth available.' },
    { id: 'AR-005', type: 'anchorage', vessel: 'MV Ocean Star', agent: 'Maritime Express Co.', decision: 'approved', decidedBy: 'Executive Manager Ali', timestamp: '2026-02-07 14:15', justification: 'Arrival approved. Wharf clearance received. 48-hour duration acceptable.' },
    { id: 'AN-006', type: 'arrival', vessel: 'MV Cargo Express', agent: 'Global Shipping Ltd.', decision: 'rejected', decidedBy: 'Executive Manager Ali', timestamp: '2026-02-07 12:45', justification: 'Port congestion. No berth available for requested time slot. Recommend rescheduling to Feb 12.' },
    { id: 'AR-004', type: 'anchorage', vessel: 'MV Blue Horizon', agent: 'Emirates Marine', decision: 'approved', decidedBy: 'Executive Manager Sara', timestamp: '2026-02-07 10:20', justification: 'All dependencies met. Zone B available for 24 hours.' },
    { id: 'AN-005', type: 'arrival', vessel: 'MV Desert Wind', agent: 'Pacific Logistics', decision: 'approved', decidedBy: 'Executive Manager Sara', timestamp: '2026-02-07 09:00', justification: 'Standard cargo. All safety certificates valid.' },
    { id: 'AR-003', type: 'anchorage', vessel: 'MV Atlantic Pride', agent: 'Ocean Freight Inc.', decision: 'rejected', decidedBy: 'Executive Manager Ali', timestamp: '2026-02-06 16:30', justification: 'Wharf approval pending. Cannot proceed until wharf inspection complete.' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.decision === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getDecisionBadge = (decision: string) =>
    decision === 'approved'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

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

  const exportToCSV = () => { alert(language === 'ar' ? 'تصدير السجلات...' : 'Exporting logs...'); };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>
        <button onClick={exportToCSV} className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />{t.export}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.totalDecisions, value: logs.length, textColor: 'text-slate-900 dark:text-slate-50', borderColor: 'border-b-slate-400' },
          { label: t.approved, value: logs.filter(l => l.decision === 'approved').length, textColor: 'text-green-700 dark:text-green-400', borderColor: 'border-b-green-500 dark:border-b-green-400' },
          { label: t.rejected, value: logs.filter(l => l.decision === 'rejected').length, textColor: 'text-red-700 dark:text-red-400', borderColor: 'border-b-red-500 dark:border-b-red-400' },
          { label: t.approvalRate, value: `${Math.round((logs.filter(l => l.decision === 'approved').length / logs.length) * 100)}%`, textColor: 'text-blue-700 dark:text-blue-400', borderColor: 'border-b-blue-500 dark:border-b-blue-400' },
        ].map((item) => (
          <div key={item.label} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-b-4 ${item.borderColor} rounded-lg p-4 shadow-sm`}>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{item.label}</div>
            <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full ${language === 'ar' ? 'pr-10' : 'pl-10'} py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors">
              <option value="all">{t.allDecisions}</option>
              <option value="approved">{t.approved}</option>
              <option value="rejected">{t.rejected}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors">
              <option value="all">{t.allTypes}</option>
              <option value="arrival">{t.arrivals}</option>
              <option value="anchorage">{t.anchorage}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/25 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {[t.requestId, t.type, t.vessel, t.decision, t.decidedBy, t.timestamp, t.actions].map((col) => (
                  <th key={col} className={`px-5 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors">
                  <td className="px-5 py-4"><span className="text-slate-900 dark:text-slate-50 font-medium font-mono text-sm">{log.id}</span></td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{getTypeLabel(log.type)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-900 dark:text-slate-50 font-medium text-sm">{log.vessel}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{log.agent}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getDecisionBadge(log.decision)}`}>
                      {log.decision === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {getDecisionLabel(log.decision)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-sm">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />{log.decidedBy}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <Calendar className="w-3.5 h-3.5" />{log.timestamp}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 text-sm font-medium transition-colors">{t.viewDetails}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="text-center py-10"><p className="text-slate-500 dark:text-slate-400 text-sm">{t.noResults}</p></div>
        )}
      </div>

      {/* Justification Details */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">{t.recentJustifications}</h2>
        <div className="space-y-3">
          {filteredLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-slate-50 font-medium text-sm">{log.id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getDecisionBadge(log.decision)}`}>
                    {log.decision === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {getDecisionLabel(log.decision)}
                  </span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-xs">{log.timestamp}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">{log.vessel} - {log.agent}</div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 dark:text-slate-500 text-xs mb-1">{t.justification}:</div>
                <div className="text-slate-900 dark:text-slate-50 text-sm">{log.justification}</div>
              </div>
              <div className="text-slate-400 dark:text-slate-500 text-xs mt-2">{t.decidedBy}: {log.decidedBy}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
