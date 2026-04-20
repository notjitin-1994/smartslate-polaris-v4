/**
 * Test Fixtures for Settings Features
 * Provides mock data for preferences, sessions, notifications, etc.
 */

import type {
  NotificationPreferences,
  UserPreferences,
  SessionTracking,
  DataExport,
  AccountDeletionRequest,
} from '@/types/settings';

export const mockUserPreferences: UserPreferences = {
  theme: 'dark',
  language: 'en',
  reduced_motion: false,
  compact_mode: true,
  auto_save: true,
  default_blueprint_visibility: 'private',
  show_welcome_guide: false,
  enable_keyboard_shortcuts: true,
  enable_tooltips: true,
  sidebar_collapsed: false,
};

export const mockNotificationPreferences: NotificationPreferences = {
  user_id: 'test-user-id-123456789',
  email_blueprint_updates: true,
  email_security_alerts: true,
  email_account_activity: true,
  email_marketing: false,
  email_product_updates: true,
  email_tips_tutorials: false,
  push_blueprint_updates: true,
  push_security_alerts: true,
  push_account_activity: false,
  in_app_blueprint_updates: true,
  in_app_security_alerts: true,
  in_app_account_activity: true,
  in_app_system_notifications: true,
  notification_frequency: 'realtime',
  quiet_hours: {
    enabled: true,
    start_time: '22:00',
    end_time: '08:00',
    timezone: 'America/New_York',
  },
  created_at: '2025-11-05T10:00:00.000Z',
  updated_at: '2025-11-05T10:00:00.000Z',
};

export const mockSessionTracking: SessionTracking = {
  id: 'session-123',
  user_id: 'test-user-id-123456789',
  session_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
  device_info: {
    device_type: 'desktop',
    browser: 'Chrome',
    browser_version: '119.0',
    os: 'macOS',
    os_version: '14.0',
  },
  ip_address: '192.168.1.100',
  user_agent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  location_city: 'San Francisco',
  location_country: 'United States',
  location_coordinates: null,
  created_at: '2025-11-05T10:00:00.000Z',
  last_activity_at: '2025-11-05T12:00:00.000Z',
  expires_at: '2025-11-06T10:00:00.000Z',
  ended_at: null,
  is_active: true,
  is_suspicious: false,
  security_metadata: {},
  updated_at: '2025-11-05T12:00:00.000Z',
};

export const mockDataExport: DataExport = {
  id: 'export-123',
  user_id: 'test-user-id-123456789',
  export_format: 'json',
  export_type: 'full',
  status: 'pending',
  file_url: null,
  file_size_bytes: null,
  export_summary: null,
  error_message: null,
  requested_at: '2025-11-05T10:00:00.000Z',
  started_at: null,
  completed_at: null,
  expires_at: '2025-11-12T10:00:00.000Z',
  created_at: '2025-11-05T10:00:00.000Z',
  updated_at: '2025-11-05T10:00:00.000Z',
};

export const mockCompletedDataExport: DataExport = {
  ...mockDataExport,
  status: 'completed',
  file_url: 'https://storage.example.com/exports/export-123.json',
  file_size_bytes: 1024000,
  export_summary: {
    total_items: 150,
    categories: {
      profile: 1,
      blueprints: 25,
      activity: 124,
    },
  },
  started_at: '2025-11-05T10:01:00.000Z',
  completed_at: '2025-11-05T10:05:00.000Z',
};

export const mockAccountDeletionRequest: AccountDeletionRequest = {
  id: 'deletion-123',
  user_id: 'test-user-id-123456789',
  requested_at: '2025-11-05T10:00:00.000Z',
  scheduled_deletion_date: '2025-12-05T10:00:00.000Z',
  reason: 'No longer using the service',
  feedback: {
    satisfaction: 3,
    comments: 'Found a better alternative',
  },
  status: 'scheduled',
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  completed_at: null,
  completion_metadata: null,
  created_at: '2025-11-05T10:00:00.000Z',
  updated_at: '2025-11-05T10:00:00.000Z',
};

export const mockCancelledDeletionRequest: AccountDeletionRequest = {
  ...mockAccountDeletionRequest,
  status: 'cancelled',
  cancelled_at: '2025-11-06T10:00:00.000Z',
  cancelled_by: 'test-user-id-123456789',
  cancellation_reason: 'Changed my mind',
};

// Helper to create multiple sessions
export function createMockSessions(count: number): SessionTracking[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockSessionTracking,
    id: `session-${i + 1}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(), // Stagger by days
    last_activity_at: new Date(Date.now() - i * 3600000).toISOString(), // Stagger by hours
    is_active: i < 3, // Only first 3 are active
  }));
}

// Helper to create email notification log entry
export const mockEmailLog = {
  id: 'email-log-123',
  user_id: 'test-user-id-123456789',
  recipient_email: 'test@example.com',
  email_type: 'password_changed',
  subject: 'Your Password Has Been Changed',
  template_id: null,
  template_data: {
    userName: 'Test User',
    changedAt: '2025-11-05T10:00:00.000Z',
  },
  status: 'sent',
  provider: 'resend',
  provider_id: 'resend-msg-123',
  provider_metadata: {},
  sent_at: '2025-11-05T10:00:01.000Z',
  delivered_at: '2025-11-05T10:00:05.000Z',
  opened_at: null,
  clicked_at: null,
  failed_at: null,
  error_message: null,
  error_code: null,
  retry_count: 0,
  created_at: '2025-11-05T10:00:00.000Z',
  updated_at: '2025-11-05T10:00:05.000Z',
};
