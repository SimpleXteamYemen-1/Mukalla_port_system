import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Clock, Ship, CheckCircle, RefreshCw, AlertTriangle, Inbox, ChevronDown } from 'lucide-react';
import { wharfService } from '../../services/wharfService';
import { toast } from 'react-toastify';

interface WharfAvailabilityProps {
  language: Language;
}

interface Wharf {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  vessels?: { name: string }[];
}

interface AnchorageRequest {
  id: number;
  vessel: { id: number; name: string; type: string; imo_number: string };
  docking_time: string;
  duration: string;
  reason: string;
  status: string;
  wharf?: { id: number; name: string };
  agent?: { name: string };
}

export function WharfAvailability({ language }: WharfAvailabilityProps) {
  const isRTL = language === 'ar';

  const [wharves, setWharves] = useState<Wharf[]>([]);
  const [anchorageRequests, setAnchorageRequests] = useState<AnchorageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  // Per-request selected wharf for Option A
  const [selectedWharfMap, setSelectedWharfMap] = useState<Record<number, number>>({});
  // Expandable request details
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [expandedWaitingId, setExpandedWaitingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wharvesData, anchorageData] = await Promise.all([
        wharfService.getWharves(),
        wharfService.getAnchorageRequests(),
      ]);
      setWharves(wharvesData);
      setAnchorageRequests(anchorageData.requests || []);
    } catch (error) {
      console.error('Error loading wharf data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleMaintenance = async (wharf: Wharf) => {
    setProcessing(wharf.id);
    try {
      const newStatus = wharf.status === 'maintenance' ? 'available' : 'maintenance';
      await wharfService.updateWharfStatus(wharf.id.toString(), newStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating status', error);
      toast.error(isRTL ? 'فشل تحديث الحالة' : 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const toggleOccupied = async (wharf: Wharf) => {
    if (wharf.status === 'occupied') {
      setProcessing(wharf.id);
      try {
        await wharfService.updateWharfStatus(wharf.id.toString(), 'available');
        toast.success(isRTL ? 'تم تحرير الرصيف' : 'Wharf released to available');
        await loadData();
      } catch (error) {
        toast.error(isRTL ? 'فشل تحديث الحالة' : 'Failed to update status');
      } finally {
        setProcessing(null);
      }
    }
  };

  // Option A: Approve & Assign
  const handleApprove = async (request: AnchorageRequest) => {
    const wharfId = selectedWharfMap[request.id];
    if (!wharfId) {
      toast.error(isRTL ? 'يرجى اختيار رصيف أولاً' : 'Please select a wharf first');
      return;
    }
    setProcessing(request.id);
    try {
      await wharfService.approveAnchorageRequest(request.id, wharfId);
      toast.success(isRTL ? 'تم تعيين الرصيف بنجاح!' : 'Wharf assigned successfully!');
      setSelectedWharfMap((prev) => { const next = { ...prev }; delete next[request.id]; return next; });
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isRTL ? 'فشل تعيين الرصيف' : 'Failed to assign wharf'));
    } finally {
      setProcessing(null);
    }
  };

  // Option B: Waitlist
  const handleWaitlist = async (request: AnchorageRequest) => {
    setProcessing(request.id);
    try {
      await wharfService.waitlistAnchorageRequest(request.id);
      toast.success(isRTL ? 'تم إضافة الطلب إلى قائمة الانتظار' : 'Request placed on waitlist. Agent has been notified.');
      await loadData();
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const availableWharves = wharves.filter((w) => w.status === 'available');
  const pendingRequests = anchorageRequests.filter((r) => r.status === 'pending');
  const processedRequests = anchorageRequests.filter((r) => r.status !== 'pending');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {isRTL ? 'توفر الأرصفة' : 'Wharf Availability'}
          </h1>
          <p className="text-blue-200 text-sm">
            {isRTL ? 'إدارة توفر الأرصفة وطلبات الرسو' : 'Manage wharf availability and anchorage requests'}
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

      {/* ─── SECTION 1: Pending Anchorage Requests Queue ───────────────────────── */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isRTL ? 'طلبات الرسو المعلقة' : 'Pending Anchorage Requests'}
              </h2>
              <p className="text-blue-300 text-xs">
                {isRTL ? 'انقر على طلب لمراجعة التفاصيل وتعيين الرصيف' : 'Review and assign a wharf or place on waitlist'}
              </p>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30">
              {pendingRequests.length} {isRTL ? 'طلب' : 'pending'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400/40 mx-auto mb-3" />
            <p className="text-gray-400">{isRTL ? 'لا توجد طلبات معلقة' : 'No pending requests — all clear!'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-6">
                {/* Request Header Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{request.vessel?.name}</div>
                      <div className="flex items-center gap-3 text-xs text-blue-300 font-medium mt-0.5">
                        <span className="font-mono">#{request.id}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(request.docking_time).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                        <span>·</span>
                        <span>{request.duration}h</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-blue-300 transition-transform duration-200 ${expandedRequest === request.id ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded Detail + Actions */}
                {expandedRequest === request.id && (
                  <div className="mt-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Reason */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">
                        {isRTL ? 'السبب / الغرض' : 'Reason / Purpose'}
                      </p>
                      <p className="text-white text-sm">{request.reason}</p>
                    </div>

                    {/* Availability Info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${availableWharves.length === 0 ? 'text-red-400' : 'text-green-400'}`} />
                      <p className="text-sm text-gray-300">
                        {availableWharves.length === 0
                          ? (isRTL ? 'لا تتوفر أرصفة حالياً.' : 'No wharves currently available.')
                          : `${availableWharves.length} ${isRTL ? 'رصيف متاح' : 'wharf(s) available'}: ${availableWharves.map(w => w.name).join(', ')}`}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Option A */}
                      <div className="flex gap-2 flex-1">
                        <select
                          value={selectedWharfMap[request.id] || ''}
                          onChange={(e) => setSelectedWharfMap((prev) => ({ ...prev, [request.id]: Number(e.target.value) }))}
                          disabled={availableWharves.length === 0}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40 [&>option]:bg-[#1A3A5C]"
                        >
                          <option value="">{isRTL ? '-- اختر رصيفاً --' : '-- Select Wharf --'}</option>
                          {availableWharves.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={!selectedWharfMap[request.id] || processing === request.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/30"
                        >
                          {processing === request.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          {isRTL ? 'تعيين رصيف' : 'Approve & Assign'}
                        </button>
                      </div>

                      {/* Option B */}
                      <button
                        onClick={() => handleWaitlist(request)}
                        disabled={processing === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600/80 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
                      >
                        <Clock className="w-4 h-4" />
                        {isRTL ? 'وضع في قائمة الانتظار' : 'Hold / Waitlist'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Processed Requests (compact) ──────────────────────────── */}
      {processedRequests.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white">{isRTL ? 'الطلبات المعالجة' : 'Processed Requests'}</h2>
          </div>
          <div className="divide-y divide-white/5">
            {processedRequests.map((req) => (
              <div key={req.id} className="group">
                <div className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl border ${
                      req.status === 'wharf_assigned' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                      'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    }`}>
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{req.vessel?.name}</p>
                      <p className="text-blue-300/60 text-xs mt-0.5">
                        {new Date(req.docking_time).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} · {req.duration}h
                        {req.wharf && ` · ${req.wharf.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      req.status === 'wharf_assigned' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                      req.status === 'waiting' ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' :
                      'bg-gray-500/10 text-gray-300 border-gray-500/30'
                    }`}>
                      {req.status === 'wharf_assigned' ? (isRTL ? 'رصيف معين' : 'Wharf Assigned') :
                       req.status === 'waiting' ? (isRTL ? 'قائمة انتظار' : 'Waitlisted') : req.status}
                    </span>
                    {req.status === 'waiting' && (
                      <button
                        onClick={() => setExpandedWaitingId(expandedWaitingId === req.id ? null : req.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-blue-300 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedWaitingId === req.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Rescheduling for Waitlisted */}
                {req.status === 'waiting' && expandedWaitingId === req.id && (
                  <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isRTL ? 'إعادة جدولة من قائمة الانتظار' : 'Reschedule from Waitlist'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={selectedWharfMap[req.id] || ''}
                          onChange={(e) => setSelectedWharfMap((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))}
                          disabled={availableWharves.length === 0}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40 [&>option]:bg-[#1A3A5C]"
                        >
                          <option value="">{isRTL ? '-- اختر رصيفاً --' : '-- Select Wharf --'}</option>
                          {availableWharves.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={!selectedWharfMap[req.id] || processing === req.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/30"
                        >
                          {processing === req.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          {isRTL ? 'تعيين رصيف' : 'Approve & Assign'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: Wharf Status Cards ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">{isRTL ? 'حالة الأرصفة' : 'Wharf Status'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            </div>
          ) : wharves.map((wharf) => (
            <div key={wharf.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{wharf.name}</h3>
                </div>
                <Anchor className={`w-8 h-8 ${
                  wharf.status === 'available' ? 'text-green-400' :
                  wharf.status === 'maintenance' ? 'text-amber-400' : 'text-red-400'
                }`} />
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">{isRTL ? 'الحالة' : 'Status'}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                  wharf.status === 'available' ? 'bg-green-500/20 text-green-300' :
                  wharf.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {wharf.status === 'available' ? (isRTL ? 'متاح' : 'Available') :
                   wharf.status === 'maintenance' ? (isRTL ? 'صيانة' : 'Maintenance') :
                   (isRTL ? 'مشغول' : 'Occupied')}
                </span>
              </div>

              <div className="flex gap-2">
                {/* Toggle Maintenance */}
                <button
                  onClick={() => toggleMaintenance(wharf)}
                  disabled={processing === wharf.id || wharf.status === 'occupied'}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                    wharf.status === 'maintenance'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing === wharf.id ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> :
                    wharf.status === 'maintenance' ? (isRTL ? 'إتاحة' : 'Set Available') : (isRTL ? 'صيانة' : 'Maintenance')}
                </button>

                {/* Release Occupied */}
                {wharf.status === 'occupied' && (
                  <button
                    onClick={() => toggleOccupied(wharf)}
                    disabled={processing === wharf.id}
                    className="flex-1 py-2 rounded-xl font-semibold text-sm bg-slate-600 hover:bg-slate-500 text-white transition-all disabled:opacity-50"
                  >
                    {processing === wharf.id ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> :
                      (isRTL ? 'تحرير الرصيف' : 'Release Wharf')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
