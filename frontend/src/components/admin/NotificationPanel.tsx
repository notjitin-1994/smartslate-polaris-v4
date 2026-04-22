/**
 * Notification Panel Component
 * Displays real-time admin notifications in a dropdown
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Shield,
  MessageSquare,
  Award,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AdminNotification, NotificationType } from '@/types/notifications';
import { PRIORITY_COLORS, CATEGORY_COLORS } from '@/types/notifications';

// Icon mapping
const ICON_MAP: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  user_registration: UserPlus,
  blueprint_limit_reached: AlertTriangle,
  subscription_upgrade: TrendingUp,
  subscription_downgrade: TrendingDown,
  payment_received: DollarSign,
  payment_failed: CreditCard,
  system_alert: Bell,
  cost_threshold: DollarSign,
  feedback_submitted: MessageSquare,
  error_alert: AlertTriangle,
  security_alert: Shield,
  usage_milestone: Award,
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

export default function NotificationPanel({ isOpen, onClose, panelRef }: NotificationPanelProps) {
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } =
    useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-12 right-0 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-white/10 bg-[#0d1b2a]/98 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#a7dadb] hover:underline"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-white/10 bg-white/5">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-[#a7dadb] text-[#a7dadb]'
                : 'text-[#7a8a8b] hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              filter === 'unread'
                ? 'border-b-2 border-[#a7dadb] text-[#a7dadb]'
                : 'text-[#7a8a8b] hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-2 h-8 w-8 text-[#7a8a8b]" />
              <p className="text-sm text-[#7a8a8b]">No notifications</p>
            </div>
          ) : (
            displayedNotifications.map((notification) => {
              const Icon = ICON_MAP[notification.type];
              const priorityColor = PRIORITY_COLORS[notification.priority];
              const categoryColor = CATEGORY_COLORS[notification.category];

              return (
                <div
                  key={notification.id}
                  className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                    !notification.is_read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex gap-3 p-4">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${categoryColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          <p className="mt-0.5 text-xs text-[#b0c5c6]">{notification.message}</p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="flex-shrink-0 text-[#a7dadb] hover:text-white"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#7a8a8b]">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(notification.created_at)}</span>
                        <span className={`rounded px-1.5 py-0.5 ${priorityColor}`}>
                          {notification.priority}
                        </span>
                      </div>

                      {/* Action Link */}
                      {notification.action_url && notification.action_label && (
                        <Link
                          href={notification.action_url}
                          className="mt-2 inline-flex items-center text-xs text-[#a7dadb] hover:underline"
                          onClick={onClose}
                        >
                          {notification.action_label} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-white/10 bg-white/5 px-4 py-2 text-center">
            <Link
              href="/admin/notifications"
              className="text-xs text-[#a7dadb] hover:underline"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
