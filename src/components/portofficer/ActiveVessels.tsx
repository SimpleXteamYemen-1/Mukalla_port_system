import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { Ship, Eye, FileCheck, Clock, Anchor, Search, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { getVessels, releaseBerth, Vessel } from '../../utils/portOfficerApi';

interface ActiveVesselsProps {
  language: Language;
  onNavigate: (page: string) => void;
}

export function ActiveVessels({ language, onNavigate }: ActiveVesselsProps) {
  const t = translations[language].portOfficer;
  const isRTL = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [vesselToRelease, setVesselToRelease] = useState<Vessel | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const vesselsData = await getVessels();
      setVessels(vesselsData);
    } catch (error) {
      console.error('Error loading vessels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReleaseBerth = async () => {
    if (!vesselToRelease || !vesselToRelease.currentWharf || releasing) return;

    setReleasing(true);
    try {
      await releaseBerth(vesselToRelease.id, vesselToRelease.currentWharf, 'Port Officer');
      
      // Reload data
      await loadData();
      
      setShowReleaseModal(false);
      setVesselToRelease(null);
    } catch (error: any) {
      console.error('Error releasing berth:', error);
      alert(error.message || 'Failed to release berth');
    } finally {
      setReleasing(false);
    }
  };

  const activeVessels = vessels.filter(v => v.status !== 'awaiting');

  const filteredVessels = activeVessels.filter(vessel =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vessel.currentWharf && vessel.currentWharf.toLowerCase().includes(searchTerm.toLowerCase())) ||
    vessel.agent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'docked': return 'bg-blue-500/20 text-blue-400';
      case 'loading': return 'bg-amber-500/20 text-amber-400';
      case 'unloading': return 'bg-purple-500/20 text-purple-400';
      case 'ready': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getClearanceStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-emerald-500/20 text-emerald-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'none': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const viewDetails = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setShowDetailsModal(true);
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
              {isRTL ? 'السفن النشطة' : 'Active Vessels'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'السفن الراسية حالياً في الميناء' : 'Vessels Currently Docked in Port'}
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

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-white mb-1">{activeVessels.length}</div>
          <div className="text-sm text-blue-200">{isRTL ? 'إجمالي السفن' : 'Total Vessels'}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {activeVessels.filter(v => v.status === 'ready').length}
          </div>
          <div className="text-sm text-blue-200">{isRTL ? 'جاهز للمغادرة' : 'Ready to Depart'}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {activeVessels.filter(v => v.clearanceStatus === 'pending').length}
          </div>
          <div className="text-sm text-blue-200">{isRTL ? 'تصاريح معلقة' : 'Pending Clearances'}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {activeVessels.filter(v => v.clearanceStatus === 'issued').length}
          </div>
          <div className="text-sm text-blue-200">{isRTL ? 'تصاريح صادرة' : 'Clearances Issued'}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث بالاسم، الرصيف، أو الوكيل...' : 'Search by name, wharf, or agent...'}
            className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          />
        </div>
      </div>

      {/* Vessels Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'اسم السفينة' : 'Vessel Name'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'النوع' : 'Type'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'الرصيف' : 'Wharf'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'وقت الوصول' : 'Arrival Time'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'التصريح' : 'Clearance'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-400">
                  {isRTL ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVessels.map((vessel) => (
                <tr key={vessel.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Ship className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{vessel.name}</div>
                        <div className="text-xs text-gray-400">{vessel.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{vessel.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-semibold">{vessel.currentWharf || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{vessel.arrival}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vessel.status)}`}>
                      {isRTL 
                        ? (vessel.status === 'docked' ? 'راسية' : 
                           vessel.status === 'loading' ? 'تحميل' :
                           vessel.status === 'unloading' ? 'تفريغ' : 'جاهزة')
                        : vessel.status.charAt(0).toUpperCase() + vessel.status.slice(1)
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getClearanceStatusColor(vessel.clearanceStatus)}`}>
                      {isRTL 
                        ? (vessel.clearanceStatus === 'issued' ? 'صادر' :
                           vessel.clearanceStatus === 'pending' ? 'معلق' : 'لا يوجد')
                        : (vessel.clearanceStatus === 'issued' ? 'Issued' :
                           vessel.clearanceStatus === 'pending' ? 'Pending' : 'None')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDetails(vessel)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                      {vessel.clearanceStatus !== 'issued' && (
                        <button
                          onClick={() => onNavigate('clearances')}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                          title={isRTL ? 'إصدار تصريح' : 'Issue Clearance'}
                        >
                          <FileCheck className="w-4 h-4 text-white" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setVesselToRelease(vessel);
                          setShowReleaseModal(true);
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title={isRTL ? 'تحرير الرصيف' : 'Release Berth'}
                      >
                        <XCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVessels.length === 0 && (
          <div className="text-center py-12">
            <Ship className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {isRTL ? 'لا توجد سفن متطابقة مع البحث' : 'No vessels match your search'}
            </p>
          </div>
        )}
      </div>

      {/* Vessel Details Modal */}
      {showDetailsModal && selectedVessel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#153B5E] to-[#1A4D6F] backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full border-2 border-cyan-400/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/30 rounded-xl">
                  <Ship className="w-8 h-8 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedVessel.name}</h3>
                  <p className="text-cyan-300">{selectedVessel.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white text-2xl">×</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">{isRTL ? 'نوع السفينة' : 'Vessel Type'}</p>
                <p className="text-white font-bold">{selectedVessel.type}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">{isRTL ? 'الرصيف' : 'Wharf'}</p>
                <p className="text-white font-bold">{selectedVessel.currentWharf || 'N/A'}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">{isRTL ? 'وقت الوصول' : 'Arrival Time'}</p>
                <p className="text-white font-bold">{selectedVessel.arrival}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">{isRTL ? 'الوكيل البحري' : 'Maritime Agent'}</p>
                <p className="text-white font-bold">{selectedVessel.agent}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{isRTL ? 'حالة السفينة' : 'Vessel Status'}</p>
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(selectedVessel.status)}`}>
                    {isRTL 
                      ? (selectedVessel.status === 'docked' ? 'راسية' : 
                         selectedVessel.status === 'loading' ? 'تحميل' :
                         selectedVessel.status === 'unloading' ? 'تفريغ' : 'جاهزة')
                      : selectedVessel.status.charAt(0).toUpperCase() + selectedVessel.status.slice(1)
                    }
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">{isRTL ? 'حالة التصريح' : 'Clearance Status'}</p>
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getClearanceStatusColor(selectedVessel.clearanceStatus)}`}>
                    {isRTL 
                      ? (selectedVessel.clearanceStatus === 'issued' ? 'صادر' :
                         selectedVessel.clearanceStatus === 'pending' ? 'معلق' : 'لا يوجد')
                      : (selectedVessel.clearanceStatus === 'issued' ? 'Issued' :
                         selectedVessel.clearanceStatus === 'pending' ? 'Pending' : 'None')
                    }
                  </span>
                </div>
              </div>
            </div>

            {selectedVessel.clearanceStatus !== 'issued' && (
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  onNavigate('clearances');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-3"
              >
                <FileCheck className="w-5 h-5" />
                {isRTL ? 'المتابعة لإصدار تصريح المغادرة' : 'Proceed to Issue Clearance'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Release Berth Confirmation Modal */}
      {showReleaseModal && vesselToRelease && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border-2 border-red-400/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/30 rounded-xl">
                <XCircle className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'تحرير الرصيف' : 'Release Berth'}
              </h3>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">{isRTL ? 'السفينة:' : 'Vessel:'}</span>
                <span className="text-white font-bold">{vesselToRelease.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">{isRTL ? 'الرصيف:' : 'Wharf:'}</span>
                <span className="text-white font-bold">{vesselToRelease.currentWharf}</span>
              </div>
            </div>

            <p className="text-red-100 mb-6 text-lg">
              {isRTL 
                ? 'هل أنت متأكد من تحرير هذا الرصيف؟ سيتم إزالة السفينة من الرصيف وتحديث حالتها.'
                : 'Are you sure you want to release this berth? The vessel will be removed from the wharf and its status will be updated.'
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReleaseModal(false);
                  setVesselToRelease(null);
                }}
                disabled={releasing}
                className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleReleaseBerth}
                disabled={releasing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {releasing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {isRTL ? 'جاري التحرير...' : 'Releasing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {isRTL ? 'تأكيد التحرير' : 'Confirm Release'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
