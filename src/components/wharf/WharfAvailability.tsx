import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Clock, Ship, CheckCircle, RefreshCw, AlertTriangle, Inbox, ChevronDown } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
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
  const [selectedWharfMap, setSelectedWharfMap] = useState<Record<number, number>>({});
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

  const getWharfStatusBadge = (status: string) => {
    if (status === 'available') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'maintenance') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const getWharfStatusLabel = (status: string) => {
    if (status === 'available') return isRTL ? 'متاح' : 'Available';
    if (status === 'maintenance') return isRTL ? 'صيانة' : 'Maintenance';
    return isRTL ? 'مشغول' : 'Occupied';
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isRTL ? 'توفر الأرصفة' : 'Wharf Availability'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL ? 'إدارة توفر الأرصفة وطلبات الرسو' : 'Manage wharf availability and anchorage requests'}
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

      {/* SECTION 1: Pending Anchorage Requests */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Inbox className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {isRTL ? 'طلبات الرسو المعلقة' : 'Pending Anchorage Requests'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {isRTL ? 'انقر على طلب لمراجعة التفاصيل وتعيين الرصيف' : 'Review and assign a wharf or place on waitlist'}
              </p>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {pendingRequests.length} {isRTL ? 'طلب' : 'pending'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري التحميل...' : 'Loading...'} />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400">{isRTL ? 'لا توجد طلبات معلقة' : 'No pending requests — all clear!'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-5">
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/25 -m-1 p-1 rounded-lg transition-colors"
                  onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <Ship className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="text-slate-900 dark:text-slate-50 font-semibold">{request.vessel?.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono">#{request.id}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(request.docking_time).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                        <span>·</span>
                        <span>{request.duration}h</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedRequest === request.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedRequest === request.id && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        {isRTL ? 'السبب / الغرض' : 'Reason / Purpose'}
                      </p>
                      <p className="text-slate-900 dark:text-slate-50 text-sm">{request.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${availableWharves.length === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {availableWharves.length === 0
                          ? (isRTL ? 'لا تتوفر أرصفة حالياً.' : 'No wharves currently available.')
                          : `${availableWharves.length} ${isRTL ? 'رصيف متاح' : 'wharf(s) available'}: ${availableWharves.map(w => w.name).join(', ')}`}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex gap-2 flex-1">
                        <select
                          value={selectedWharfMap[request.id] || ''}
                          onChange={(e) => setSelectedWharfMap((prev) => ({ ...prev, [request.id]: Number(e.target.value) }))}
                          disabled={availableWharves.length === 0}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 disabled:opacity-40 transition-colors"
                        >
                          <option value="">{isRTL ? '-- اختر رصيفاً --' : '-- Select Wharf --'}</option>
                          {availableWharves.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={!selectedWharfMap[request.id] || processing === request.id}
                          className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center"
                        >
                          {processing === request.id ? <LoadingIndicator type="line-spinner" size="xs" className="text-white" /> : <CheckCircle className="w-4 h-4" />}
                          {isRTL ? 'تعيين رصيف' : 'Approve & Assign'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleWaitlist(request)}
                        disabled={processing === request.id}
                        className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
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

      {/* SECTION 2: Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{isRTL ? 'الطلبات المعالجة' : 'Processed Requests'}</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {processedRequests.map((req) => (
              <div key={req.id}>
                <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg border ${
                      req.status === 'wharf_assigned' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-900/30' :
                      'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-900/30'
                    }`}>
                      <Ship className={`w-4 h-4 ${req.status === 'wharf_assigned' ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`} />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-slate-50 font-medium text-sm">{req.vessel?.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        {new Date(req.docking_time).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} · {req.duration}h
                        {req.wharf && ` · ${req.wharf.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      req.status === 'wharf_assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      req.status === 'waiting' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {req.status === 'wharf_assigned' ? (isRTL ? 'رصيف معين' : 'Wharf Assigned') :
                       req.status === 'waiting' ? (isRTL ? 'قائمة انتظار' : 'Waitlisted') : req.status}
                    </span>
                    {req.status === 'waiting' && (
                      <button
                        onClick={() => setExpandedWaitingId(expandedWaitingId === req.id ? null : req.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedWaitingId === req.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {req.status === 'waiting' && expandedWaitingId === req.id && (
                  <div className="px-6 pb-5 pt-1">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {isRTL ? 'إعادة جدولة من قائمة الانتظار' : 'Reschedule from Waitlist'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={selectedWharfMap[req.id] || ''}
                          onChange={(e) => setSelectedWharfMap((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))}
                          disabled={availableWharves.length === 0}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 disabled:opacity-40 transition-colors"
                        >
                          <option value="">{isRTL ? '-- اختر رصيفاً --' : '-- Select Wharf --'}</option>
                          {availableWharves.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={!selectedWharfMap[req.id] || processing === req.id}
                          className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center"
                        >
                          {processing === req.id ? <LoadingIndicator type="line-spinner" size="xs" className="text-white" /> : <CheckCircle className="w-4 h-4" />}
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

      {/* SECTION 3: Wharf Status Cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">{isRTL ? 'حالة الأرصفة' : 'Wharf Status'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <LoadingIndicator type="line-spinner" size="lg" />
            </div>
          ) : wharves.map((wharf) => (
            <div key={wharf.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{wharf.name}</h3>
                <Anchor className={`w-6 h-6 ${
                  wharf.status === 'available' ? 'text-green-600 dark:text-green-400' :
                  wharf.status === 'maintenance' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div className="mb-4">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'الحالة' : 'Status'}</p>
                <div className="flex flex-col gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit ${getWharfStatusBadge(wharf.status)}`}>
                    {getWharfStatusLabel(wharf.status)}
                  </span>
                  {wharf.status === 'occupied' && wharf.vessels && wharf.vessels.length > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2 border border-blue-100 dark:border-blue-900/30">
                      <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 truncate">
                        {wharf.vessels[0].name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleMaintenance(wharf)}
                  disabled={processing === wharf.id || wharf.status === 'occupied'}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                    wharf.status === 'maintenance'
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                      : 'bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white'
                  }`}
                >
                  {processing === wharf.id ? <LoadingIndicator type="line-spinner" size="xs" className="text-white" /> :
                    wharf.status === 'maintenance' ? (isRTL ? 'إتاحة' : 'Set Available') : (isRTL ? 'صيانة' : 'Maintenance')}
                </button>
                {wharf.status === 'occupied' && (
                  <button
                    onClick={() => toggleOccupied(wharf)}
                    disabled={processing === wharf.id}
                    className="flex-1 py-2 rounded-lg font-medium text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing === wharf.id ? <LoadingIndicator type="line-spinner" size="xs" /> : (isRTL ? 'تحرير الرصيف' : 'Release Wharf')}
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
