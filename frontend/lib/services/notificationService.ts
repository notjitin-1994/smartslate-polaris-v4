/**
 * Notification Service
 * Handles CRUD operations for admin notifications
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  AdminNotification,
  CreateNotificationParams,
  NotificationFilters,
  NotificationStats,
} from '@/types/notifications';

/**
 * Fetch notifications with optional filters
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<{ data: AdminNotification[] | null; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet (migration not run), return empty array silently
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn(
          'Notifications table not found. Please run migration: supabase/migrations/0038_admin_notifications.sql'
        );
        return { data: [], error: null };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{ count: number; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (error) {
      // If function doesn't exist yet (migration not run), return 0 silently
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        return { count: 0, error: null };
      }
      throw error;
    }

    return { count: data || 0, error: null };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });

    if (error) throw error;

    return { success: data || false, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ count: number; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) throw error;

    return { count: data || 0, error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from('admin_notifications').delete().eq('id', notificationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Create a notification (admin only, typically used in API routes)
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ data: AdminNotification | null; error: Error | null }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc('create_admin_notification', {
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_priority: params.priority || 'normal',
      p_category: params.category || 'general',
      p_metadata: params.metadata || {},
      p_action_url: params.action_url || null,
      p_action_label: params.action_label || null,
    });

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<{
  stats: NotificationStats | null;
  error: Error | null;
}> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Fetch all notifications for the current user
    const { data: notifications, error } = await supabase
      .from('admin_notifications')
      .select('category, priority, is_read');

    if (error) throw error;
    if (!notifications) return { stats: null, error: null };

    // Calculate statistics
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      by_category: {
        users: notifications.filter((n) => n.category === 'users').length,
        blueprints: notifications.filter((n) => n.category === 'blueprints').length,
        billing: notifications.filter((n) => n.category === 'billing').length,
        system: notifications.filter((n) => n.category === 'system').length,
        security: notifications.filter((n) => n.category === 'security').length,
        feedback: notifications.filter((n) => n.category === 'feedback').length,
      },
      by_priority: {
        low: notifications.filter((n) => n.priority === 'low').length,
        normal: notifications.filter((n) => n.priority === 'normal').length,
        high: notifications.filter((n) => n.priority === 'high').length,
        urgent: notifications.filter((n) => n.priority === 'urgent').length,
      },
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { stats: null, error: error as Error };
  }
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(callback: (notification: AdminNotification) => void) {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel('admin_notifications_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications',
      },
      (payload) => {
        callback(payload.new as AdminNotification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
