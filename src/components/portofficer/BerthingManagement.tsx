import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Ship, AlertTriangle, CheckCircle, Calendar, RefreshCw, Clock, Inbox } from 'lucide-react';
import { getVessels, getWharves, assignBerth, Vessel, Wharf, getScheduledAnchorage, ScheduledAnchorage } from '../../utils/portOfficerApi';

interface BerthingManagementProps {
  language: Language;
}

export function BerthingManagement({ language }: BerthingManagementProps) {
  const isRTL = language === 'ar';

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [wharves, setWharves] = useState<Wharf[]>([]);
  const [scheduledAnchorage, setScheduledAnchorage] = useState<ScheduledAnchorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedWharf, setSelectedWharf] = useState<Wharf | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Scheduling inputs
  const [etaInput, setEtaInput] = useState('');
  const [etdInput, setEtdInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vesselsData, wharvesData, anchorageData] = await Promise.all([
        getVessels(),
        getWharves(),
        getScheduledAnchorage(),
      ]);
      setVessels(vesselsData);
      setWharves(wharvesData);
      setScheduledAnchorage(anchorageData);
    } catch (error) {
      console.error('Error loading berthing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format date for datetime-local input
  useEffect(() => {
    if (selectedVessel && selectedVessel.arrival) {
      try {
        const d = new Date(selectedVessel.arrival);
        if (!isNaN(d.getTime())) {
          // slice(0, 16) gets "YYYY-MM-DDThh:mm"
          setEtaInput(d.toISOString().slice(0, 16));
        }
      } catch (e) { }
    } else {
      setEtaInput('');
    }
    setEtdInput('');
  }, [selectedVessel]);

  const handleAssignBerth = () => {
    if (!selectedVessel || !selectedWharf || !etaInput || !etdInput) return;

    if (new Date(etaInput) >= new Date(etdInput)) {
      setConflictMessage(isRTL ? 'يجب أن يكون وقت المغادرة بعد وقت الوصول' : 'Departure time must be after arrival time.');
      setShowConflictWarning(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedVessel || !selectedWharf || assigning) return;

    setAssigning(true);
    try {
      // API expects string formats
      const etaISO = new Date(etaInput).toISOString();
      const etdISO = new Date(etdInput).toISOString();

      await assignBerth(selectedVessel.id, selectedWharf.id, etaISO, etdISO, 'Port Officer');

      await loadData();

      setShowConfirmModal(false);
      setSelectedVessel(null);
      setSelectedWharf(null);
      setEtaInput('');
      setEtdInput('');
    } catch (error: any) {
      console.error('Error assigning berth:', error);
      if (error.response?.data?.message) {
        setConflictMessage(error.response.data.message);
        setShowConfirmModal(false);
        setShowConflictWarning(true);
      } else {
        alert('Failed to assign berth');
      }
    } finally {
      setAssigning(false);
    }
  };

  const awaitingVessels = vessels.filter(v => v.status === 'awaiting');

  // Timeline logic
  const now = new Date();
  const timelineStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  const timelineEnd = new Date(timelineStart.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();

  const getPositionStyle = (arrival?: string, departure?: string) => {
    if (!arrival || !departure) return { display: 'none' };
    const start = new Date(arrival).getTime();
    const end = new Date(departure).getTime();

    // Clamp to timeline
    const renderStart = Math.max(start, timelineStart.getTime());
    const renderEnd = Math.min(end, timelineEnd.getTime());

    if (renderEnd <= renderStart || end < timelineStart.getTime() || start > timelineEnd.getTime()) {
      return { display: 'none' };
    }

    const leftPct = ((renderStart - timelineStart.getTime()) / totalDuration) * 100;
    const widthPct = ((renderEnd - renderStart) / totalDuration) * 100;

    return isRTL ? { right: `${leftPct}%`, width: `${widthPct}%` } : { left: `${leftPct}%`, width: `${widthPct}%` };
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'جدولة السفن والأرصفة' : 'Ship & Berth Scheduling'}
            </h1>
            <p className="text-blue-200">
              {isRTL ? 'إدارة المخطط الزمني للسفن وتعيين الأرصفة' : 'Manage Vessel Timeline & Assign Berths'}
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

      {/* ─── Scheduled Anchorage Handoffs (from Wharf Worker) ─────────────────── */}
      <div className="mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isRTL ? 'إسناد طلبات الرسو المقررة' : 'Scheduled Anchorage Handoffs'}
              </h2>
              <p className="text-blue-300 text-xs">
                {isRTL ? 'طلبات تم تعيين رصيف لها بواسطة مشرف الرصيف' : 'Approved by Wharf Officer — ready for entry'}
              </p>
            </div>
            {scheduledAnchorage.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full border border-cyan-500/30">
                {scheduledAnchorage.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center"><RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" /></div>
          ) : scheduledAnchorage.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{isRTL ? 'لا توجد إسنادات مجدولة حالياً' : 'No scheduled handoffs at the moment'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {scheduledAnchorage.map((item) => (
                <div key={item.id} className="px-6 py-5 flex items-start justify-between gap-6 group hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg mb-1">{item.vessel?.name}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-300">
                        <span className="font-mono">IMO: {item.vessel?.imo_number}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Anchor className="w-3 h-3" />{item.wharf?.name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.docking_time).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                        <span>·</span>
                        <span>{item.duration}h</span>
                      </div>
                      {item.reason && (
                        <p className="text-gray-400 text-xs mt-1 max-w-md line-clamp-1">{item.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {isRTL ? 'جاهز للدخول' : 'Ready for Entry'}
                    </span>
                    <p className="text-gray-500 text-[10px] mt-1">
                      {isRTL ? 'أُسند بواسطة:' : 'Assigned:'} {new Date(item.wharf_assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessels Awaiting Berth Component */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl h-full">
            <div className="flex items-center gap-3 mb-6">
              <Ship className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'سفن تنتظر الجدولة' : 'Vessels Awaiting Schedule'}
              </h2>
            </div>

            {awaitingVessels.length > 0 ? (
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {awaitingVessels.map((vessel) => (
                  <div
                    key={vessel.id}
                    onClick={() => setSelectedVessel(vessel)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedVessel?.id === vessel.id
                        ? 'bg-cyan-500/20 border-cyan-400 transform scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">{vessel.name}</h3>
                      {selectedVessel?.id === vessel.id && (
                        <CheckCircle className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300 mb-1">
                      <Ship className="w-4 h-4" />
                      <span>{vessel.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(vessel.arrival).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ship className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">{isRTL ? 'لا توجد سفن تنتظر' : 'No vessels awaiting schedule'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Assignment Component */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Timeline UI */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'المخطط الزمني للأرصفة (48 ساعة)' : 'Berth Timeline (48 Hours)'}
              </h2>
            </div>

            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[700px]">
                {/* Timeline Header */}
                <div className="flex pt-2 pb-4 mb-4 border-b border-white/20 text-gray-400 text-sm">
                  <div className="w-32 flex-shrink-0 font-semibold">{isRTL ? 'الرصيف' : 'Wharf'}</div>
                  <div className="flex-1 relative">
                    <div className="absolute left-0 -top-6 transform -translate-x-1/2 text-xs">00:00 (Today)</div>
                    <div className="absolute left-1/2 -top-6 transform -translate-x-1/2 text-xs">00:00 (Tomorrow)</div>
                    <div className="absolute right-0 -top-6 transform translate-x-1/2 text-xs">00:00 (Day 3)</div>

                    {/* Tick marks */}
                    <div className="w-full flex justify-between h-2 border-l border-r border-white/20 relative">
                      <div className="absolute left-1/4 h-2 border-l border-white/10"></div>
                      <div className="absolute left-1/2 h-4 border-l border-white/30 -top-2"></div>
                      <div className="absolute left-3/4 h-2 border-l border-white/10"></div>
                    </div>
                  </div>
                </div>

                {/* Wharf Rows */}
                <div className="space-y-4">
                  {wharves.map((wharf) => {
                    const scheduledVessels = vessels.filter(v => v.currentWharf === wharf.name && ['scheduled', 'docked', 'loading', 'unloading'].includes(v.status));
                    const isSelected = selectedWharf?.id === wharf.id;

                    return (
                      <div
                        key={wharf.id}
                        className={`flex items-center group cursor-pointer p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/10 ring-1 ring-cyan-400' : 'hover:bg-white/5'}`}
                        onClick={() => setSelectedWharf(wharf)}
                      >
                        <div className="w-32 flex-shrink-0 pr-4">
                          <h4 className={`font-bold truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{wharf.name}</h4>
                          <span className="text-xs text-gray-400">{wharf.capacity} DWT</span>
                        </div>

                        <div className="flex-1 h-12 bg-gray-900/50 rounded-lg relative overflow-hidden border border-white/5">
                          {scheduledVessels.map(v => {
                            const style = getPositionStyle(v.arrival, v.departure);
                            let bgClass = "bg-blue-500/80 hover:bg-blue-400 ring-1 ring-blue-300 shadow-lg backdrop-blur-md";
                            if (v.status === 'docked' || v.status === 'loading' || v.status === 'unloading') bgClass = "bg-emerald-500/80 hover:bg-emerald-400 ring-1 ring-emerald-300 shadow-lg backdrop-blur-md";

                            return (
                              <div
                                key={v.id}
                                className={`absolute h-8 top-2 rounded-md ${bgClass} transition-all flex items-center px-2 cursor-help overflow-hidden`}
                                style={style}
                                title={`${v.name} (${new Date(v.arrival).toLocaleString()} - ${new Date(v.departure!).toLocaleString()})`}
                              >
                                <span className="text-white text-xs font-semibold truncate select-none">{v.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {isRTL ? 'جدولة رصيف' : 'Schedule Berth'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Vessel & Wharf Selection Summaries */}
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 transition-colors hover:bg-white/10">
                  <p className="text-sm text-cyan-300 mb-1 font-semibold tracking-wide uppercase">{isRTL ? 'السفينة المحددة' : 'Selected Vessel'}</p>
                  {selectedVessel ? (
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-lg">{selectedVessel.name}</p>
                      <Ship className="w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mt-1">{isRTL ? 'اضغط على سفينة في القائمة' : 'Click a vessel from the list'}</p>
                  )}
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 transition-colors hover:bg-white/10">
                  <p className="text-sm text-cyan-300 mb-1 font-semibold tracking-wide uppercase">{isRTL ? 'الرصيف المحدد' : 'Selected Wharf'}</p>
                  {selectedWharf ? (
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-lg">{selectedWharf.name}</p>
                      <Anchor className="w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mt-1">{isRTL ? 'اضغط على رصيف في المخطط الزمني' : 'Click a wharf from the timeline'}</p>
                  )}
                </div>
              </div>

              {/* Date/Time Pickers */}
              <div className="space-y-4 flex flex-col justify-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">{isRTL ? 'وقت الوصول المتوقع (ETA)' : 'Estimated Arrival (ETA)'}</label>
                  <input
                    type="datetime-local"
                    value={etaInput}
                    onChange={(e) => setEtaInput(e.target.value)}
                    className="w-full bg-[#0A1628]/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">{isRTL ? 'وقت المغادرة المتوقع (ETD)' : 'Estimated Departure (ETD)'}</label>
                  <input
                    type="datetime-local"
                    value={etdInput}
                    onChange={(e) => setEtdInput(e.target.value)}
                    className="w-full bg-[#0A1628]/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAssignBerth}
              disabled={!selectedVessel || !selectedWharf || !etaInput || !etdInput || assigning}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
            >
              {assigning ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  {isRTL ? 'جاري الجدولة...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <Calendar className="w-6 h-6" />
                  {isRTL ? 'تأكيد الجدولة' : 'Confirm Schedule'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {showConflictWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-red-900/90 to-[#0A1628] backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'تحذير جدول رصيف' : 'Scheduling Conflict'}
              </h3>
            </div>

            <p className="text-red-100 mb-8 text-lg leading-relaxed">
              {conflictMessage}
            </p>

            <button
              onClick={() => setShowConflictWarning(false)}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 py-3 rounded-xl font-bold transition-colors shadow-lg"
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#153B5E] to-[#0A1628] backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <CheckCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRTL ? 'تأكيد الجدولة' : 'Confirm Schedule'}
              </h3>
            </div>

            <div className="bg-black/20 rounded-xl p-5 mb-6 space-y-4 border border-white/5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRTL ? 'السفينة' : 'Vessel'}</span>
                <span className="text-white font-bold">{selectedVessel?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRTL ? 'الرصيف' : 'Wharf'}</span>
                <span className="text-cyan-400 font-bold">{selectedWharf?.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRTL ? 'وصول' : 'Arrival'}</span>
                <span className="text-white font-mono text-sm">{new Date(etaInput).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isRTL ? 'مغادرة' : 'Departure'}</span>
                <span className="text-white font-mono text-sm">{new Date(etdInput).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={assigning}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmAssignment}
                disabled={assigning}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 border border-transparent text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(8,145,178,0.5)]"
              >
                {assigning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {isRTL ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
