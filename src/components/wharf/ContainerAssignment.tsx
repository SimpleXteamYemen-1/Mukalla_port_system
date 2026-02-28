import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { BoxSelect, Ship, CheckCircle, RefreshCw, AlertTriangle, Layers, MapPin } from 'lucide-react';
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

// Yard dimensions
const BLOCKS = ['A', 'B', 'C', 'D'];
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10
const TIERS = Array.from({ length: 5 }, (_, i) => 5 - i); // 5 to 1 (top to bottom visual)

export function ContainerAssignment({ language }: ContainerAssignmentProps) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selection state
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

      // Clear selection if it was assigned or no longer exists
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
      case 'bulk': return '📦';
      default: return '📦';
    }
  };

  const awaitingContainers = containers.filter(c => c.status === 'awaiting');

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#0A1628] via-[#153B5E] to-[#1A4D6F]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'إدارة ساحة الحاويات' : 'Yard Management'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'خريطة ساحة الحاويات والتعيين الدقيق' : 'Interactive Yard Map and Precise Container Assignment'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Awaiting List */}
        <div className="lg:col-span-1 border border-white/20 bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col max-h-[calc(100vh-160px)]">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <BoxSelect className="w-5 h-5 text-amber-400" />
            {isRTL ? 'في انتظار التعيين' : 'Awaiting Assignment'}
            <span className="ml-auto bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-xs">
              {awaitingContainers.length}
            </span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-cyan-400" /></div>
            ) : awaitingContainers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                {isRTL ? 'لا توجد حاويات تنتظر التعيين' : 'No containers awaiting assignment'}
              </div>
            ) : (
              awaitingContainers.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedContainer(c)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedContainer?.id === c.id
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-bold text-lg">{c.id}</span>
                    <span className="text-xl">{getTypeIcon(c.type)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Ship className="w-3 h-3 text-blue-400" />
                    <span className="truncate">{c.vesselName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle/Right: Yard Grid Visualizer */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <MapPin className="w-6 h-6 text-cyan-400" />
                {isRTL ? 'خريطة الساحة' : 'Yard Grid Map'}
              </h2>

              {/* Block Selection Tabs */}
              <div className="flex bg-black/30 p-1 rounded-xl">
                {BLOCKS.map(block => (
                  <button
                    key={block}
                    onClick={() => { setSelectedBlock(block); setSelectedCoord(null); }}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${selectedBlock === block
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {isRTL ? `المربع ${block}` : `Block ${block}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold mb-6 flex-wrap">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-800 border border-white/10"></div><span className="text-gray-300">{isRTL ? 'فارغ' : 'Empty'}</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500/50 border border-emerald-400"></div><span className="text-gray-300">{isRTL ? 'مشغول' : 'Occupied'}</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-cyan-500 shadow-[0_0_10px_cyan]"></div><span className="text-gray-300">{isRTL ? 'محدد' : 'Selected'}</span></div>
            </div>

            {/* The Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[600px] flex">
                {/* Y-Axis (Tiers) */}
                <div className="flex flex-col justify-between pr-4 py-6 border-r border-white/10 space-y-2">
                  {TIERS.map(tier => (
                    <div key={`tier-label-${tier}`} className="h-10 flex items-center justify-end text-gray-400 text-sm font-mono w-16">
                      Tier {tier}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="flex-1 pl-4 flex flex-col space-y-2 py-6">
                  {TIERS.map(tier => (
                    <div key={`row-tier-${tier}`} className="flex gap-2">
                      {ROWS.map(row => {
                        const occupiedBy = checkOccupied(selectedBlock, row, tier);
                        const isSelected = selectedCoord?.row === row && selectedCoord?.tier === tier;

                        let cellClass = "w-12 h-10 rounded-md border flex items-center justify-center transition-all cursor-pointer font-bold text-xs ";

                        if (isSelected) {
                          cellClass += "bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110 z-10";
                        } else if (occupiedBy) {
                          cellClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30";
                        } else {
                          cellClass += "bg-black/40 border-white/5 text-transparent hover:border-cyan-500/50 hover:bg-cyan-500/10";
                        }

                        return (
                          <div
                            key={`cell-${row}-${tier}`}
                            className={cellClass}
                            onClick={() => {
                              if (occupiedBy) return; // Can't select occupied
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

                  {/* X-Axis (Rows) */}
                  <div className="flex gap-2 pt-4 border-t border-white/10 mt-4">
                    {ROWS.map(row => (
                      <div key={`row-label-${row}`} className="w-12 text-center text-gray-400 text-sm font-mono">
                        R{row}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-sm block mb-1">{isRTL ? 'الحاوية المحددة' : 'Selected Container'}</span>
                  <div className="text-white font-bold text-xl">{selectedContainer ? selectedContainer.id : '-'}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-sm block mb-1">{isRTL ? 'الموقع المحدد' : 'Selected Location'}</span>
                  <div className="text-cyan-400 font-bold text-xl">
                    {selectedCoord ? `B:${selectedBlock} - R:${selectedCoord.row} - T:${selectedCoord.tier}` : '-'}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-center flex-shrink-0">
                {errorMsg && (
                  <div className="text-red-400 text-sm mb-3 flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded">
                    <AlertTriangle className="w-4 h-4" /> {errorMsg}
                  </div>
                )}
                <button
                  onClick={handleAssign}
                  disabled={!selectedContainer || !selectedCoord || assigning}
                  className="w-full md:w-64 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold text-lg flex justify-center items-center gap-2 shadow-lg transition-all"
                >
                  {assigning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Layers className="w-6 h-6" />}
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
