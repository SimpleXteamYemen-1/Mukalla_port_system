import { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Bell, CheckCircle2, XCircle, FileText, RefreshCw, Eye, Package } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface TraderNotificationsProps {
  language: Language;
  userEmail: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function TraderNotifications({ language, userEmail }: TraderNotificationsProps) {
  const isRTL = language === 'ar';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-85dcafc8/trader-notifications?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        console.error('Failed to load notifications:', data.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-85dcafc8/mark-notification-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId })
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userEmail]);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'status_change':
        return { icon: Package, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-700 dark:text-blue-400', unreadBg: 'bg-blue-50 dark:bg-blue-900/10' };
      case 'discharge_approved':
        return { icon: CheckCircle2, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-700 dark:text-green-400', unreadBg: 'bg-green-50 dark:bg-green-900/10' };
      case 'discharge_rejected':
        return { icon: XCircle, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-700 dark:text-red-400', unreadBg: 'bg-red-50 dark:bg-red-900/10' };
      case 'discharge_submitted':
        return { icon: FileText, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', unreadBg: 'bg-amber-50 dark:bg-amber-900/10' };
      case 'clearance':
        return { icon: FileText, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-700 dark:text-blue-400', unreadBg: 'bg-blue-50 dark:bg-blue-900/10' };
      default:
        return { icon: Bell, iconBg: 'bg-slate-100 dark:bg-slate-700', iconColor: 'text-slate-700 dark:text-slate-300', unreadBg: '' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;

    return date.toLocaleDateString(isRTL ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL ? 'تنبيهات حالة الحاوية والتحديثات' : 'Container status alerts and updates'}
          </p>
        </div>
        <button
          onClick={loadNotifications}
          disabled={loading}
          className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
        >
          {loading ? <LoadingIndicator type="line-spinner" size="xs" /> : <RefreshCw className="w-4 h-4" />}
          <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-5 py-3 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">{isRTL ? 'إجمالي' : 'Total'}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{notifications.length}</div>
          </div>
          {unreadCount > 0 && (
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/30 rounded-lg px-5 py-3">
              <div className="text-amber-700 dark:text-amber-400 text-xs mb-1">{isRTL ? 'غير مقروءة' : 'Unread'}</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{unreadCount}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filter === f
                  ? 'bg-blue-900 dark:bg-blue-800 text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? (isRTL ? 'الكل' : 'All') : f === 'unread' ? (isRTL ? 'غير مقروءة' : 'Unread') : (isRTL ? 'مقروءة' : 'Read')}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
          <LoadingIndicator type="line-spinner" size="lg" label={isRTL ? 'جاري التحميل...' : 'Loading notifications...'} />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
          <Bell className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            {isRTL ? 'لا توجد إشعارات' : 'No Notifications'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {filter === 'unread'
              ? (isRTL ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
              : (isRTL ? 'لم تتلق أي إشعارات بعد' : 'You haven\'t received any notifications yet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => {
            const style = getNotificationStyle(notification.type);
            const Icon = style.icon;

            return (
              <div
                key={notification.id}
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors duration-200 ${
                  !notification.read ? style.unreadBg : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 ${style.iconBg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{notification.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{notification.message}</p>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isRTL ? 'وضع علامة مقروء' : 'Mark as read'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Types Legend */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          {isRTL ? 'أنواع الإشعارات' : 'Notification Types'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Package, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-700 dark:text-blue-400', title: isRTL ? 'تغيير الحالة' : 'Status Change', desc: isRTL ? 'تحديثات حالة الحاوية' : 'Container status updates' },
            { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400', title: isRTL ? 'موافقة التفريغ' : 'Discharge Approval', desc: isRTL ? 'تم الموافقة على الطلب' : 'Request approved' },
            { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-700 dark:text-red-400', title: isRTL ? 'رفض التفريغ' : 'Discharge Rejection', desc: isRTL ? 'تم رفض الطلب' : 'Request rejected' },
            { icon: FileText, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-700 dark:text-blue-400', title: isRTL ? 'التخليص الجمركي' : 'Clearance', desc: isRTL ? 'تحديثات المستندات' : 'Document updates' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`p-2 ${item.bg} rounded-lg`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-slate-50 font-medium text-sm">{item.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
