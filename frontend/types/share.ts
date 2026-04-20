/**
 * Advanced Share System Types
 * Industry-leading sharing features inspired by Notion, Figma, and Google Docs
 */

// Permission levels for share links
export type SharePermissionLevel = 'view' | 'comment' | 'edit';

// Device types for analytics
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// Share link status
export type ShareLinkStatus = 'active' | 'expired' | 'revoked' | 'limit_reached';

// Share link creation options
export interface CreateShareLinkOptions {
  blueprintId: string;
  permissionLevel?: SharePermissionLevel;

  // Access controls
  password?: string;
  maxViews?: number;
  expiresAt?: Date;

  // Advanced settings
  allowDownload?: boolean;
  allowPrint?: boolean;
  allowCopy?: boolean;
  showAnalytics?: boolean;
  requireEmail?: boolean;
  allowedEmails?: string[];
  blockedEmails?: string[];
  allowedDomains?: string[];

  // Customization
  customSlug?: string;
  customTitle?: string;
  customDescription?: string;
  customImageUrl?: string;

  // Template
  templateId?: string;
}

// Share link data structure
export interface ShareLink {
  id: string;
  blueprintId: string;
  userId: string;

  // Identifiers
  shareToken: string;
  shareSlug?: string;
  shareUrl: string;

  // Permissions
  permissionLevel: SharePermissionLevel;

  // Access controls
  hasPassword: boolean;
  maxViews?: number;
  expiresAt?: Date;
  isActive: boolean;

  // Settings
  allowDownload: boolean;
  allowPrint: boolean;
  allowCopy: boolean;
  showAnalytics: boolean;
  requireEmail: boolean;
  allowedEmails?: string[];
  blockedEmails?: string[];
  allowedDomains?: string[];

  // Analytics summary
  viewCount: number;
  uniqueViewers: number;
  lastViewedAt?: Date;

  // Custom metadata
  customTitle?: string;
  customDescription?: string;
  customImageUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
  revokeReason?: string;

  // Additional settings
  settings: Record<string, any>;
  metadata: Record<string, any>;
}

// Share analytics data
export interface ShareAnalytics {
  id: string;
  shareLinkId: string;

  // Visitor info (anonymized)
  visitorId: string;
  visitorEmail?: string;

  // Access details
  accessedAt: Date;
  accessDurationSeconds?: number;

  // User agent
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: DeviceType;

  // Location (anonymized)
  countryCode?: string;
  region?: string;

  // Engagement metrics
  sectionsViewed?: string[];
  timePerSection?: Record<string, number>;
  totalScrollDepth?: number;
  clicksCount?: number;

  // Actions
  downloaded: boolean;
  printed: boolean;
  shared: boolean;

  // Referrer
  referrerSource?: string;
  referrerUrl?: string;

  // Session
  sessionId: string;
  isReturningVisitor: boolean;
}

// Share comment
export interface ShareComment {
  id: string;
  shareLinkId: string;
  blueprintId: string;

  // Commenter
  commenterEmail: string;
  commenterName?: string;

  // Comment content
  commentText: string;
  sectionId?: string;
  selectionText?: string;

  // Status
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;

  // Threading
  parentCommentId?: string;
  replies?: ShareComment[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Share template
export interface ShareTemplate {
  id: string;
  userId: string;

  // Template info
  name: string;
  description?: string;
  isDefault: boolean;

  // Settings
  permissionLevel: SharePermissionLevel;
  expiresAfterHours?: number;
  requirePassword: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  allowCopy: boolean;
  showAnalytics: boolean;
  requireEmail: boolean;

  // Usage
  usageCount: number;
  lastUsedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Analytics summary for dashboard
export interface ShareAnalyticsSummary {
  shareLinkId: string;

  // Overview
  totalViews: number;
  uniqueViewers: number;
  averageViewDuration: number;

  // Time-based metrics
  viewsByDay: Array<{
    date: string;
    views: number;
    uniqueViewers: number;
  }>;

  viewsByHour: Array<{
    hour: number;
    views: number;
  }>;

  // Geographic distribution
  viewsByCountry: Array<{
    countryCode: string;
    countryName: string;
    views: number;
    percentage: number;
  }>;

  // Device analytics
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };

  browserBreakdown: Array<{
    browser: string;
    views: number;
    percentage: number;
  }>;

  osBreakdown: Array<{
    os: string;
    views: number;
    percentage: number;
  }>;

  // Engagement metrics
  averageScrollDepth: number;
  averageClicksPerSession: number;
  mostViewedSections: Array<{
    sectionId: string;
    sectionName: string;
    views: number;
    averageTime: number;
  }>;

  // Conversion metrics
  downloadRate: number;
  printRate: number;
  shareRate: number;

  // Traffic sources
  trafficSources: Array<{
    source: string;
    views: number;
    percentage: number;
  }>;

  // Recent activity
  recentViews: ShareAnalytics[];
}

// Share access request (for email-gated shares)
export interface ShareAccessRequest {
  shareLinkId: string;
  email: string;
  requestedAt: Date;
  grantedAt?: Date;
  deniedAt?: Date;
  denyReason?: string;
}

// Share notification preferences
export interface ShareNotificationSettings {
  userId: string;

  // Email notifications
  notifyOnView: boolean;
  notifyOnComment: boolean;
  notifyOnDownload: boolean;
  notifyOnShare: boolean;

  // Thresholds
  viewMilestones: number[]; // Notify at these view counts
  dailyDigest: boolean;
  weeklyReport: boolean;

  // Delivery
  email: string;
  webhookUrl?: string;
}

// API Response types
export interface CreateShareLinkResponse {
  success: boolean;
  shareLink?: ShareLink;
  shareUrl?: string;
  error?: string;
}

export interface UpdateShareLinkResponse {
  success: boolean;
  shareLink?: ShareLink;
  error?: string;
}

export interface RevokeShareLinkResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ShareAnalyticsResponse {
  success: boolean;
  analytics?: ShareAnalyticsSummary;
  error?: string;
}

export interface ValidateShareAccessResponse {
  success: boolean;
  requiresPassword?: boolean;
  requiresEmail?: boolean;
  permissionLevel?: SharePermissionLevel;
  settings?: {
    allowDownload: boolean;
    allowPrint: boolean;
    allowCopy: boolean;
    showAnalytics: boolean;
  };
  blueprint?: any; // Blueprint data if access granted
  error?: string;
}

// Share preview configuration
export interface SharePreviewConfig {
  showTitle: boolean;
  showExecutiveSummary: boolean;
  showMetadata: boolean;
  showSections: string[]; // Section IDs to show
  blurContent: boolean; // Blur content until authenticated
  watermark?: string; // Add watermark text
  brandingPosition?: 'top' | 'bottom' | 'none';
}

// Collaboration presence (for real-time features)
export interface CollaboratorPresence {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  color: string; // Assigned color for highlights
  cursor?: {
    x: number;
    y: number;
    sectionId?: string;
  };
  selection?: {
    sectionId: string;
    startOffset: number;
    endOffset: number;
  };
  lastActiveAt: Date;
  isActive: boolean;
}

// Export formats
export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'json' | 'html';

// Share export options
export interface ShareExportOptions {
  format: ExportFormat;
  includeComments: boolean;
  includeAnalytics: boolean;
  includeMetadata: boolean;
  watermark?: string;
  password?: string; // PDF password protection
}
