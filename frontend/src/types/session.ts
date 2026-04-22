/**
 * Session Tracking Types
 *
 * Types for user session tracking and engagement metrics
 */

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface UserSession {
  id: string;
  user_id: string;

  // Session timing
  started_at: string;
  ended_at: string | null;
  last_activity_at: string;

  // Session metadata
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;

  // Session state
  is_active: boolean;
  session_token: string | null;

  // Engagement metrics
  page_views: number;
  actions_count: number;
  blueprints_created: number;
  blueprints_viewed: number;

  // Computed fields
  duration_seconds: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SessionActivity {
  page_view?: boolean;
  action?: boolean;
  blueprint_created?: boolean;
  blueprint_viewed?: boolean;
}

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  total_duration_seconds: number;
  average_duration_seconds: number;
  total_page_views: number;
  total_actions: number;
  total_blueprints_created: number;
  total_blueprints_viewed: number;
}

export interface SessionCreateInput {
  user_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device_type?: DeviceType | null;
  browser?: string | null;
  os?: string | null;
  session_token?: string | null;
}

export interface SessionFilter {
  user_id?: string;
  is_active?: boolean;
  device_type?: DeviceType;
  start_date?: string;
  end_date?: string;
}

export interface SessionListResponse {
  sessions: UserSession[];
  stats: SessionStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
