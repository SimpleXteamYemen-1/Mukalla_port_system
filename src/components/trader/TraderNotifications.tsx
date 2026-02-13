import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Bell, CheckCircle2, XCircle, AlertTriangle, FileText, RefreshCw, Eye, Package } from 'lucide-react';
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
        return {
          icon: Package,
          bg: 'bg-blue-500/10',
          border: 'border-blue-400/30',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-300',
          titleColor: 'text-blue-200'
        };
      case 'discharge_approved':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-400/30',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-300',
          titleColor: 'text-emerald-200'
        };
      case 'discharge_rejected':
        return {
          icon: XCircle,
          bg: 'bg-red-500/10',
          border: 'border-red-400/30',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-300',
          titleColor: 'text-red-200'
        };
      case 'discharge_submitted':
        return {
          icon: FileText,
          bg: 'bg-purple-500/10',
          border: 'border-purple-400/30',
          iconBg: 'bg-purple-500/20',
          iconColor: 'text-purple-300',
          titleColor: 'text-purple-200'
        };
      case 'clearance':
        return {
          icon: FileText,
          bg: 'bg-teal-500/10',
          border: 'border-teal-400/30',
          iconBg: 'bg-teal-500/20',
          iconColor: 'text-teal-300',
          titleColor: 'text-teal-200'
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-gray-500/10',
          border: 'border-gray-400/30',
          iconBg: 'bg-gray-500/20',
          iconColor: 'text-gray-300',
          titleColor: 'text-gray-200'
        };
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
    
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'الإشعارات' : 'Notifications'}
            </h1>
            <p className="text-emerald-200/70">
              {isRTL ? 'تنبيهات حالة الحاوية والتحديثات' : 'Container status alerts and updates'}
            </p>
          </div>
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3">
              <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'إجمالي' : 'Total'}</div>
              <div className="text-2xl font-bold text-white">{notifications.length}</div>
            </div>
            {unreadCount > 0 && (
              <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-400/30 rounded-xl px-6 py-3">
                <div className="text-amber-200/60 text-sm mb-1">{isRTL ? 'غير مقروءة' : 'Unread'}</div>
                <div className="text-2xl font-bold text-amber-300">{unreadCount}</div>
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-200'
                  : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10'
              }`}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-200'
                  : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10'
              }`}
            >
              {isRTL ? 'غير مقروءة' : 'Unread'}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'read'
                  ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-200'
                  : 'bg-white/5 border border-white/10 text-blue-200 hover:bg-white/10'
              }`}
            >
              {isRTL ? 'مقروءة' : 'Read'}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">{isRTL ? 'جاري التحميل...' : 'Loading notifications...'}</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Bell className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {isRTL ? 'لا توجد إشعارات' : 'No Notifications'}
          </h3>
          <p className="text-blue-200/60">
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
                className={`bg-white/5 backdrop-blur-xl border ${style.border} rounded-xl p-5 hover:border-emerald-400/30 transition-all ${
                  !notification.read ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 ${style.iconBg} rounded-xl`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-semibold ${style.titleColor}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-blue-200/60 text-xs whitespace-nowrap">
                          {formatDate(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>

                    <p className="text-blue-200/80 text-sm mb-3">
                      {notification.message}
                    </p>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-200 text-xs font-medium transition-all"
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
      <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {isRTL ? 'أنواع الإشعارات' : 'Notification Types'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="text-blue-200 font-medium text-sm">
                {isRTL ? 'تغيير الحالة' : 'Status Change'}
              </div>
              <div className="text-blue-200/60 text-xs">
                {isRTL ? 'تحديثات حالة الحاوية' : 'Container status updates'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-emerald-200 font-medium text-sm">
                {isRTL ? 'موافقة التفريغ' : 'Discharge Approval'}
              </div>
              <div className="text-emerald-200/60 text-xs">
                {isRTL ? 'تم الموافقة على الطلب' : 'Request approved'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-4 h-4 text-red-300" />
            </div>
            <div>
              <div className="text-red-200 font-medium text-sm">
                {isRTL ? 'رفض التفريغ' : 'Discharge Rejection'}
              </div>
              <div className="text-red-200/60 text-xs">
                {isRTL ? 'تم رفض الطلب' : 'Request rejected'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <FileText className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <div className="text-teal-200 font-medium text-sm">
                {isRTL ? 'التخليص الجمركي' : 'Clearance'}
              </div>
              <div className="text-teal-200/60 text-xs">
                {isRTL ? 'تحديثات المستندات' : 'Document updates'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
