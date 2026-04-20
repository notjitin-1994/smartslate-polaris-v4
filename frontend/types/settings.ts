/**
 * Settings-related TypeScript type definitions
 * Includes types for preferences, notifications, security settings, and data privacy
 */

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export interface NotificationPreferences {
  user_id: string;

  // Email notifications
  email_blueprint_updates: boolean;
  email_security_alerts: boolean;
  email_marketing: boolean;
  email_product_updates: boolean;
  email_weekly_digest: boolean;

  // In-app notifications
  in_app_notifications: boolean;
  in_app_blueprint_updates: boolean;
  in_app_comments: boolean;

  // Push notifications (for future mobile app)
  push_enabled: boolean;
  push_blueprint_updates: boolean;
  push_security_alerts: boolean;

  // Notification frequency
  notification_frequency: 'realtime' | 'daily' | 'weekly' | 'never';

  // Quiet hours
  quiet_hours: QuietHours;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface QuietHours {
  enabled: boolean;
  start_time: string; // Format: "HH:MM" (e.g., "22:00")
  end_time: string; // Format: "HH:MM" (e.g., "08:00")
}

export type NotificationPreferencesUpdate = Partial<
  Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// USER PREFERENCES (stored in user_profiles.preferences JSONB)
// ============================================================================

export interface UserPreferences {
  // Appearance
  theme?: 'light' | 'dark' | 'system';

  // Language
  language?: 'en' | 'es' | 'fr' | 'de' | 'ja';

  // Accessibility
  reduced_motion?: boolean;
  compact_mode?: boolean;

  // Behavior
  auto_save?: boolean;

  // Additional custom preferences
  [key: string]: any;
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

export interface SessionTracking {
  id: string;
  user_id: string;
  session_token: string;
  device_info: DeviceInfo;
  ip_address: string | null;
  user_agent: string | null;

  // Location info
  location_city: string | null;
  location_country: string | null;
  location_coordinates: { x: number; y: number } | null;

  // Session lifecycle
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  revoked_at: string | null;

  // Security
  is_suspicious: boolean;
  security_metadata: Record<string, any>;

  updated_at: string;
}

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  screen_resolution?: string;
  [key: string]: any;
}

export interface ActiveSession {
  id: string;
  created_at: string;
  last_activity_at: string;
  device_info: DeviceInfo;
  ip_address: string | null;
  location_city: string | null;
  location_country: string | null;
  is_current: boolean;
}

// ============================================================================
// DATA EXPORTS
// ============================================================================

export interface DataExport {
  id: string;
  user_id: string;

  // Export details
  export_format: 'json' | 'csv' | 'pdf';
  export_type: 'full' | 'profile' | 'blueprints' | 'activity' | 'preferences';

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

  // File information
  file_url: string | null;
  file_size_bytes: number | null;
  expires_at: string | null;

  // Processing timestamps
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;

  // Error info
  error_message: string | null;
  processing_metadata: Record<string, any>;

  // Export summary
  export_summary: ExportSummary;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ExportSummary {
  total_records?: number;
  blueprints?: number;
  activity_logs?: number;
  preferences?: number;
  [key: string]: any;
}

export interface DataExportRequest {
  export_format: 'json' | 'csv' | 'pdf';
  export_type: 'full' | 'profile' | 'blueprints' | 'activity' | 'preferences';
}

// ============================================================================
// ACCOUNT DELETION
// ============================================================================

export interface AccountDeletionRequest {
  id: string;
  user_id: string;

  // Request details
  requested_at: string;
  scheduled_deletion_at: string;

  // User feedback
  reason: string | null;
  feedback: Record<string, any>;

  // Status
  status: 'pending' | 'cancelled' | 'completed' | 'failed';

  // Cancellation info
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;

  // Completion info
  completed_at: string | null;
  completion_metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AccountDeletionRequestInput {
  reason?: string;
  feedback?: Record<string, any>;
}

export interface AccountDeletionCancellation {
  cancellation_reason?: string;
}

// ============================================================================
// EMAIL NOTIFICATIONS LOG
// ============================================================================

export interface EmailNotificationLog {
  id: string;
  user_id: string | null;

  // Email details
  recipient_email: string;
  email_type: string;
  subject: string;

  // Status
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';

  // Provider info
  provider: string;
  provider_id: string | null;
  provider_metadata: Record<string, any>;

  // Timing
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failed_at: string | null;

  // Error tracking
  error_message: string | null;
  error_code: string | null;
  retry_count: number;

  // Template
  template_id: string | null;
  template_data: Record<string, any>;

  // Engagement
  opens_count: number;
  clicks_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
}

// ============================================================================
// PASSWORD CHANGE
// ============================================================================

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// SETTINGS PAGE STATE
// ============================================================================

export interface SettingsPageState {
  profile: {
    isEditing: boolean;
    isUpdating: boolean;
  };
  subscription: {
    isLoading: boolean;
  };
  preferences: {
    hasUnsavedChanges: boolean;
    isSaving: boolean;
  };
  notifications: {
    hasUnsavedChanges: boolean;
    isSaving: boolean;
  };
  security: {
    isUpdatingPassword: boolean;
    isRevokingSessions: boolean;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// FORM VALIDATION SCHEMAS (matching Zod schemas)
// ============================================================================

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  full_name?: string;
  preferences?: Record<string, any>;
}

export interface PreferencesFormData extends UserPreferences {}

export interface NotificationPreferencesFormData extends NotificationPreferencesUpdate {}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
