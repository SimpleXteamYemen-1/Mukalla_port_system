import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import {
  Users, Plus, Search, Filter, Edit2, Trash2, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Clock, ShieldOff,
  ChevronLeft, ChevronRight, X, Eye, EyeOff, UserPlus,
} from 'lucide-react';
import { Language } from '../../App';
import { adminService, AdminUser } from '../../services/adminService';

interface UserDirectoryProps {
  language: Language;
}

type ModalType = 'create' | 'edit' | 'suspend-confirm' | 'delete-confirm' | null;

const ROLES = ['trader', 'agent', 'executive', 'officer', 'wharf'] as const;
const STATUSES = ['active', 'pending', 'suspended', 'rejected'] as const;

const ROLE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  trader:    { en: 'Trader',     ar: 'تاجر',         color: 'bg-purple-500/10 text-purple-400' },
  agent:     { en: 'Agent',      ar: 'وكيل بحري',    color: 'bg-blue-500/10 text-blue-400'   },
  executive: { en: 'Executive',  ar: 'إدارة تنفيذية', color: 'bg-pink-500/10 text-pink-400'   },
  officer:   { en: 'Officer',    ar: 'ضابط ميناء',    color: 'bg-cyan-500/10 text-cyan-400'   },
  wharf:     { en: 'Wharf',      ar: 'عامل رصيف',    color: 'bg-orange-500/10 text-orange-400'},
};

const STATUS_CONFIG: Record<string, { en: string; ar: string; color: string; icon: ReactNode }> = {
  active:    { en: 'Active',    ar: 'نشط',       color: 'bg-green-500/10 text-green-400 border-green-500/20',   icon: <CheckCircle  className="w-3 h-3" /> },
  pending:   { en: 'Pending',   ar: 'قيد المراجعة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock        className="w-3 h-3" /> },
  suspended: { en: 'Suspended', ar: 'موقوف',     color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',     icon: <ShieldOff    className="w-3 h-3" /> },
  rejected:  { en: 'Rejected',  ar: 'مرفوض',     color: 'bg-red-500/10 text-red-400 border-red-500/20',        icon: <XCircle      className="w-3 h-3" /> },
};

// ─── Reusable Input ────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-red-400 text-xs font-medium">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-[var(--bg-primary)]/60 border ${error ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm`}
    />
  );
}

