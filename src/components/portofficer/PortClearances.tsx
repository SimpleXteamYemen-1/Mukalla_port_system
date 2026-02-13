import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { FileCheck, Ship, Clock, CheckCircle, AlertCircle, QrCode, X, RefreshCw } from 'lucide-react';
import { getClearances, issueClearance, getVessels, Clearance } from '../../utils/portOfficerApi';

interface PortClearancesProps {
  language: Language;
}

export function PortClearances({ language }: PortClearancesProps) {
  const t = translations[language].portOfficer;
  const isRTL = language === 'ar';

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [nextPort, setNextPort] = useState('');
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [availableVessels, setAvailableVessels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clearancesData, vesselsData] = await Promise.all([
        getClearances(),
        getVessels()
      ]);
      setClearances(clearancesData);
      
      // Get vessels that are docked (not awaiting berth)
      const dockedVessels = vesselsData
        .filter(v => v.status !== 'awaiting')
        .map(v => v.name);
      setAvailableVessels(dockedVessels);
    } catch (error) {
      console.error('Error loading clearances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueClearance = async () => {
    if (!selectedVessel || !nextPort || issuing) return;

    setIssuing(true);
    try {
      await issueClearance(selectedVessel, nextPort, 'Port Officer');
      
      // Reload clearances
      await loadData();
      
      setShowIssueForm(false);
      setSelectedVessel('');
      setNextPort('');
    } catch (error: any) {
      console.error('Error issuing clearance:', error);
      alert(error.message || 'Failed to issue clearance');
    } finally {
      setIssuing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
      case 'expiring-soon': return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-5 h-5" />;
      case 'expiring-soon': return <Clock className="w-5 h-5" />;
      case 'expired': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const viewQRCode = (clearance: Clearance) => {
    setSelectedClearance(clearance);
    setShowQRModal(true);
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
              {isRTL ? 'تصاريح مغادرة الميناء' : 'Port Clearances'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'إصدار وإدارة تصاريح مغادرة السفن' : 'Issue and Manage Vessel Departure Clearances'}
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
            <button
              onClick={() => setShowIssueForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-3"
            >
              <FileCheck className="w-5 h-5" />
              {isRTL ? 'إصدار تصريح جديد' : 'Issue New Clearance'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {clearances.filter(c => c.status === 'valid').length}
              </div>
              <div className="text-sm text-gray-300">{isRTL ? 'تصاريح سارية' : 'Valid Clearances'}</div>
            </div>
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-1">
                {clearances.filter(c => c.status === 'expiring-soon').length}
              </div>
              <div className="text-sm text-gray-300">{isRTL ? 'تنتهي قريباً' : 'Expiring Soon'}</div>
            </div>
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400 mb-1">
                {clearances.filter(c => c.status === 'expired').length}
              </div>
              <div className="text-sm text-gray-300">{isRTL ? 'منتهية الصلاحية' : 'Expired'}</div>
            </div>
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Clearances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clearances.map((clearance) => (
          <div
            key={clearance.id}
            className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 ${getStatusColor(clearance.status)} shadow-2xl`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(clearance.status)}
                <div>
                  <h3 className="text-white font-bold text-lg">{clearance.clearanceId}</h3>
                  <p className="text-xs text-gray-400">
                    {isRTL ? 'رقم التصريح' : 'Clearance ID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => viewQRCode(clearance)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <QrCode className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Ship className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-400">{isRTL ? 'السفينة' : 'Vessel'}</p>
                  <p className="text-white font-semibold">{clearance.vessel}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">{isRTL ? 'الميناء التالي' : 'Next Port'}</p>
                  <p className="text-white font-semibold text-sm">{clearance.nextPort}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">{isRTL ? 'الوقت المتبقي' : 'Time Remaining'}</p>
                  <p className={`font-bold text-sm ${
                    clearance.hoursRemaining < 0 ? 'text-red-400' :
                    clearance.hoursRemaining < 6 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {clearance.hoursRemaining < 0 
                      ? (isRTL ? 'منتهي' : 'Expired')
                      : `${clearance.hoursRemaining}h`
                    }
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">{isRTL ? 'وقت الإصدار' : 'Issue Time'}</p>
                <p className="text-white text-sm">{clearance.issueTime}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">{isRTL ? 'وقت الانتهاء' : 'Expiry Time'}</p>
                <p className="text-white text-sm">{clearance.expiryTime}</p>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-lg text-center font-semibold ${getStatusColor(clearance.status)}`}>
              {clearance.status === 'valid' && (isRTL ? 'تصريح ساري' : 'Valid Clearance')}
              {clearance.status === 'expiring-soon' && (isRTL ? 'ينتهي قريباً' : 'Expiring Soon')}
              {clearance.status === 'expired' && (isRTL ? 'منتهي الصلاحية' : 'Expired')}
            </div>
          </div>
        ))}
      </div>

      {clearances.length === 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
          <FileCheck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {isRTL ? 'لا توجد تصاريح مغادرة' : 'No clearances issued yet'}
          </p>
        </div>
      )}

      {/* Issue Clearance Form Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#153B5E] to-[#1A4D6F] backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border-2 border-emerald-400/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/30 rounded-xl">
                  <FileCheck className="w-8 h-8 text-emerald-300" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {isRTL ? 'إصدار تصريح مغادرة جديد' : 'Issue New Port Clearance'}
                </h3>
              </div>
              <button
                onClick={() => setShowIssueForm(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  {isRTL ? 'اختر السفينة' : 'Select Vessel'}
                </label>
                <select
                  value={selectedVessel}
                  onChange={(e) => setSelectedVessel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" className="bg-gray-800">
                    {isRTL ? 'اختر سفينة...' : 'Select a vessel...'}
                  </option>
                  {availableVessels.map((vessel) => (
                    <option key={vessel} value={vessel} className="bg-gray-800">
                      {vessel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  {isRTL ? 'الميناء التالي' : 'Next Port'}
                </label>
                <input
                  type="text"
                  value={nextPort}
                  onChange={(e) => setNextPort(e.target.value)}
                  placeholder={isRTL ? 'أدخل اسم الميناء التالي' : 'Enter next port name'}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4">
                <p className="text-cyan-300 text-sm">
                  {isRTL 
                    ? 'سيتم إنشاء رقم تصريح تلقائي بصيغة: PO.Mukalla.NO.{رقم}. صلاحية التصريح 24 ساعة من وقت الإصدار.'
                    : 'Clearance ID will be auto-generated as: PO.Mukalla.NO.{number}. Clearance valid for 24 hours from issue time.'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowIssueForm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleIssueClearance}
                disabled={!selectedVessel || !nextPort || issuing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {issuing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {isRTL ? 'جاري الإصدار...' : 'Issuing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {isRTL ? 'إصدار التصريح' : 'Issue Clearance'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedClearance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#153B5E] to-[#1A4D6F] backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border-2 border-cyan-400/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'رمز QR للتصريح' : 'Clearance QR Code'}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl mb-6">
              <div className="aspect-square bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <QrCode className="w-48 h-48 text-white" />
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">{isRTL ? 'رقم التصريح' : 'Clearance ID'}</p>
              <p className="text-white font-bold text-lg">{selectedClearance.clearanceId}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">{isRTL ? 'السفينة' : 'Vessel'}</p>
              <p className="text-white font-bold">{selectedClearance.vessel}</p>
            </div>

            <p className="text-center text-gray-400 text-sm mt-6">
              {isRTL 
                ? 'امسح هذا الرمز للتحقق من صحة التصريح'
                : 'Scan this code to validate the clearance'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
