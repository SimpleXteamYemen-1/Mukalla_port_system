import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { BarChart3, Package, RefreshCw, Activity, FlaskConical, ThermometerSnowflake, Box } from 'lucide-react';
import api from '../../services/api';

interface CapacityOverviewProps {
  language: Language;
}

interface ContainerData {
  id: number;
  storage_type: 'chemical' | 'frozen' | 'dry';
  status: string;
  description_of_goods: string;
  arrival_date: string;
}

export function CapacityOverview({ language }: CapacityOverviewProps) {
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<ContainerData[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wharf/containers');
      setContainers(res.data);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute real stats from container data
  const chemicalCount = containers.filter(c => c.storage_type === 'chemical').length;
  const frozenCount = containers.filter(c => c.storage_type === 'frozen').length;
  const dryCount = containers.filter(c => c.storage_type === 'dry').length;
  const totalCount = containers.length;

  const pendingCount = containers.filter(c => c.status === 'pending').length;
  const inWharfCount = containers.filter(c => c.status === 'in_wharf').length;
  const clearedCount = containers.filter(c => c.status === 'cleared').length;

  const categories = [
    {
      id: 'chemical',
      count: chemicalCount,
      icon: FlaskConical,
      label: isRTL ? 'كيميائي' : 'Chemical',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-400/30',
    },
    {
      id: 'frozen',
      count: frozenCount,
      icon: ThermometerSnowflake,
      label: isRTL ? 'مُجمّد' : 'Frozen',
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-400/30',
    },
    {
      id: 'dry',
      count: dryCount,
      icon: Box,
      label: isRTL ? 'جاف' : 'Dry',
      color: 'from-slate-500 to-gray-600',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-400/30',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'نظرة عامة على السعة' : 'Capacity Overview'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'مراقبة وتحليل سعة التخزين الفعلية' : 'Monitor and analyze real-time storage capacity'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Overall Stats Card */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-indigo-400/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/30 rounded-2xl">
              <BarChart3 className="w-10 h-10 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {isRTL ? 'إجمالي الحاويات' : 'Total Containers'}
              </h2>
              <p className="text-indigo-200 text-lg">
                {totalCount} {isRTL ? 'حاوية مسجلة في النظام' : 'containers registered in the system'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-white mb-2">{totalCount}</div>
            <div className="text-lg font-semibold text-indigo-300">
              {isRTL ? 'وحدة نشطة' : 'Active Units'}
            </div>
          </div>
        </div>

        {/* Status distribution bar */}
        {totalCount > 0 && (
          <div className="w-full bg-white/10 rounded-full h-8 overflow-hidden mb-4 flex">
            {pendingCount > 0 && (
              <div
                className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-500"
                style={{ width: `${(pendingCount / totalCount) * 100}%` }}
              >
                {pendingCount > 0 && `${isRTL ? 'معلق' : 'Pending'} ${pendingCount}`}
              </div>
            )}
            {inWharfCount > 0 && (
              <div
                className="h-8 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-500"
                style={{ width: `${(inWharfCount / totalCount) * 100}%` }}
              >
                {inWharfCount > 0 && `${isRTL ? 'في الرصيف' : 'In Wharf'} ${inWharfCount}`}
              </div>
            )}
            {clearedCount > 0 && (
              <div
                className="h-8 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-500"
                style={{ width: `${(clearedCount / totalCount) * 100}%` }}
              >
                {clearedCount > 0 && `${isRTL ? 'مخلّص' : 'Cleared'} ${clearedCount}`}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'معلّق' : 'Pending'}</p>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-xs text-gray-400">{isRTL ? 'حاوية' : 'containers'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'في الرصيف' : 'In Wharf'}</p>
            <p className="text-2xl font-bold text-blue-400">{inWharfCount}</p>
            <p className="text-xs text-gray-400">{isRTL ? 'حاوية' : 'containers'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'تم التخليص' : 'Cleared'}</p>
            <p className="text-2xl font-bold text-green-400">{clearedCount}</p>
            <p className="text-xs text-gray-400">{isRTL ? 'حاوية' : 'containers'}</p>
          </div>
        </div>
      </div>

      {/* Capacity by Storage Type */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-400" />
          {isRTL ? 'التوزيع حسب نوع التخزين' : 'Distribution by Storage Type'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const percentage = totalCount > 0 ? (cat.count / totalCount) * 100 : 0;

            return (
              <div
                key={cat.id}
                className={`bg-gradient-to-br ${cat.bgColor} backdrop-blur-xl rounded-2xl p-6 border ${cat.borderColor} shadow-xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${cat.bgColor} rounded-xl`}>
                      <cat.icon className={`w-8 h-8 ${cat.textColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{cat.label}</h3>
                      <p className={`text-sm ${cat.textColor}`}>
                        {cat.count} {isRTL ? 'حاوية' : 'containers'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{percentage.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mb-3">
                  <div
                    className={`h-4 bg-gradient-to-r ${cat.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className={`font-semibold ${cat.textColor}`}>
                    {cat.count} / {totalCount} {isRTL ? 'وحدة' : 'units'}
                  </span>
                  <span className="text-gray-400 font-semibold">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Activity — driven by real counts */}
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/30 rounded-xl">
            <Activity className="w-6 h-6 text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRTL ? 'ملخص الحالة' : 'Status Summary'}
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalCount}</div>
            <p className="text-sm text-gray-400">{isRTL ? 'إجمالي الحاويات' : 'Total Containers'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400 mb-1">{chemicalCount}</div>
            <p className="text-sm text-gray-400">{isRTL ? 'كيميائي' : 'Chemical'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-1">{frozenCount}</div>
            <p className="text-sm text-gray-400">{isRTL ? 'مُجمّد' : 'Frozen'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-400 mb-1">{dryCount}</div>
            <p className="text-sm text-gray-400">{isRTL ? 'جاف' : 'Dry'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
