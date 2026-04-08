import { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService } from '../../services/executiveService';

interface ReportsAnalyticsProps {
  language: Language;
}

export function ReportsAnalytics({ language }: ReportsAnalyticsProps) {
  const t = translations[language]?.executive?.reports || translations.en.executive.reports;

  const [turnaroundData, setTurnaroundData] = useState<any[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [reportType, setReportType] = useState('Performance');
  const [format, setFormat] = useState('PDF');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await executiveService.getAnalytics();
      if (data) {
        // Map backend turnAround data to frontend format
        const mappedTurnaround = data.turnaroundData.map((item: any) => ({
          period: item.name, // The backend sends 'Jan', 'Feb' etc. The UI previously used Days. We adapt.
          hours: item.avg
        }));
        setTurnaroundData(mappedTurnaround);

        // Map rejection reasons
        setRejectionReasons(data.rejectionReasons.map((item: any) => ({
          reason: item.name,
          count: item.value,
          percentage: item.value, // Simplification 
          color: `bg-[${item.color}]` // Tailwind arbitrary values or pre-map
        })));

        // Map performance metrics
        setPerformanceMetrics([
          {
            title: t.avgTurnaroundTime,
            value: data.performanceMetrics.avgTurnaround,
            change: '-12%', // Mock trend for now 
            trend: 'down',
            good: true,
            icon: Clock,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            title: t.approvalRate,
            value: data.performanceMetrics.approvalRate,
            change: '+5%',
            trend: 'up',
            good: true,
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-500'
          },
          {
            title: t.rejectionRate,
            value: (100 - parseInt(data.performanceMetrics.approvalRate)) + '%',
            change: '-3%',
            trend: 'down',
            good: true,
            icon: XCircle,
            color: 'from-red-500 to-rose-500'
          },
          {
            title: t.dailyDecisions,
            value: '28', // This could be fetched too
            change: '+15%',
            trend: 'up',
            good: true,
            icon: BarChart3,
            color: 'from-purple-500 to-pink-500'
          },
        ]);

        // Map recent reports
        setRecentReports(data.recentReports.map((report: any) => ({
          name: report.title,
          date: report.date,
          type: report.type,
          size: report.size,
          file_url: report.file_url || '#'
        })));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [language]);

  const handleGenerate = async (paramsOverride?: { dateRange: string, reportType: string, format: string }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await executiveService.generateCustomReport({
        dateRange: paramsOverride?.dateRange || dateRange,
        reportType: paramsOverride?.reportType || reportType,
        format: paramsOverride?.format || format
      });

      if (response && response.report) {
        // Prepend to recent reports
        const newReport = {
          name: response.report.title,
          date: response.report.date,
          type: response.report.type,
          size: response.report.size,
          file_url: response.report.file_url
        };
        setRecentReports((prev) => [newReport, ...prev].slice(0, 3));
        
        // Auto download
        const a = document.createElement('a');
        a.href = response.report.file_url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
         setError('Error: Unexpected response format from server.');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      if (error.response?.status === 500) {
         setError('Error: Unable to connect to reporting service (Server Error).');
      } else if (error.response?.status === 400 || error.response?.status === 422) {
         setError('Error: Invalid data parameters submitted.');
      } else {
         setError(error.message || 'Failed to generate report due to a network or connection error.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (expFormat: string) => {
    handleGenerate({
      dateRange: 'Last 30 Days',
      reportType: 'Comprehensive',
      format: expFormat
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-blue-200">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportReport('PDF')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            PDF
          </button>
          <button
            onClick={() => exportReport('Excel')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            Excel
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={metric.title} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 ${metric.good ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-blue-200 text-sm">{metric.title}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnaround Time Chart */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-6">{t.turnaroundTimeChart}</h2>
          <div className="space-y-4">
            {turnaroundData.map((data, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-200 text-sm">{data.period}</span>
                  <span className="text-white font-semibold">{data.hours}h</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${(data.hours / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <div className="text-blue-200 text-xs mb-1">{t.average}</div>
            <div className="text-white font-bold text-lg">2.6 {t.hours}</div>
          </div>
        </div>

        {/* Rejection Reasons Chart */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-6">{t.rejectionReasonsChart}</h2>
          <div className="space-y-4">
            {rejectionReasons.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-200 text-sm">{item.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 text-xs">{item.count}</span>
                    <span className="text-white font-semibold">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl">
            <div className="text-red-200 text-xs mb-1">{t.totalRejections}</div>
            <div className="text-white font-bold text-lg">34</div>
          </div>
        </div>
      </div>

      {/* Decision Timeline */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-6">{t.decisionTimeline}</h2>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, weekIndex) => (
            <div key={weekIndex} className="space-y-1">
              <div className="text-blue-300 text-xs text-center mb-2">
                {language === 'ar' ? `أسبوع ${weekIndex + 1}` : `Week ${weekIndex + 1}`}
              </div>
              {[...Array(5)].map((_, dayIndex) => {
                const decisions = Math.floor(Math.random() * 10) + 5;
                const intensity = Math.min(decisions / 15, 1);
                return (
                  <div
                    key={dayIndex}
                    className="h-8 rounded transition-all hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity * 0.5 + 0.1})`
                    }}
                    title={`${decisions} ${t.decisions}`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/20"></div>
            <span className="text-blue-300 text-xs">{t.low}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/40"></div>
            <span className="text-blue-300 text-xs">{t.medium}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/60"></div>
            <span className="text-blue-300 text-xs">{t.high}</span>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">{t.recentReports}</h2>
        <div className="space-y-3">
          {recentReports.map((report, index) => (
            <div key={index} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">{report.name}</div>
                  <div className="text-blue-300 text-xs mt-1">
                    {report.date} • {report.type} • {report.size}
                  </div>
                </div>
              </div>
              <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-200 hover:text-white text-sm transition-all flex items-center justify-center">
                {t.download}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">{t.customExport}</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">{t.dateRange}</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="Last 7 Days">{t.last7Days}</option>
              <option value="Last 30 Days">{t.last30Days}</option>
              <option value="Last Month">{t.lastMonth}</option>
              <option value="Custom">{t.custom}</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">{t.reportType}</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="Performance">{t.performance}</option>
              <option value="Decisions">{t.decisions}</option>
              <option value="Rejections">{t.rejections}</option>
              <option value="Comprehensive">{t.comprehensive}</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">{t.format}</label>
            <select 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`mt-4 w-full py-3 bg-gradient-to-r ${isGenerating ? 'from-gray-500 to-gray-600 cursor-not-allowed' : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
            </>
          ) : t.generateReport}
        </button>
      </div>
    </div>
  );
}
