import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { BoxSelect, Ship, User, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { wharfService } from '../../services/wharfService';

interface ContainerAssignmentProps {
  language: Language;
}

interface Container {
  id: string;
  vesselName: string;
  trader: string;
  weight: number;
  type: 'general' | 'refrigerated' | 'hazardous' | 'bulk';
  status: 'awaiting' | 'assigned';
  assignedStorage?: string;
  arrivalDate: string;
}

export function ContainerAssignment({ language }: ContainerAssignmentProps) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<Container[]>([]);
  const [storageAreas, setStorageAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [containersData, wharvesData] = await Promise.all([
        wharfService.getContainers(),
        wharfService.getWharves()
      ]);

      // Map backend data to frontend interfaces
      // Backend container: { id, status, manifest: { vessel: { name } }, ... }
      // This mapping depends on what exactly backend returns. 
      // Assuming getContainers returns list of containers with relationships.
      const mappedContainers = containersData.map((c: any) => ({
        id: c.id.toString(),
        vesselName: c.manifest?.vessel?.name || 'Unknown',
        trader: 'Trader', // Mock as backend might not have trader on container yet
        weight: 10, // Mock or c.weight
        type: 'general', // Mock or c.type
        status: c.status,
        assignedStorage: c.location,
        arrivalDate: c.created_at || new Date().toISOString()
      }));

      // Map Wharves to Storage Areas
      const mappedStorage = wharvesData.map((w: any) => ({
        id: w.id.toString(),
        name: w.name,
        capacity: w.capacity,
        used: 0, // Need accurate used capacity from backend, for now 0
        type: 'general' // Assume all wharves can store general
      }));

      setContainers(mappedContainers);
      setStorageAreas(mappedStorage);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (containerId: string) => {
    const storageId = selectedStorage[containerId];
    if (!storageId) {
      alert(isRTL ? 'الرجاء اختيار منطقة تخزين' : 'Please select a storage area');
      return;
    }

    setAssigning(containerId);
    try {
      await wharfService.assignContainer(containerId, storageId);

      await loadData();
      setSelectedStorage(prev => {
        const newState = { ...prev };
        delete newState[containerId];
        return newState;
      });
    } catch (error: any) {
      console.error('Error assigning container:', error);
      alert(error.message || 'Failed to assign container');
    } finally {
      setAssigning(null);
    }
  };

  const handleLogOperation = async (containerId: string, action: 'load' | 'unload' | 'discharge') => {
    try {
      await wharfService.logContainerOperation(containerId, action);
      alert('Operation logged successfully');
      await loadData();
    } catch (error) {
      console.error('Error logging operation:', error);
      alert('Failed to log operation');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'refrigerated': return '❄️';
      case 'hazardous': return '⚠️';
      case 'bulk': return '📦';
      default: return '📦';
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

  const getCompatibleStorage = (containerType: string) => {
    return storageAreas.filter(area => {
      const percentage = (area.used / area.capacity) * 100;
      return area.type === containerType && percentage < 90;
    });
  };

  const awaitingContainers = containers.filter(c => c.status === 'awaiting');
  const assignedContainers = containers.filter(c => c.status === 'assigned');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'تعيين الحاويات' : 'Container Assignment'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'تعيين الحاويات إلى مناطق التخزين' : 'Assign containers to storage areas'}
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

      {/* Awaiting Assignment */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <BoxSelect className="w-6 h-6 text-amber-400" />
          {isRTL ? 'في انتظار التعيين' : 'Awaiting Assignment'}
          <span className="text-sm bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">
            {awaitingContainers.length}
          </span>
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : awaitingContainers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {isRTL ? 'لا توجد حاويات في الانتظار' : 'No Containers Awaiting'}
            </h3>
            <p className="text-gray-400">
              {isRTL ? 'تم تعيين جميع الحاويات' : 'All containers have been assigned'}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'معرف الحاوية' : 'Container ID'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'السفينة' : 'Vessel'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'التاجر' : 'Trader'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'النوع' : 'Type'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'الوزن' : 'Weight'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'منطقة التخزين' : 'Storage Area'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'الإجراء' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {awaitingContainers.map((container) => {
                  const compatibleStorage = getCompatibleStorage(container.type);

                  return (
                    <tr key={container.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getTypeIcon(container.type)}</span>
                          <span className="text-white font-medium">{container.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">{container.vesselName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-300">{container.trader}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-300 text-sm">{getTypeName(container.type)}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{container.weight} {isRTL ? 'طن' : 'tons'}</td>
                      <td className="px-6 py-4">
                        {compatibleStorage.length > 0 ? (
                          <select
                            value={selectedStorage[container.id] || ''}
                            onChange={(e) => setSelectedStorage(prev => ({ ...prev, [container.id]: e.target.value }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          >
                            <option value="">{isRTL ? 'اختر...' : 'Select...'}</option>
                            {compatibleStorage.map(area => {
                              const available = area.capacity - area.used;
                              const canFit = available >= container.weight;
                              return (
                                <option
                                  key={area.id}
                                  value={area.id}
                                  disabled={!canFit}
                                  className="bg-gray-800"
                                >
                                  {area.name} ({available} {isRTL ? 'طن متاح' : 'tons available'})
                                  {!canFit && ' - ' + (isRTL ? 'غير كافٍ' : 'Insufficient')}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className="text-red-400 text-sm flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {isRTL ? 'لا توجد منطقة متاحة' : 'No area available'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAssign(container.id)}
                          disabled={assigning === container.id || !selectedStorage[container.id] || compatibleStorage.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {assigning === container.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {isRTL ? 'جاري التعيين...' : 'Assigning...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {isRTL ? 'تعيين' : 'Assign'}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Containers */}
      {assignedContainers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            {isRTL ? 'الحاويات المعينة' : 'Assigned Containers'}
          </h2>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'معرف الحاوية' : 'Container ID'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'السفينة' : 'Vessel'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'النوع' : 'Type'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'الوزن' : 'Weight'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'موقع التخزين' : 'Storage Location'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {isRTL ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignedContainers.map((container) => (
                  <tr key={container.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(container.type)}</span>
                        <span className="text-white font-medium">{container.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{container.vesselName}</td>
                    <td className="px-6 py-4 text-blue-300 text-sm">{getTypeName(container.type)}</td>
                    <td className="px-6 py-4 text-gray-300">{container.weight} {isRTL ? 'طن' : 'tons'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-400/30 rounded-lg text-sm font-semibold">
                        {container.assignedStorage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLogOperation(container.id, 'load')}
                          className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleLogOperation(container.id, 'discharge')}
                          className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs"
                        >
                          Discharge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
