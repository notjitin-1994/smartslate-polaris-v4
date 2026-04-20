/**
 * Notification Context
 * Provides real-time notification management for admin users
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  subscribeToNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/services/notificationService';
import type { AdminNotification, NotificationFilters } from '@/types/notifications';

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  filterNotifications: (filters: NotificationFilters) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function NotificationProvider({ children, enabled = true }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilters, setCurrentFilters] = useState<NotificationFilters>({});

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      if (!enabled) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await getNotifications(filters);

        if (fetchError) {
          // Don't throw for missing table - just log warning
          console.warn('Notifications unavailable:', fetchError);
          setNotifications([]);
        } else {
          setNotifications(data || []);
        }

        setCurrentFilters(filters);

        // Fetch unread count
        const { count, error: countError } = await getUnreadCount();
        if (!countError) {
          setUnreadCount(count);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err as Error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled]
  );

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchNotifications();
    }
  }, [enabled, fetchNotifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled) return;

    try {
      const unsubscribe = subscribeToNotifications((newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: newNotification.id,
          });
        }
      });

      return unsubscribe;
    } catch (err) {
      console.warn('Failed to setup real-time notifications:', err);
      return () => {}; // Return no-op cleanup function
    }
  }, [enabled]);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(currentFilters);
  }, [fetchNotifications, currentFilters]);

  // Mark single notification as read
  const markNotificationAsRead = useCallback(async (id: string) => {
    const { success, error: markError } = await markAsRead(id);

    if (success && !markError) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    const { count, error: markError } = await markAllAsRead();

    if (!markError) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  }, []);

  // Filter notifications
  const filterNotifications = useCallback(
    async (filters: NotificationFilters) => {
      await fetchNotifications(filters);
    },
    [fetchNotifications]
  );

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    filterNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Hook to use notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}
