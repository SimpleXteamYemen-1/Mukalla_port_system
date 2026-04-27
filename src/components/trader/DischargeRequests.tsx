import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { Language } from '../../App';
import { FileText, Package, Calendar, CheckCircle2, XCircle, Clock, RefreshCw, Send } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { traderService } from '../../services/traderService';

interface DischargeRequestsProps {
  language: Language;
  userEmail: string;
  userName: string;
}

interface DischargeRequest {
  id: string;
  requestId: string;
  containerId: string;
  vesselName: string;
  storageLocation: string;
  requestedDate: string;
  notes: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface Container {
  id: string;
  containerId: string;
  vesselName: string;
  assignedStorage: string | null;
  status: string;
}

export function DischargeRequests({ language, userEmail }: DischargeRequestsProps) {
  const isRTL = language === 'ar';
  const [requests, setRequests] = useState<DischargeRequest[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedContainer, setSelectedContainer] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, containersData] = await Promise.all([
        traderService.getDischargeRequests(),
        traderService.getContainers()
      ]);

      const mappedRequests = requestsData.map((r: any) => ({
        id: r.id.toString(),
        requestId: `REQ-${r.id}`,
        containerId: r.container_id.toString(),
        vesselName: r.container?.manifest?.vessel?.name || 'Unknown',
        storageLocation: r.container?.location || 'Unknown',
        requestedDate: r.requested_date,
        notes: r.notes || '',
        status: r.status,
        submittedAt: r.created_at,
        rejectionReason: r.rejection_reason
      }));

      const mappedContainers = containersData.map((c: any) => ({
        id: c.id.toString(),
        containerId: c.id.toString(),
        vesselName: c.manifest?.vessel?.name || 'Unknown',
        assignedStorage: c.location,
        status: c.status
      }));

      setRequests(mappedRequests);
      setContainers(mappedContainers);
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل بيانات طلبات التفريغ' : 'Failed to load discharge requests data');
      console.error('Error loading discharge requests:', error);
    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContainer || !requestedDate) {
      toast.warning(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }


    setSubmitting(true);
    try {
      await traderService.requestDischarge(parseInt(selectedContainer), requestedDate, notes);
      toast.success(isRTL ? 'تم تقديم الطلب بنجاح' : 'Request submitted successfully');
      setShowForm(false);

      setSelectedContainer('');
      setRequestedDate('');
      setNotes('');
      await loadData();
    } catch (error) {
      console.error('Error submitting discharge request:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء تقديم الطلب' : 'Error submitting request');
    } finally {

      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: isRTL ? 'قيد الانتظار' : 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'approved':
        return { label: isRTL ? 'موافق عليه' : 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'rejected':
        return { label: isRTL ? 'مرفوض' : 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      default:
        return { label: status, icon: Clock, className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const eligibleContainers = containers.filter(c => c.status === 'assigned' || c.status === 'ready_discharge');

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isRTL ? 'طلبات التفريغ' : 'Discharge Requests'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL ? 'تقديم ومتابعة طلبات تفريغ الحاويات' : 'Submit and track container discharge requests'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
          >
            {loading ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
            <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">{isRTL ? 'طلب جديد' : 'New Request'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'إجمالي الطلبات' : 'Total Requests'}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{requests.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 shadow-sm">
          <div className="text-amber-700 dark:text-amber-400 text-xs mb-1">{isRTL ? 'قيد الانتظار' : 'Pending'}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {requests.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/30 rounded-lg p-4 shadow-sm">
          <div className="text-green-700 dark:text-green-400 text-xs mb-1">{isRTL ? 'موافق عليها' : 'Approved'}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {requests.filter(r => r.status === 'approved').length}
          </div>
        </div>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {isRTL ? 'تقديم طلب تفريغ جديد' : 'Submit New Discharge Request'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                {isRTL ? 'اختر الحاوية' : 'Select Container'}
              </label>
              <select
                value={selectedContainer}
                onChange={(e) => setSelectedContainer(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 dark:focus:ring-blue-400/20 focus:border-blue-900 dark:focus:border-blue-400 transition-colors"
                required
              >
                <option value="">{isRTL ? 'اختر حاوية...' : 'Choose container...'}</option>
                {eligibleContainers.map(container => (
                  <option key={container.id} value={container.id}>
                    {container.containerId} - {container.vesselName} ({container.assignedStorage})
                  </option>
                ))}
              </select>
              {eligibleContainers.length === 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-sm mt-2">
                  {isRTL ? 'لا توجد حاويات مؤهلة للتفريغ' : 'No eligible containers for discharge'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                {isRTL ? 'تاريخ التفريغ المطلوب' : 'Requested Discharge Date'}
              </label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 dark:focus:ring-blue-400/20 focus:border-blue-900 dark:focus:border-blue-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                {isRTL ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-900/20 dark:focus:ring-blue-400/20 focus:border-blue-900 dark:focus:border-blue-400 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || eligibleContainers.length === 0}
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingIndicator type="line-spinner" size="xs" className="text-white" />
                    <span>{isRTL ? 'جاري التقديم...' : 'Submitting...'}</span>
                  </>
                ) : (isRTL ? 'تقديم الطلب' : 'Submit Request')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
          <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري التحميل...' : 'Loading requests...'} />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
          <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            {isRTL ? 'لا توجد طلبات' : 'No Requests'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {isRTL ? 'لم تقم بتقديم أي طلبات تفريغ بعد' : 'You haven\'t submitted any discharge requests yet'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
          >
            {isRTL ? 'تقديم طلب جديد' : 'Submit New Request'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => {
            const statusBadge = getStatusBadge(request.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{request.requestId}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{isRTL ? 'طلب تفريغ' : 'Discharge Request'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'رقم الحاوية' : 'Container ID'}</div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <div className="text-slate-900 dark:text-slate-50 font-medium text-sm">{request.containerId}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'السفينة' : 'Vessel'}</div>
                    <div className="text-slate-900 dark:text-slate-50 text-sm">{request.vesselName}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'موقع التخزين' : 'Storage Location'}</div>
                    <div className="text-slate-900 dark:text-slate-50 text-sm">{request.storageLocation}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'تاريخ التفريغ المطلوب' : 'Requested Date'}</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div className="text-slate-900 dark:text-slate-50 text-sm">{formatDate(request.requestedDate)}</div>
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/25 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'الملاحظات' : 'Notes'}</div>
                    <div className="text-slate-900 dark:text-slate-50 text-sm">{request.notes}</div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 text-xs">
                    {isRTL ? 'تم التقديم:' : 'Submitted:'} {formatDate(request.submittedAt)}
                  </div>
                  {request.status === 'approved' && request.approvedBy && (
                    <div className="text-green-700 dark:text-green-400 text-xs">
                      {isRTL ? 'موافق من قبل:' : 'Approved by:'} {request.approvedBy}
                    </div>
                  )}
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-700 dark:text-red-400 font-medium text-sm mb-1">
                          {isRTL ? 'سبب الرفض' : 'Rejection Reason'}
                        </div>
                        <div className="text-red-700 dark:text-red-400 text-sm opacity-80">{request.rejectionReason}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
