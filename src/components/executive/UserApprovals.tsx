import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Language } from '../../App';
import { translations } from '../../utils/translations';
import { executiveService } from '../../services/executiveService';

interface UserApprovalsProps {
  language: Language;
}

interface PendingUser {
  id: number;
  name: string;
  email: string;
  role: string;
  organization?: string;
  created_at: string;
  status: string;
}

export function UserApprovals({ language }: UserApprovalsProps) {
  const t = translations[language].executive.userApprovals;
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ userId: number; userName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const data = await executiveService.getPendingUsers();
      setPendingUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await executiveService.approveUser(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      showToast('success', t.successApprove);
    } catch (error) {
      showToast('error', 'Failed to approve user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.userId);
    try {
      await executiveService.rejectUser(rejectModal.userId, rejectReason);
      setPendingUsers(prev => prev.filter(u => u.id !== rejectModal.userId));
      showToast('success', t.successReject);
      setRejectModal(null);
      setRejectReason('');
    } catch (error) {
      showToast('error', 'Failed to reject user.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return dateStr; }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'agent') return language === 'ar' ? 'وكيل بحري' : 'Maritime Agent';
    if (role === 'trader') return language === 'ar' ? 'تاجر' : 'Trader';
    return role;
  };

  return (
    <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">{t.title}</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">{t.subtitle}</p>
        </div>
        <button
          onClick={fetchPendingUsers}
          className="px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-xl font-bold text-sm transition-all"
        >
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-primary)]">{pendingUsers.length}</div>
            <div className="text-sm text-[var(--text-secondary)] font-medium">{t.pendingRequests}</div>
          </div>
        </div>
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-primary)]">{pendingUsers.filter(u => u.role === 'agent').length}</div>
            <div className="text-sm text-[var(--text-secondary)] font-medium">{language === 'ar' ? 'وكلاء' : 'Agents'}</div>
          </div>
        </div>
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-primary)]">{pendingUsers.filter(u => u.role === 'trader').length}</div>
            <div className="text-sm text-[var(--text-secondary)] font-medium">{language === 'ar' ? 'تجار' : 'Traders'}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">{t.noRequests}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.name}</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.email}</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.role}</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.organization}</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.submittedAt}</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pendingUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--primary)]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'agent' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{user.organization || '—'}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="w-3 h-3 border border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          {t.approve}
                        </button>
                        <button
                          onClick={() => setRejectModal({ userId: user.id, userName: user.name })}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">{t.rejectTitle}</h3>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              {language === 'ar' ? `رفض طلب: ${rejectModal.userName}` : `Rejecting request for: ${rejectModal.userName}`}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectPlaceholder}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all resize-none text-sm mb-3"
            />
            <p className="text-red-400/70 text-xs mb-5">{t.rejectNote}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-[var(--secondary)]/10 hover:bg-[var(--secondary)]/20 text-[var(--text-secondary)] rounded-xl font-bold text-sm transition-all"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {actionLoading !== null ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {t.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
