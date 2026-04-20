import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { Language } from '../../App';
import { FileCheck, Ship, Clock, CheckCircle, AlertCircle, QrCode, X, RefreshCw } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { getClearances, issueClearance, approveClearance, rejectClearance, getVessels, Clearance } from '../../utils/portOfficerApi';

interface PortClearancesProps {
  language: Language;
}

export function PortClearances({ language }: PortClearancesProps) {
  const isRTL = language === 'ar';

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [nextPort, setNextPort] = useState('');
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [availableVessels, setAvailableVessels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clearancesData, vesselsData] = await Promise.all([getClearances(), getVessels()]);
      setClearances(clearancesData);
      const dockedVessels = vesselsData.filter(v => v.status !== 'awaiting').map(v => v.name);
      setAvailableVessels(dockedVessels);
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل بيانات التصاريح' : 'Failed to load clearances data');
      console.error('Error loading clearances:', error);
    } finally {

      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleIssueClearance = async () => {
    if (!selectedVessel || !nextPort || issuing) return;
    setIssuing(true);
    try {
      await issueClearance(selectedVessel, nextPort, 'Port Officer');
      toast.success(isRTL ? 'تم إصدار التصريح بنجاح!' : 'Clearance issued successfully!');
      await loadData();
      setShowIssueForm(false);
      setSelectedVessel('');
      setNextPort('');
    } catch (error: any) {
      console.error('Error issuing clearance:', error);
      toast.error(error.message || (isRTL ? 'فشل إصدار التصريح' : 'Failed to issue clearance'));
    } finally {

      setIssuing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid': 
      case 'clearance_approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending_clearance': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expiring-soon': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'expired': 
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'valid': 
      case 'clearance_approved': return 'border-l-4 border-l-green-500 dark:border-l-green-400';
      case 'pending_clearance': return 'border-l-4 border-l-blue-500 dark:border-l-blue-400';
      case 'expiring-soon': return 'border-l-4 border-l-amber-500 dark:border-l-amber-400';
      case 'expired': 
      case 'rejected': return 'border-l-4 border-l-red-500 dark:border-l-red-400';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': 
      case 'clearance_approved': return <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400" />;
      case 'pending_clearance': return <Clock className="w-5 h-5 text-blue-700 dark:text-blue-400" />;
      case 'expiring-soon': return <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400" />;
      case 'expired': 
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveClearance(id);
      toast.success(isRTL ? 'تم الموافقة على التصريح' : 'Clearance approved');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'خطأ أثناء الموافقة' : 'Error during approval');
    }
  };


  const handleReject = async (id: string) => {
    const reason = prompt(isRTL ? 'أدخل سبب الرفض' : 'Enter rejection reason:');
    if (!reason) return;
    try {
      await rejectClearance(id, reason);
      toast.success(isRTL ? 'تم رفض التصريح' : 'Clearance rejected');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'خطأ أثناء الرفض' : 'Error during rejection');
    }
  };


  const getHoursColor = (hours: number) =>
    hours < 0 ? 'text-red-700 dark:text-red-400' : hours < 6 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400';

  const viewQRCode = (clearance: Clearance) => { setSelectedClearance(clearance); setShowQRModal(true); };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full flex items-center justify-center">
        <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{isRTL ? 'تصاريح مغادرة الميناء' : 'Port Clearances'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{isRTL ? 'إصدار وإدارة تصاريح مغادرة السفن' : 'Issue and Manage Vessel Departure Clearances'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} disabled={loading} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center">
            {loading ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={() => setShowIssueForm(true)} className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
            <FileCheck className="w-4 h-4" />{isRTL ? 'إصدار تصريح جديد' : 'Issue New Clearance'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { count: clearances.filter(c => c.status === 'valid').length, label: isRTL ? 'تصاريح سارية' : 'Valid Clearances', icon: CheckCircle, color: 'green' },
          { count: clearances.filter(c => c.status === 'expiring-soon').length, label: isRTL ? 'تنتهي قريباً' : 'Expiring Soon', icon: Clock, color: 'amber' },
          { count: clearances.filter(c => c.status === 'expired').length, label: isRTL ? 'منتهية الصلاحية' : 'Expired', icon: AlertCircle, color: 'red' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold ${item.color === 'green' ? 'text-green-700 dark:text-green-400' : item.color === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'} mb-1`}>{item.count}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              </div>
              <Icon className={`w-8 h-8 ${item.color === 'green' ? 'text-green-600 dark:text-green-400' : item.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'} opacity-60`} />
            </div>
          );
        })}
      </div>

      {/* Clearances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clearances.map((clearance) => (
          <div key={clearance.id} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${getCardBorderColor(clearance.status)} rounded-lg p-5 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(clearance.status)}
                <div>
                  <h3 className="text-slate-900 dark:text-slate-50 font-semibold">{clearance.clearanceId}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isRTL ? 'رقم التصريح' : 'Clearance ID'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(clearance.status)}`}>
                  {clearance.status === 'valid' ? (isRTL ? 'ساري' : 'Valid') : clearance.status === 'expired' ? (isRTL ? 'منتهي' : 'Expired') : clearance.status === 'pending_clearance' ? (isRTL ? 'قيد الانتظار' : 'Pending Review') : clearance.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejected') : clearance.status === 'clearance_approved' ? (isRTL ? 'طُبع' : 'Approved') : (isRTL ? 'ينتهي قريبًا' : 'Expiring Soon')}
                </span>
                <button onClick={() => viewQRCode(clearance)} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                  <QrCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                <Ship className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isRTL ? 'السفينة' : 'Vessel'}</p>
                  <p className="text-slate-900 dark:text-slate-50 font-medium text-sm">{clearance.vessel}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'الميناء التالي' : 'Next Port'}</p>
                  <p className="text-slate-900 dark:text-slate-50 font-medium text-sm">{clearance.nextPort}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'الوقت المتبقي' : 'Time Remaining'}</p>
                  <p className={`font-bold text-sm ${getHoursColor(clearance.hoursRemaining)}`}>
                    {clearance.hoursRemaining < 0 ? (isRTL ? 'منتهي' : 'Expired') : `${clearance.hoursRemaining}h`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'وقت الإصدار' : 'Issue Time'}</p>
                  <p className="text-slate-900 dark:text-slate-50 text-sm">{clearance.issueTime}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'وقت الانتهاء' : 'Expiry Time'}</p>
                  <p className="text-slate-900 dark:text-slate-50 text-sm">{clearance.expiryTime || '-'}</p>
                </div>
              </div>
            </div>

            {clearance.status === 'pending_clearance' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleApprove(clearance.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isRTL ? 'موافقة' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(clearance.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isRTL ? 'رفض' : 'Reject'}
                </button>
              </div>
            )}
            
            {clearance.status === 'clearance_approved' && clearance.certificate_path && (
               <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                 <button
                   onClick={() => window.open(`http://localhost:8000${clearance.certificate_path}`, '_blank')}
                   className="flex items-center justify-center gap-2 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 py-2 rounded-lg text-sm font-semibold transition-colors"
                 >
                   {isRTL ? 'عرض الشهادة (PDF)' : 'View Certificate (PDF)'}
                 </button>
               </div>
            )}
          </div>
        ))}
      </div>

      {clearances.length === 0 && (
        <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <FileCheck className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{isRTL ? 'لا توجد تصاريح مغادرة' : 'No clearances issued yet'}</p>
        </div>
      )}

      {/* Issue Form Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{isRTL ? 'إصدار تصريح مغادرة جديد' : 'Issue New Port Clearance'}</h3>
              </div>
              <button onClick={() => setShowIssueForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{isRTL ? 'اختر السفينة' : 'Select Vessel'}</label>
                <select value={selectedVessel} onChange={(e) => setSelectedVessel(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors">
                  <option value="">{isRTL ? 'اختر سفينة...' : 'Select a vessel...'}</option>
                  {availableVessels.map((vessel) => <option key={vessel} value={vessel}>{vessel}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{isRTL ? 'الميناء التالي' : 'Next Port'}</label>
                <input type="text" value={nextPort} onChange={(e) => setNextPort(e.target.value)} placeholder={isRTL ? 'أدخل اسم الميناء التالي' : 'Enter next port name'} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-colors" />
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700 dark:text-blue-400 text-xs">{isRTL ? 'سيتم إنشاء رقم تصريح تلقائي. صلاحية التصريح 24 ساعة من وقت الإصدار.' : 'Clearance ID will be auto-generated. Clearance valid for 24 hours from issue time.'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowIssueForm(false)} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-2.5 rounded-lg font-medium transition-colors">{isRTL ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleIssueClearance} disabled={!selectedVessel || !nextPort || issuing} className="flex-1 bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                {issuing ? <LoadingIndicator type="line-spinner" size="xs" className="text-white" /> : <CheckCircle className="w-4 h-4" />}
                {isRTL ? 'إصدار التصريح' : 'Issue Clearance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedClearance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{isRTL ? 'رمز QR للتصريح' : 'Clearance QR Code'}</h3>
              <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 mb-4">
              <div className="aspect-square bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg flex items-center justify-center">
                <QrCode className="w-40 h-40 text-white" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'رقم التصريح' : 'Clearance ID'}</p>
                <p className="text-slate-900 dark:text-slate-50 font-semibold">{selectedClearance.clearanceId}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/25 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isRTL ? 'السفينة' : 'Vessel'}</p>
                <p className="text-slate-900 dark:text-slate-50 font-semibold">{selectedClearance.vessel}</p>
              </div>
            </div>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm">{isRTL ? 'امسح هذا الرمز للتحقق من صحة التصريح' : 'Scan this code to validate the clearance'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
