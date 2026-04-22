/**
 * Analytics Types
 *
 * Types for user and platform analytics data
 */

export interface DateRange {
  start: string;
  end: string;
}

export interface BlueprintAnalytics {
  total: number;
  completed: number;
  draft: number;
  generating: number;
  error: number;
  completion_rate?: number;
}

export interface ActivityAnalytics {
  total: number;
  unique_types: number;
  top_actions?: Array<{
    type: string;
    count: number;
  }>;
}

export interface SessionAnalytics {
  total: number;
  active: number;
  total_duration: number;
  avg_duration: number;
  total_page_views: number;
  total_actions?: number;
  devices?: string[];
}

export interface UserAnalytics {
  user_id: string;
  date_range: DateRange;
  blueprints: BlueprintAnalytics;
  activities: ActivityAnalytics;
  sessions: SessionAnalytics;
}

export interface UserEngagementMetrics {
  user_id: string;
  full_name: string | null;
  subscription_tier: string;
  user_role: string;
  user_created_at: string;
  total_blueprints: number;
  completed_blueprints: number;
  total_activities: number;
  total_sessions: number;
  total_session_duration: number;
  avg_session_duration: number;
  total_page_views: number;
  total_actions: number;
  engagement_score: number;
  last_activity_at: string;
}

export interface PlatformAnalytics {
  date_range: DateRange;
  users: {
    total: number;
    active: number;
    by_tier: Record<string, number>;
  };
  blueprints: BlueprintAnalytics;
  sessions: SessionAnalytics;
  activities: ActivityAnalytics;
}

export interface DailyActivitySummary {
  user_id: string;
  activity_date: string;
  total_activities: number;
  unique_action_types: number;
  blueprint_activities: number;
  user_management_activities: number;
  first_activity_at: string;
  last_activity_at: string;
}

export interface DailySessionSummary {
  user_id: string;
  session_date: string;
  total_sessions: number;
  active_sessions: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  max_duration_seconds: number;
  total_page_views: number;
  total_actions: number;
  total_blueprints_created: number;
  total_blueprints_viewed: number;
  unique_device_types: number;
}

export interface DeviceDistribution {
  user_id: string;
  device_type: string;
  session_count: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  total_page_views: number;
}

export interface BrowserDistribution {
  user_id: string;
  browser: string;
  session_count: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
}

export interface DailyBlueprintStats {
  user_id: string;
  creation_date: string;
  total_blueprints: number;
  draft_count: number;
  generating_count: number;
  completed_count: number;
  error_count: number;
}

export interface BlueprintCompletionRate {
  user_id: string;
  total_blueprints: number;
  completed_blueprints: number;
  failed_blueprints: number;
  completion_rate_percentage: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface AnalyticsFilter {
  period: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
  user_id?: string;
  tier?: string;
  device_type?: string;
}
