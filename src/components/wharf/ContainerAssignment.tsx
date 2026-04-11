import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { BoxSelect, Ship, RefreshCw, AlertTriangle, Layers, MapPin } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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
  block?: string;
  row?: number;
  tier?: number;
  arrivalDate: string;
}

const BLOCKS = ['A', 'B', 'C', 'D'];
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1);
const TIERS = Array.from({ length: 5 }, (_, i) => 5 - i);

export function ContainerAssignment({ language }: ContainerAssignmentProps) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string>('A');
  const [selectedCoord, setSelectedCoord] = useState<{ row: number, tier: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const containersData = await wharfService.getContainers();
      const mappedContainers = containersData.map((c: any) => ({
        id: c.id.toString(),
        vesselName: c.manifest?.vessel?.name || 'Unknown',
        trader: 'Trader',
        weight: 10,
        type: 'general',
        status: c.status,
        block: c.block,
        row: c.row,
        tier: c.tier,
        arrivalDate: c.created_at || new Date().toISOString()
      }));
      setContainers(mappedContainers);
      if (selectedContainer) {
        const stillAwaiting = mappedContainers.find((c: Container) => c.id === selectedContainer.id && c.status === 'awaiting');
        if (!stillAwaiting) {
          setSelectedContainer(null);
          setSelectedCoord(null);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedContainer || !selectedCoord) {
      setErrorMsg(isRTL ? 'الرجاء تحديد حاوية وإحداثيات فارغة' : 'Please select a container and empty coordinates');
      return;
    }
    setAssigning(true);
    setErrorMsg('');
    try {
      await wharfService.assignContainer(selectedContainer.id, selectedBlock, selectedCoord.row, selectedCoord.tier);
      await loadData();
      setSelectedCoord(null);
    } catch (error: any) {
      console.error('Error assigning container:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Failed to assign container');
    } finally {
      setAssigning(false);
    }
  };

  const checkOccupied = (block: string, row: number, tier: number) => {
    return containers.find(c => c.block === block && c.row === row && c.tier === tier);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'refrigerated': return '❄️';
      case 'hazardous': return '⚠️';
      default: return '📦';
    }
  };

  const awaitingContainers = containers.filter(c => c.status === 'awaiting');

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isRTL ? 'إدارة ساحة الحاويات' : 'Yard Management'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL ? 'خريطة ساحة الحاويات والتعيين الدقيق' : 'Interactive Yard Map and Precise Container Assignment'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
        >
          {loading ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Awaiting List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col shadow-sm" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
            <BoxSelect className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {isRTL ? 'في انتظار التعيين' : 'Awaiting Assignment'}
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {awaitingContainers.length}
            </span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><LoadingIndicator type="line-spinner" size="sm" /></div>
            ) : awaitingContainers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">{isRTL ? 'لا توجد حاويات تنتظر التعيين' : 'No containers awaiting assignment'}</div>
            ) : (
              awaitingContainers.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedContainer(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${selectedContainer?.id === c.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/25 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-slate-900 dark:text-slate-50 font-bold text-sm">{c.id}</span>
                    <span className="text-base">{getTypeIcon(c.type)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Ship className="w-3 h-3" />
                    <span className="truncate">{c.vesselName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Yard Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {isRTL ? 'خريطة الساحة' : 'Yard Grid Map'}
              </h2>

              {/* Block Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg gap-1">
                {BLOCKS.map(block => (
                  <button
                    key={block}
                    onClick={() => { setSelectedBlock(block); setSelectedCoord(null); }}
                    className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors duration-200 ${selectedBlock === block
                      ? 'bg-blue-900 dark:bg-blue-800 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isRTL ? `المربع ${block}` : `Block ${block}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs mb-5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></div>
                <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'فارغ' : 'Empty'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40 border border-green-400 dark:border-green-700"></div>
                <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'مشغول' : 'Occupied'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600 shadow-sm"></div>
                <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'محدد' : 'Selected'}</span>
              </div>
            </div>

            {/* The Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[560px] flex">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between pr-3 py-5 border-r border-slate-200 dark:border-slate-700 space-y-2">
                  {TIERS.map(tier => (
                    <div key={`tier-label-${tier}`} className="h-10 flex items-center justify-end text-slate-400 text-xs font-mono w-14">
                      Tier {tier}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="flex-1 pl-3 flex flex-col space-y-2 py-5">
                  {TIERS.map(tier => (
                    <div key={`row-tier-${tier}`} className="flex gap-2">
                      {ROWS.map(row => {
                        const occupiedBy = checkOccupied(selectedBlock, row, tier);
                        const isSelected = selectedCoord?.row === row && selectedCoord?.tier === tier;
                        let cellClass = 'w-11 h-10 rounded border flex items-center justify-center transition-all cursor-pointer font-bold text-xs ';

                        if (isSelected) {
                          cellClass += 'bg-blue-500 dark:bg-blue-600 border-blue-400 text-white shadow scale-110 z-10';
                        } else if (occupiedBy) {
                          cellClass += 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50';
                        } else {
                          cellClass += 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-transparent hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20';
                        }

                        return (
                          <div
                            key={`cell-${row}-${tier}`}
                            className={cellClass}
                            onClick={() => {
                              if (occupiedBy) return;
                              if (selectedContainer) {
                                setSelectedCoord({ row, tier });
                                setErrorMsg('');
                              }
                            }}
                            title={occupiedBy ? `${isRTL ? 'مشغول بـ' : 'Occupied by'} ${occupiedBy.id}` : `${isRTL ? 'فارغ' : 'Empty'} (R${row}-T${tier})`}
                          >
                            {occupiedBy ? '■' : '+'}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* X-Axis */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                    {ROWS.map(row => (
                      <div key={`row-label-${row}`} className="w-11 text-center text-slate-400 text-xs font-mono">
                        R{row}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/25 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{isRTL ? 'الحاوية المحددة' : 'Selected Container'}</span>
                  <div className="text-slate-900 dark:text-slate-50 font-bold text-lg">{selectedContainer ? selectedContainer.id : '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/25 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{isRTL ? 'الموقع المحدد' : 'Selected Location'}</span>
                  <div className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                    {selectedCoord ? `B:${selectedBlock} R:${selectedCoord.row} T:${selectedCoord.tier}` : '-'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center flex-shrink-0 w-full md:w-auto">
                {errorMsg && (
                  <div className="text-red-700 dark:text-red-400 text-xs mb-3 flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/30">
                    <AlertTriangle className="w-4 h-4" /> {errorMsg}
                  </div>
                )}
                <button
                  onClick={handleAssign}
                  disabled={!selectedContainer || !selectedCoord || assigning}
                  className="w-full md:w-56 py-3 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold flex justify-center items-center gap-2 transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {assigning ? <LoadingIndicator type="line-spinner" size="xs" className="text-white" /> : <Layers className="w-5 h-5" />}
                  {isRTL ? 'تعيين الموقع' : 'Assign Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