function Select({ error, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 bg-[var(--bg-primary)]/60 border ${error ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm`}
    >
      {children}
    </select>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, language }: { status: string; language: Language }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.color}`}>
      {cfg.icon}
      {language === 'ar' ? cfg.ar : cfg.en}
    </span>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role, language }: { role: string; language: Language }) {
  const cfg = ROLE_LABELS[role] ?? { en: role, ar: role, color: 'bg-gray-500/10 text-gray-400' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
      {language === 'ar' ? cfg.ar : cfg.en}
    </span>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { type: 'success' | 'error'; message: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-2 ${
      toast.type === 'success'
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400'
    }`}>
      {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
      <span className="font-semibold text-sm">{toast.message}</span>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-2';
  return <div className={`${s} border-current/30 border-t-current rounded-full animate-spin`} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function UserDirectory({ language }: UserDirectoryProps) {
  const isAR = language === 'ar';

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', email: '', role: '', organization: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', organization: '', status: '', phone: '' });
  const [pendingSuspend, setPendingSuspend] = useState(false); // tracks if status going → suspended

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        per_page: 12,
        search: search || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
      });
      setUsers(res.data);
      setTotal(res.total);
      setCurrentPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      showToast('error', isAR ? 'فشل تحميل المستخدمين' : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [search, filterRole, filterStatus, currentPage, isAR]);

  useEffect(() => { fetchUsers(1); }, [filterRole, filterStatus]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(1), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!createForm.name.trim())  errs.name  = isAR ? 'الاسم مطلوب'           : 'Name is required.';
    if (!createForm.email.trim()) errs.email = isAR ? 'البريد الإلكتروني مطلوب' : 'Email is required.';
    if (!createForm.role)         errs.role  = isAR ? 'الدور مطلوب'            : 'Role is required.';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const res = await adminService.createUser({
        name:  createForm.name,
        email: createForm.email,
        role:  createForm.role,
        organization: createForm.organization || undefined,
        password: createForm.password || undefined,
        password_confirmation: createForm.password_confirmation || undefined,
      });
      setUsers(prev => [res.user, ...prev]);
      setTotal(t => t + 1);
      closeModal();
      showToast('success', res.password_reset
        ? (isAR ? 'تم إنشاء الحساب وإرسال رابط تعيين كلمة المرور' : 'Account created. Password reset link sent.')
        : (isAR ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully.')
      );
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const apiErrors = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v as string[])[0]; });
        setFieldErrors(mapped);
      } else {
        showToast('error', isAR ? 'فشل إنشاء الحساب' : 'Failed to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, organization: user.organization ?? '', status: user.status, phone: user.phone ?? '' });
    setPendingSuspend(false);
    setFieldErrors({});
    setModal('edit');
  };

  const handleEditStatusChange = (newStatus: string) => {
    if (newStatus === 'suspended' && selectedUser?.status !== 'suspended') {
      setPendingSuspend(true);  // show confirmation first
    } else {
      setPendingSuspend(false);
      setEditForm(f => ({ ...f, status: newStatus }));
    }
  };

  const confirmSuspend = () => {
    setEditForm(f => ({ ...f, status: 'suspended' }));
    setPendingSuspend(false);
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const res = await adminService.updateUser(selectedUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        organization: editForm.organization || undefined,
        status: editForm.status,
        phone: editForm.phone || undefined,
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? res.user : u));
      closeModal();
      const msg = res.tokens_revoked
        ? (isAR ? 'تم تعليق الحساب وإلغاء جميع الجلسات النشطة' : 'Account suspended. All active sessions revoked.')
        : (isAR ? 'تم تحديث بيانات المستخدم' : 'User updated successfully.');
      showToast('success', msg);
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const apiErrors = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v as string[])[0]; });
        setFieldErrors(mapped);
      } else {
        showToast('error', isAR ? 'فشل تحديث المستخدم' : 'Failed to update user.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setModal('delete-confirm');
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await adminService.deleteUser(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setTotal(t => t - 1);
      closeModal();
      showToast('success', isAR ? 'تم إلغاء وصول المستخدم والحفاظ على السجلات التاريخية' : 'User access revoked. Historical records preserved.');
    } catch {
      showToast('error', isAR ? 'فشل حذف المستخدم' : 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Close modal ────────────────────────────────────────────────────────────
  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
    setFieldErrors({});
    setIsSubmitting(false);
    setPendingSuspend(false);
    setCreateForm({ name: '', email: '', role: '', organization: '', password: '', password_confirmation: '' });
    setShowPassword(false);
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(isAR ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            {isAR ? 'دليل المستخدمين' : 'User Directory'}
          </h1>
          <p className="text-[var(--text-secondary)] mt-0.5 font-medium text-sm">
            {isAR ? `إجمالي ${total} مستخدم` : `${total} total users`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchUsers(currentPage)} className="p-2.5 bg-[var(--bg-primary)] hover:bg-[var(--primary)]/10 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setModal('create'); setFieldErrors({}); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            {isAR ? 'إنشاء مستخدم' : 'Create User'}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass-panel p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute ${isAR ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAR ? 'ابحث باسم أو بريد إلكتروني...' : 'Search by name or email...'}
            className={`w-full ${isAR ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm`}
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <Filter className={`absolute ${isAR ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none`} />
          <select
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
            className={`${isAR ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all text-sm appearance-none`}
          >
            <option value="">{isAR ? 'كل الأدوار' : 'All Roles'}</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]?.[language === 'ar' ? 'ar' : 'en'] ?? r}</option>)}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all text-sm appearance-none"
          >
            <option value="">{isAR ? 'كل الحالات' : 'All Statuses'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.[language === 'ar' ? 'ar' : 'en'] ?? s}</option>)}
          </select>
        </div>

        {/* Clear filters */}
        {(filterRole || filterStatus || search) && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all"
          >
            <X className="w-3.5 h-3.5" />
            {isAR ? 'مسح' : 'Clear'}
          </button>
        )}
      </div>

      {/* ── Data Grid ── */}
      <div className="glass-panel overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <p className="font-bold text-[var(--text-primary)]">{isAR ? 'لا يوجد مستخدمون' : 'No users found'}</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">{isAR ? 'جرّب تغيير معايير البحث' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]/30">
                  {['User', 'Role', 'Status', 'Organization', 'Created', 'Actions'].map((h, i) => (
                    <th key={i} className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] whitespace-nowrap">
                      {isAR ? (['المستخدم','الدور','الحالة','المنظمة','تاريخ الإنشاء','الإجراءات'][i]) : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--primary)]/5 transition-colors group">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div>
                          <div className="font-semibold text-[var(--text-primary)] text-sm">{user.name}</div>
                          <div className="text-[var(--text-secondary)] text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-6 py-4"><RoleBadge role={user.role} language={language} /></td>
                    {/* Status */}
                    <td className="px-6 py-4"><StatusBadge status={user.status} language={language} /></td>
                    {/* Organization */}
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{user.organization || <span className="opacity-30">—</span>}</td>
                    {/* Created */}
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm whitespace-nowrap">{formatDate(user.created_at)}</td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(user)}
                          title={isAR ? 'تعديل' : 'Edit'}
                          className="p-2 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(user)}
                          title={isAR ? 'حذف' : 'Delete'}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
            <p className="text-[var(--text-secondary)] text-sm">
              {isAR ? `صفحة ${currentPage} من ${lastPage}` : `Page ${currentPage} of ${lastPage}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = currentPage - 1; setCurrentPage(p); fetchUsers(p); }}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const p = Math.max(1, currentPage - 2) + i;
                if (p > lastPage) return null;
                return (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); fetchUsers(p); }}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === currentPage ? 'bg-[var(--primary)] text-white shadow' : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => { const p = currentPage + 1; setCurrentPage(p); fetchUsers(p); }}
                disabled={currentPage === lastPage}
                className="p-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL BACKDROP
         ═══════════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* ── Create User Modal ── */}
          {modal === 'create' && (
            <div className="glass-panel w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                    <Plus className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    {isAR ? 'إنشاء حساب جديد' : 'Create New Account'}
                  </h2>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={isAR ? 'الاسم الكامل' : 'Full Name'} error={fieldErrors.name}>
                    <Input
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={isAR ? 'أحمد علي' : 'John Doe'}
                      error={fieldErrors.name}
                    />
                  </Field>
                  <Field label={isAR ? 'البريد الإلكتروني' : 'Email'} error={fieldErrors.email}>
                    <Input
                      type="email"
                      value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@example.com"
                      error={fieldErrors.email}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={isAR ? 'الدور' : 'Role'} error={fieldErrors.role}>
                    <Select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} error={fieldErrors.role}>
                      <option value="">{isAR ? 'اختر دوراً' : 'Select a role'}</option>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]?.[isAR ? 'ar' : 'en'] ?? r}</option>)}
                    </Select>
                  </Field>
                  <Field label={isAR ? 'المنظمة (اختياري)' : 'Organization (opt.)'}>
                    <Input
                      value={createForm.organization}
                      onChange={e => setCreateForm(f => ({ ...f, organization: e.target.value }))}
                      placeholder={isAR ? 'اسم الشركة' : 'Company name'}
                    />
                  </Field>
                </div>

                {/* Password section */}
                <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-xl p-4">
                  <p className="text-xs font-bold text-[var(--primary)] mb-3 uppercase tracking-wider">
                    {isAR ? 'كلمة المرور (اختياري)' : 'Password (optional)'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    {isAR ? 'إذا تُركت فارغة، سيُرسَل رابط تعيين كلمة المرور للمستخدم تلقائياً.' : 'If left empty, a "Set your password" link will be emailed automatically.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={createForm.password}
                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        placeholder={isAR ? 'كلمة المرور' : 'Password'}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Input
                      type="password"
                      value={createForm.password_confirmation}
                      onChange={e => setCreateForm(f => ({ ...f, password_confirmation: e.target.value }))}
                      placeholder={isAR ? 'تأكيد كلمة المرور' : 'Confirm password'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-3 bg-[var(--border)]/50 hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-xl font-bold text-sm transition-all">
                  {isAR ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Spinner /> : <UserPlus className="w-4 h-4" />}
                  {isAR ? 'إنشاء الحساب' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          {/* ── Edit User Modal ── */}
          {modal === 'edit' && selectedUser && (
            <div className="glass-panel w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedUser.name} size="md" />
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)]">{isAR ? 'تعديل المستخدم' : 'Edit User'}</h2>
                    <p className="text-[var(--text-secondary)] text-xs">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={isAR ? 'الاسم' : 'Full Name'} error={fieldErrors.name}>
                    <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={fieldErrors.name} />
                  </Field>
                  <Field label={isAR ? 'البريد الإلكتروني' : 'Email'} error={fieldErrors.email}>
                    <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} error={fieldErrors.email} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={isAR ? 'الدور' : 'Role'} error={fieldErrors.role}>
                    <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} error={fieldErrors.role}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]?.[isAR ? 'ar' : 'en'] ?? r}</option>)}
                    </Select>
                  </Field>
                  <Field label={isAR ? 'المنظمة' : 'Organization'}>
                    <Input value={editForm.organization} onChange={e => setEditForm(f => ({ ...f, organization: e.target.value }))} />
                  </Field>
                </div>

                {/* Status Override */}
                <Field label={isAR ? 'الحالة' : 'Account Status'} error={fieldErrors.status}>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const isSelected = editForm.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleEditStatusChange(s)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold ${isSelected ? cfg.color + ' border-current/50 ring-2 ring-current/20' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'}`}
                        >
                          {cfg.icon}
                          {isAR ? cfg.ar : cfg.en}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Suspend warning inline */}
                {editForm.status === 'suspended' && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-400 text-xs font-medium">
                      {isAR ? 'سيتم إلغاء جميع الجلسات النشطة فور الحفظ.' : 'All active sessions will be immediately revoked upon save.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-3 bg-[var(--border)]/50 hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-xl font-bold text-sm transition-all">
                  {isAR ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Spinner /> : <CheckCircle className="w-4 h-4" />}
                  {isAR ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Suspend Confirmation ── */}
          {modal === 'edit' && pendingSuspend && (
            <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldOff className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">
                  {isAR ? 'تأكيد تعليق الحساب' : 'Confirm Suspension'}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {isAR
                    ? 'هل أنت متأكد؟ سيؤدي هذا إلى إلغاء جميع جلسات المستخدم النشطة فوراً ومنعه من تسجيل الدخول.'
                    : 'Are you sure? This will immediately revoke all of the user\'s active sessions and prevent them from logging in.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPendingSuspend(false)} className="flex-1 py-3 bg-[var(--border)]/50 hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-xl font-bold text-sm transition-all">
                  {isAR ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={confirmSuspend} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                  <ShieldOff className="w-4 h-4" />
                  {isAR ? 'تعليق الحساب' : 'Suspend Account'}
                </button>
              </div>
            </div>
          )}

          {/* ── Delete Confirmation ── */}
          {modal === 'delete-confirm' && selectedUser && (
            <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">
                  {isAR ? 'إلغاء وصول المستخدم' : 'Revoke User Access'}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm mb-3">
                  {isAR
                    ? `أنت على وشك إلغاء وصول "${selectedUser.name}" إلى النظام.`
                    : `You are about to revoke access for "${selectedUser.name}".`}
                </p>
                <div className="bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl p-3 text-left">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {isAR
                      ? '⚠ لن يُحذف المستخدم نهائياً — سيتم تعطيل وصوله والحفاظ على جميع السجلات التاريخية المرتبطة بمعاملات الميناء.'
                      : '⚠ The account will not be permanently deleted — access will be disabled and all historical port operation records will be preserved.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 bg-[var(--border)]/50 hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-xl font-bold text-sm transition-all">
                  {isAR ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Spinner /> : <Trash2 className="w-4 h-4" />}
                  {isAR ? 'إلغاء الوصول' : 'Revoke Access'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
