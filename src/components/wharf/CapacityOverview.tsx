import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { BarChart3, Package, TrendingUp, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CapacityOverviewProps {
  language: Language;
}

export function CapacityOverview({ language }: CapacityOverviewProps) {
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [capacityData, setCapacityData] = useState<any>(null);

  const loadCapacityData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-85dcafc8/capacity-overview`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCapacityData(data.overview);
      }
    } catch (error) {
      console.error('Error loading capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapacityData();
    const interval = setInterval(loadCapacityData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const mockData = capacityData || {
    totalCapacity: 50000,
    totalUsed: 38500,
    byType: [
      { type: 'general', capacity: 20000, used: 15000 },
      { type: 'refrigerated', capacity: 10000, used: 7500 },
      { type: 'hazardous', capacity: 10000, used: 8000 },
      { type: 'bulk', capacity: 10000, used: 8000 }
    ],
    trend: {
      daily: '+2.5%',
      weekly: '+12%',
      monthly: '+28%'
    },
    predictions: {
      capacityFull: '3 days',
      recommendedAction: 'Increase bulk storage'
    }
  };

  const overallPercentage = (mockData.totalUsed / mockData.totalCapacity) * 100;

  const getTypeInfo = (type: string) => {
    const info: Record<string, { ar: string; en: string; icon: string; color: string }> = {
      general: { ar: 'عام', en: 'General', icon: '🏭', color: 'from-blue-500 to-cyan-500' },
      refrigerated: { ar: 'مبرد', en: 'Refrigerated', icon: '❄️', color: 'from-cyan-500 to-blue-600' },
      hazardous: { ar: 'خطير', en: 'Hazardous', icon: '⚠️', color: 'from-orange-500 to-red-500' },
      bulk: { ar: 'بالجملة', en: 'Bulk', icon: '📦', color: 'from-purple-500 to-pink-500' }
    };
    const data = info[type] || info.general;
    return {
      name: isRTL ? data.ar : data.en,
      icon: data.icon,
      color: data.color
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'نظرة عامة على السعة' : 'Capacity Overview'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'مراقبة وتحليل السعة الإجمالية' : 'Monitor and analyze overall capacity'}
          </p>
        </div>
        <button
          onClick={loadCapacityData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Overall Capacity Card */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-indigo-400/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/30 rounded-2xl">
              <BarChart3 className="w-10 h-10 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {isRTL ? 'السعة الإجمالية' : 'Total Capacity'}
              </h2>
              <p className="text-indigo-200 text-lg">
                {mockData.totalUsed.toLocaleString()} / {mockData.totalCapacity.toLocaleString()} {isRTL ? 'طن' : 'tons'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-white mb-2">{overallPercentage.toFixed(1)}%</div>
            <div className={`text-lg font-semibold ${
              overallPercentage >= 90 ? 'text-red-400' :
              overallPercentage >= 70 ? 'text-amber-400' :
              'text-green-400'
            }`}>
              {overallPercentage >= 90 ? (isRTL ? 'ممتلئ' : 'FULL') :
               overallPercentage >= 70 ? (isRTL ? 'قريب من الامتلاء' : 'NEAR FULL') :
               (isRTL ? 'متاح' : 'AVAILABLE')}
            </div>
          </div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-8 overflow-hidden mb-4">
          <div 
            className={`h-8 bg-gradient-to-r ${
              overallPercentage >= 90 ? 'from-red-500 to-red-600' :
              overallPercentage >= 70 ? 'from-amber-500 to-orange-500' :
              'from-green-500 to-emerald-500'
            } transition-all duration-500 flex items-center justify-center text-white font-bold`}
            style={{ width: `${overallPercentage}%` }}
          >
            {overallPercentage > 15 && `${overallPercentage.toFixed(0)}%`}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'متاح' : 'Available'}</p>
            <p className="text-2xl font-bold text-green-400">
              {(mockData.totalCapacity - mockData.totalUsed).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{isRTL ? 'طن' : 'tons'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'مستخدم' : 'Used'}</p>
            <p className="text-2xl font-bold text-blue-400">
              {mockData.totalUsed.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{isRTL ? 'طن' : 'tons'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-1">{isRTL ? 'إجمالي' : 'Total'}</p>
            <p className="text-2xl font-bold text-white">
              {mockData.totalCapacity.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{isRTL ? 'طن' : 'tons'}</p>
          </div>
        </div>
      </div>

      {/* Capacity by Type */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-400" />
          {isRTL ? 'السعة حسب النوع' : 'Capacity by Type'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockData.byType.map((item: any) => {
            const percentage = (item.used / item.capacity) * 100;
            const typeInfo = getTypeInfo(item.type);
            const available = item.capacity - item.used;

            return (
              <div
                key={item.type}
                className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{typeInfo.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{typeInfo.name}</h3>
                      <p className="text-sm text-blue-300">{item.used.toLocaleString()} / {item.capacity.toLocaleString()} {isRTL ? 'طن' : 'tons'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{percentage.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mb-3">
                  <div 
                    className={`h-4 bg-gradient-to-r ${typeInfo.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-semibold">
                    {available.toLocaleString()} {isRTL ? 'طن متاح' : 'tons available'}
                  </span>
                  <span className={`font-semibold ${
                    percentage >= 90 ? 'text-red-400' :
                    percentage >= 70 ? 'text-amber-400' :
                    'text-green-400'
                  }`}>
                    {percentage >= 90 ? (isRTL ? 'ممتلئ' : 'Full') :
                     percentage >= 70 ? (isRTL ? 'قريب' : 'Near Full') :
                     (isRTL ? 'متاح' : 'Available')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trends & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Capacity Trend */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isRTL ? 'اتجاه السعة' : 'Capacity Trend'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{isRTL ? 'يومي' : 'Daily'}</span>
              <span className="text-2xl font-bold text-green-400">{mockData.trend.daily}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{isRTL ? 'أسبوعي' : 'Weekly'}</span>
              <span className="text-2xl font-bold text-green-400">{mockData.trend.weekly}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{isRTL ? 'شهري' : 'Monthly'}</span>
              <span className="text-2xl font-bold text-green-400">{mockData.trend.monthly}</span>
            </div>
          </div>
        </div>

        {/* Predictions & Alerts */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isRTL ? 'التوقعات والتنبيهات' : 'Predictions & Alerts'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-2">{isRTL ? 'امتلاء السعة المتوقع' : 'Predicted Capacity Full'}</p>
              <p className="text-2xl font-bold text-amber-400">{mockData.predictions.capacityFull}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-2">{isRTL ? 'الإجراء الموصى به' : 'Recommended Action'}</p>
              <p className="text-white font-semibold">{mockData.predictions.recommendedAction}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/30 rounded-xl">
            <Activity className="w-6 h-6 text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRTL ? 'النشاط في الوقت الفعلي' : 'Real-time Activity'}
          </h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">24</div>
            <p className="text-sm text-gray-400">{isRTL ? 'حاويات اليوم' : 'Today\'s containers'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">8</div>
            <p className="text-sm text-gray-400">{isRTL ? 'في الانتظار' : 'Awaiting'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">156</div>
            <p className="text-sm text-gray-400">{isRTL ? 'هذا الأسبوع' : 'This week'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">98%</div>
            <p className="text-sm text-gray-400">{isRTL ? 'معدل النجاح' : 'Success rate'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
