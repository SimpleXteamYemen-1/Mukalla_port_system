import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { FileText, Package, Calendar, CheckCircle2, XCircle, Clock, RefreshCw, Send } from 'lucide-react';
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

export function DischargeRequests({ language, userEmail, userName }: DischargeRequestsProps) {
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

      // Map requests data. Backend returns DischargeRequest models with relationships
      // Request: { id, status, container: { manifest: { vessel: { name } } } }
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

      // Map containers using same logic as other components or simple passing
      // We need containers eligible for discharge (status not pending discharge? or just all?)
      // Backend likely filters eligible ones or we filter here.
      const mappedContainers = containersData.map((c: any) => ({
        id: c.id.toString(),
        containerId: c.id.toString(), // or separate field if exists
        vesselName: c.manifest?.vessel?.name || 'Unknown',
        assignedStorage: c.location,
        status: c.status
      }));

      setRequests(mappedRequests);
      setContainers(mappedContainers);
    } catch (error) {
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
      alert(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await traderService.requestDischarge(parseInt(selectedContainer), requestedDate, notes);
      alert(isRTL ? 'تم تقديم الطلب بنجاح' : 'Request submitted successfully');
      setShowForm(false);
      setSelectedContainer('');
      setRequestedDate('');
      setNotes('');
      await loadData();
    } catch (error) {
      console.error('Error submitting discharge request:', error);
      alert(isRTL ? 'حدث خطأ أثناء تقديم الطلب' : 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: isRTL ? 'قيد الانتظار' : 'Pending',
          icon: Clock,
          bg: 'bg-amber-500/20',
          border: 'border-amber-400/30',
          text: 'text-amber-300'
        };
      case 'approved':
        return {
          label: isRTL ? 'موافق عليه' : 'Approved',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-400/30',
          text: 'text-emerald-300'
        };
      case 'rejected':
        return {
          label: isRTL ? 'مرفوض' : 'Rejected',
          icon: XCircle,
          bg: 'bg-red-500/20',
          border: 'border-red-400/30',
          text: 'text-red-300'
        };
      default:
        return {
          label: status,
          icon: Clock,
          bg: 'bg-gray-500/20',
          border: 'border-gray-400/30',
          text: 'text-gray-300'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const eligibleContainers = containers.filter(c =>
    c.status === 'assigned' || c.status === 'ready_discharge'
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'طلبات التفريغ' : 'Discharge Requests'}
            </h1>
            <p className="text-emerald-200/70">
              {isRTL ? 'تقديم ومتابعة طلبات تفريغ الحاويات' : 'Submit and track container discharge requests'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 transition-all"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">{isRTL ? 'طلب جديد' : 'New Request'}</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'إجمالي الطلبات' : 'Total Requests'}</div>
            <div className="text-2xl font-bold text-white">{requests.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-amber-400/20 rounded-xl p-4">
            <div className="text-amber-200/60 text-sm mb-1">{isRTL ? 'قيد الانتظار' : 'Pending'}</div>
            <div className="text-2xl font-bold text-white">
              {requests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-emerald-400/20 rounded-xl p-4">
            <div className="text-emerald-200/60 text-sm mb-1">{isRTL ? 'موافق عليها' : 'Approved'}</div>
            <div className="text-2xl font-bold text-white">
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </div>
        </div>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {isRTL ? 'تقديم طلب تفريغ جديد' : 'Submit New Discharge Request'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">
                {isRTL ? 'اختر الحاوية' : 'Select Container'}
              </label>
              <select
                value={selectedContainer}
                onChange={(e) => setSelectedContainer(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400/50"
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
                <p className="text-amber-300 text-sm mt-2">
                  {isRTL ? 'لا توجد حاويات مؤهلة للتفريغ' : 'No eligible containers for discharge'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">
                {isRTL ? 'تاريخ التفريغ المطلوب' : 'Requested Discharge Date'}
              </label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400/50"
                required
              />
            </div>

            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">
                {isRTL ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300/30 focus:outline-none focus:border-emerald-400/50 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || eligibleContainers.length === 0}
                className="flex-1 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 font-medium transition-all disabled:opacity-50"
              >
                {submitting ? (isRTL ? 'جاري التقديم...' : 'Submitting...') : (isRTL ? 'تقديم الطلب' : 'Submit Request')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">{isRTL ? 'جاري التحميل...' : 'Loading requests...'}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {isRTL ? 'لا توجد طلبات' : 'No Requests'}
          </h3>
          <p className="text-blue-200/60 mb-4">
            {isRTL ? 'لم تقم بتقديم أي طلبات تفريغ بعد' : 'You haven\'t submitted any discharge requests yet'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 transition-all"
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
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-400/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <FileText className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{request.requestId}</h3>
                      <p className="text-blue-200/60 text-sm">{isRTL ? 'طلب تفريغ' : 'Discharge Request'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusBadge.bg} border ${statusBadge.border} ${statusBadge.text} font-medium`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'رقم الحاوية' : 'Container ID'}</div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-300" />
                      <div className="text-white font-medium">{request.containerId}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'السفينة' : 'Vessel'}</div>
                    <div className="text-white">{request.vesselName}</div>
                  </div>
                  <div>
                    <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'موقع التخزين' : 'Storage Location'}</div>
                    <div className="text-white">{request.storageLocation}</div>
                  </div>
                  <div>
                    <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'تاريخ التفريغ المطلوب' : 'Requested Date'}</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-300" />
                      <div className="text-white">{formatDate(request.requestedDate)}</div>
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'الملاحظات' : 'Notes'}</div>
                    <div className="text-blue-200">{request.notes}</div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-blue-200/60 text-sm">
                    {isRTL ? 'تم التقديم:' : 'Submitted:'} {formatDate(request.submittedAt)}
                  </div>
                  {request.status === 'approved' && request.approvedBy && (
                    <div className="text-emerald-300 text-sm">
                      {isRTL ? 'موافق من قبل:' : 'Approved by:'} {request.approvedBy}
                    </div>
                  )}
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-300 font-medium mb-1">
                          {isRTL ? 'سبب الرفض' : 'Rejection Reason'}
                        </div>
                        <div className="text-red-200/80 text-sm">{request.rejectionReason}</div>
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
