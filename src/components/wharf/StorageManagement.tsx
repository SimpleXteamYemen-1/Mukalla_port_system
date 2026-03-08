import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { AlertTriangle, TrendingUp, RefreshCw, Database } from 'lucide-react';
import { wharfService } from '../../services/wharfService';

interface StorageManagementProps {
  language: Language;
}

interface StorageArea {
  id: string;
  name: string;
  capacity: number;
  used: number;
  type: 'general' | 'refrigerated' | 'hazardous' | 'bulk';
  status: 'available' | 'near_full' | 'full';
}

export function StorageManagement({ language }: StorageManagementProps) {
  const isRTL = language === 'ar';
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStorageData = async () => {
    setLoading(true);
    try {
      const data = await wharfService.getStorageAreas();
      if (data && data.success) {
        setStorageAreas(data.areas);
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const getStorageColor = (used: number, capacity: number) => {
    const percentage = (used / capacity) * 100;
    if (percentage >= 90) return 'from-red-500 to-red-600';
    if (percentage >= 70) return 'from-amber-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getStorageStatus = (used: number, capacity: number) => {
    const percentage = (used / capacity) * 100;
    if (percentage >= 90) return { label: isRTL ? 'ممتلئ' : 'Full', color: 'text-red-400' };
    if (percentage >= 70) return { label: isRTL ? 'قريب من الامتلاء' : 'Near Full', color: 'text-amber-400' };
    return { label: isRTL ? 'متاح' : 'Available', color: 'text-green-400' };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'refrigerated': return '❄️';
      case 'hazardous': return '⚠️';
      case 'bulk': return '📦';
      default: return '🏭';
    }
  };

  const getTypeName = (type: string) => {
    const names: Record<string, { ar: string; en: string }> = {
      general: { ar: 'عام', en: 'General' },
      refrigerated: { ar: 'مبرد', en: 'Refrigerated' },
      hazardous: { ar: 'خطير', en: 'Hazardous' },
      bulk: { ar: 'بالجملة', en: 'Bulk' }
    };
    return isRTL ? names[type]?.ar : names[type]?.en;
  };

  const totalCapacity = storageAreas.reduce((sum, area) => sum + area.capacity, 0);
  const totalUsed = storageAreas.reduce((sum, area) => sum + area.used, 0);
  const overallPercentage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'إدارة التخزين' : 'Storage Management'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'مراقبة مناطق التخزين والسعة' : 'Monitor storage areas and capacity'}
          </p>
        </div>
        <button
          onClick={loadStorageData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Overall Capacity */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-purple-400/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRTL ? 'السعة الإجمالية' : 'Overall Capacity'}
            </h2>
            <p className="text-purple-200">
              {totalUsed.toLocaleString()} / {totalCapacity.toLocaleString()} {isRTL ? 'طن' : 'tons'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-white mb-2">{overallPercentage.toFixed(1)}%</div>
            <div className={`text-sm font-semibold ${overallPercentage >= 90 ? 'text-red-400' :
              overallPercentage >= 70 ? 'text-amber-400' :
                'text-green-400'
              }`}>
              {overallPercentage >= 90 ? (isRTL ? 'ممتلئ' : 'FULL') :
                overallPercentage >= 70 ? (isRTL ? 'قريب من الامتلاء' : 'NEAR FULL') :
                  (isRTL ? 'متاح' : 'AVAILABLE')}
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
          <div
            className={`h-6 bg-gradient-to-r ${getStorageColor(totalUsed, totalCapacity)} transition-all duration-500 flex items-center justify-center text-white text-sm font-bold`}
            style={{ width: `${overallPercentage}%` }}
          >
            {overallPercentage > 10 && `${overallPercentage.toFixed(0)}%`}
          </div>
        </div>
        {overallPercentage >= 70 && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 text-sm">
              {isRTL
                ? 'تحذير: السعة الإجمالية تقترب من الحد الأقصى'
                : 'Warning: Overall capacity approaching limit'}
            </span>
          </div>
        )}
      </div>

      {/* Storage Areas Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-400" />
          {isRTL ? 'مناطق التخزين' : 'Storage Areas'}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storageAreas.map((area) => {
              const percentage = (area.used / area.capacity) * 100;
              const status = getStorageStatus(area.used, area.capacity);
              const available = area.capacity - area.used;

              return (
                <div
                  key={area.id}
                  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl hover:shadow-2xl transition-all"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getTypeIcon(area.type)}</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{area.name}</h3>
                        <p className="text-sm text-blue-300">{getTypeName(area.type)}</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${status.color}`}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mb-2">
                      <div
                        className={`h-4 bg-gradient-to-r ${getStorageColor(area.used, area.capacity)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {area.used.toLocaleString()} {isRTL ? 'طن مستخدم' : 'tons used'}
                      </span>
                      <span className="text-gray-300">
                        {area.capacity.toLocaleString()} {isRTL ? 'طن' : 'tons'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{isRTL ? 'متاح' : 'Available'}</p>
                      <p className={`text-lg font-bold ${status.color}`}>
                        {available.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{isRTL ? 'طن' : 'tons'}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{isRTL ? 'الحالة' : 'Status'}</p>
                      <p className={`text-sm font-bold ${status.color}`}>
                        {status.label}
                      </p>
                    </div>
                  </div>

                  {/* Alert */}
                  {percentage >= 90 && (
                    <div className="mt-4 flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl p-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-200 text-xs">
                        {isRTL ? 'ممتلئ - لا يمكن قبول حاويات جديدة' : 'Full - Cannot accept new containers'}
                      </span>
                    </div>
                  )}
                  {percentage >= 70 && percentage < 90 && (
                    <div className="mt-4 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl p-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-200 text-xs">
                        {isRTL ? 'قريب من الامتلاء' : 'Near capacity'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Capacity Trend */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-6 border border-indigo-400/30 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {isRTL ? 'اتجاه السعة' : 'Capacity Trend'}
            </h3>
            <p className="text-indigo-300 text-sm">
              {isRTL ? 'آخر 7 أيام' : 'Last 7 days'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{isRTL ? 'متوسط الاستخدام' : 'Average Usage'}</p>
            <p className="text-2xl font-bold text-white">78%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{isRTL ? 'ذروة الاستخدام' : 'Peak Usage'}</p>
            <p className="text-2xl font-bold text-white">92%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{isRTL ? 'الاتجاه' : 'Trend'}</p>
            <p className="text-2xl font-bold text-green-400">+5%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
