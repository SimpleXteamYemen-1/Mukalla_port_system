import React, { useState, useEffect } from 'react';
import { Language, User } from '../../App';
import { translations } from '../../utils/translations';
import { Anchor, Ship, AlertTriangle, CheckCircle, X, MapPin, RefreshCw } from 'lucide-react';
import { getVessels, getWharves, assignBerth, Vessel, Wharf } from '../../utils/portOfficerApi';

interface BerthingManagementProps {
  language: Language;
}

export function BerthingManagement({ language }: BerthingManagementProps) {
  const t = translations[language].portOfficer;
  const isRTL = language === 'ar';

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [wharves, setWharves] = useState<Wharf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedWharf, setSelectedWharf] = useState<Wharf | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vesselsData, wharvesData] = await Promise.all([
        getVessels(),
        getWharves()
      ]);
      setVessels(vesselsData);
      setWharves(wharvesData);
    } catch (error) {
      console.error('Error loading berthing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignBerth = () => {
    if (!selectedVessel || !selectedWharf) return;

    if (selectedWharf.status === 'occupied') {
      setShowConflictWarning(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedVessel || !selectedWharf || assigning) return;

    setAssigning(true);
    try {
      await assignBerth(selectedVessel.id, selectedWharf.id, 'Port Officer');
      
      // Reload data after assignment
      await loadData();
      
      setShowConfirmModal(false);
      setSelectedVessel(null);
      setSelectedWharf(null);
    } catch (error: any) {
      console.error('Error assigning berth:', error);
      alert(error.message || 'Failed to assign berth');
    } finally {
      setAssigning(false);
    }
  };

  const awaitingVessels = vessels.filter(v => v.status === 'awaiting');

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
              {isRTL ? 'إدارة الرسو' : 'Berthing Management'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'تعيين السفن إلى أرصفة معتمدة' : 'Assign Vessels to Approved Wharves'}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessels Awaiting Berth */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Ship className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'سفن تنتظر الرسو' : 'Vessels Awaiting Berth'}
              </h2>
            </div>

            {awaitingVessels.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {awaitingVessels.map((vessel) => (
                  <div
                    key={vessel.id}
                    onClick={() => setSelectedVessel(vessel)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVessel?.id === vessel.id
                        ? 'bg-cyan-500/20 border-cyan-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold">{vessel.name}</h3>
                      {selectedVessel?.id === vessel.id && (
                        <CheckCircle className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-sm text-blue-300 mb-1">
                      {isRTL ? 'النوع: ' : 'Type: '}{vessel.type}
                    </p>
                    <p className="text-sm text-blue-300 mb-1">
                      {isRTL ? 'الوصول: ' : 'Arrival: '}{vessel.arrival}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isRTL ? 'الوكيل: ' : 'Agent: '}{vessel.agent}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ship className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">{isRTL ? 'لا توجد سفن تنتظر' : 'No vessels awaiting berth'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Wharf Occupancy Map */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  {isRTL ? 'خريطة إشغال الأرصفة' : 'Wharf Occupancy Map'}
                </h2>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>
                  <span className="text-white">{isRTL ? 'متاح' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-white">{isRTL ? 'مشغول' : 'Occupied'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {wharves.map((wharf) => (
                <div
                  key={wharf.id}
                  onClick={() => setSelectedWharf(wharf)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedWharf?.id === wharf.id
                      ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                      : wharf.status === 'available'
                      ? 'bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 border-red-400/30 hover:bg-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-lg">{wharf.id}</h3>
                    <Anchor className={`w-6 h-6 ${
                      wharf.status === 'available' ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{wharf.name}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    {isRTL ? 'السعة: ' : 'Capacity: '}{wharf.capacity.toLocaleString()} DWT
                  </p>
                  {wharf.vessel && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-xs text-white font-semibold">{wharf.vessel}</p>
                    </div>
                  )}
                  {wharf.status === 'available' && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>{isRTL ? 'جاهز للتعيين' : 'Ready for Assignment'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {isRTL ? 'لوحة التعيين' : 'Assignment Panel'}
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-gray-400 mb-2">{isRTL ? 'السفينة المحددة' : 'Selected Vessel'}</p>
                {selectedVessel ? (
                  <p className="text-white font-bold">{selectedVessel.name}</p>
                ) : (
                  <p className="text-gray-500 italic">{isRTL ? 'لم يتم اختيار سفينة' : 'No vessel selected'}</p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-gray-400 mb-2">{isRTL ? 'الرصيف المحدد' : 'Selected Wharf'}</p>
                {selectedWharf ? (
                  <div>
                    <p className="text-white font-bold">{selectedWharf.id}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedWharf.status === 'available' 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedWharf.status === 'available' 
                        ? (isRTL ? 'متاح' : 'Available')
                        : (isRTL ? 'مشغول' : 'Occupied')}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">{isRTL ? 'لم يتم اختيار رصيف' : 'No wharf selected'}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleAssignBerth}
              disabled={!selectedVessel || !selectedWharf || assigning}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3"
            >
              {assigning ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  {isRTL ? 'جاري التعيين...' : 'Assigning...'}
                </>
              ) : (
                <>
                  <Anchor className="w-6 h-6" />
                  {isRTL ? 'تأكيد تعيين الرصيف' : 'Confirm Berth Assignment'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {showConflictWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border-2 border-red-400/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/30 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'تحذير تعارض' : 'Conflict Warning'}
              </h3>
            </div>

            <p className="text-red-100 mb-6 text-lg">
              {isRTL 
                ? `الرصيف ${selectedWharf?.id} مشغول حالياً بواسطة ${selectedWharf?.vessel}. لا يمكن تعيين سفينة أخرى.`
                : `Wharf ${selectedWharf?.id} is currently occupied by ${selectedWharf?.vessel}. Cannot assign another vessel.`
              }
            </p>

            <button
              onClick={() => setShowConflictWarning(false)}
              className="w-full bg-white hover:bg-gray-100 text-red-900 py-3 rounded-xl font-bold transition-colors"
            >
              {isRTL ? 'فهمت' : 'Understood'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#153B5E] to-[#1A4D6F] backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border-2 border-cyan-400/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-cyan-500/30 rounded-xl">
                <CheckCircle className="w-8 h-8 text-cyan-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'تأكيد التعيين' : 'Confirm Assignment'}
              </h3>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">{isRTL ? 'السفينة:' : 'Vessel:'}</span>
                <span className="text-white font-bold">{selectedVessel?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">{isRTL ? 'الرصيف:' : 'Wharf:'}</span>
                <span className="text-white font-bold">{selectedWharf?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">{isRTL ? 'الموقع:' : 'Location:'}</span>
                <span className="text-white font-bold">{selectedWharf?.name}</span>
              </div>
            </div>

            <p className="text-cyan-100 mb-6">
              {isRTL 
                ? 'هل أنت متأكد من تعيين هذه السفينة إلى الرصيف المحدد؟'
                : 'Are you sure you want to assign this vessel to the selected wharf?'
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={assigning}
                className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmAssignment}
                disabled={assigning}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {isRTL ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
