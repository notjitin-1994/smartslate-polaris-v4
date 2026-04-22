/**
 * Notification Types and Interfaces
 * Type-safe definitions for admin notification system
 */

export type NotificationType =
  | 'user_registration'
  | 'blueprint_limit_reached'
  | 'subscription_upgrade'
  | 'subscription_downgrade'
  | 'payment_received'
  | 'payment_failed'
  | 'system_alert'
  | 'cost_threshold'
  | 'feedback_submitted'
  | 'error_alert'
  | 'security_alert'
  | 'usage_milestone';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'users'
  | 'blueprints'
  | 'billing'
  | 'system'
  | 'security'
  | 'feedback';

export interface NotificationMetadata {
  user_id?: string;
  email?: string;
  full_name?: string;
  subscription_tier?: string;
  count?: number;
  limit?: number;
  old_tier?: string;
  new_tier?: string;
  amount?: number;
  error_message?: string;
  [key: string]: any; // Allow additional properties
}

export interface AdminNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  metadata: NotificationMetadata;
  action_url?: string | null;
  action_label?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  expires_at?: string | null;
}

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  metadata?: NotificationMetadata;
  action_url?: string;
  action_label?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
}

// Helper type for notification icons
export type NotificationIcon =
  | 'user-plus'
  | 'alert-triangle'
  | 'trending-up'
  | 'trending-down'
  | 'dollar-sign'
  | 'credit-card'
  | 'bell'
  | 'shield'
  | 'message-square'
  | 'award';

// Map notification types to icons
export const NOTIFICATION_ICONS: Record<NotificationType, NotificationIcon> = {
  user_registration: 'user-plus',
  blueprint_limit_reached: 'alert-triangle',
  subscription_upgrade: 'trending-up',
  subscription_downgrade: 'trending-down',
  payment_received: 'dollar-sign',
  payment_failed: 'credit-card',
  system_alert: 'bell',
  cost_threshold: 'dollar-sign',
  feedback_submitted: 'message-square',
  error_alert: 'alert-triangle',
  security_alert: 'shield',
  usage_milestone: 'award',
};

// Priority colors for UI styling
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-blue-400 bg-blue-400/10',
  normal: 'text-[#a7dadb] bg-[#a7dadb]/10',
  high: 'text-orange-400 bg-orange-400/10',
  urgent: 'text-red-400 bg-red-400/10',
};

// Category colors for UI styling
export const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  users: 'text-purple-400 bg-purple-400/10',
  blueprints: 'text-cyan-400 bg-cyan-400/10',
  billing: 'text-green-400 bg-green-400/10',
  system: 'text-blue-400 bg-blue-400/10',
  security: 'text-red-400 bg-red-400/10',
  feedback: 'text-yellow-400 bg-yellow-400/10',
};
