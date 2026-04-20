/**
 * Share Feature Integration Example
 * This file demonstrates how to integrate the world-class share system
 * into your blueprint pages or any other content
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareDialog } from './ShareDialog';
import { ShareAnalyticsDashboard } from './ShareAnalyticsDashboard';
import { ShareLinkManager } from './ShareLinkManager';
import type { ShareLink } from '@/types/share';
import { Share2, BarChart3, Settings, Shield, Zap } from 'lucide-react';

/**
 * Example 1: Simple Share Button
 * Add this to any blueprint page to enable basic sharing
 */
export function SimpleShareButton({
  blueprintId,
  blueprintTitle,
}: {
  blueprintId: string;
  blueprintTitle: string;
}) {
  return (
    <ShareDialog
      blueprintId={blueprintId}
      blueprintTitle={blueprintTitle}
      trigger={
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      }
    />
  );
}

/**
 * Example 2: Share Button with Custom Trigger
 * Use a custom styled trigger for the share dialog
 */
export function CustomShareButton({
  blueprintId,
  blueprintTitle,
}: {
  blueprintId: string;
  blueprintTitle: string;
}) {
  const [shareCount, setShareCount] = useState(0);

  return (
    <ShareDialog
      blueprintId={blueprintId}
      blueprintTitle={blueprintTitle}
      onShareCreated={() => setShareCount((count) => count + 1)}
      trigger={
        <div className="relative inline-block">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Zap className="mr-2 h-5 w-5" />
            Share Blueprint
          </Button>
          {shareCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {shareCount}
            </span>
          )}
        </div>
      }
    />
  );
}

/**
 * Example 3: Full Share Management Panel
 * Complete share management interface with analytics
 */
export function FullSharePanel({
  blueprintId,
  blueprintTitle,
}: {
  blueprintId: string;
  blueprintTitle: string;
}) {
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Share & Analytics</h2>
        <ShareDialog blueprintId={blueprintId} blueprintTitle={blueprintTitle} />
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links">
            <Share2 className="mr-2 h-4 w-4" />
            Share Links
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links">
          <ShareLinkManager blueprintId={blueprintId} blueprintTitle={blueprintTitle} />
        </TabsContent>

        <TabsContent value="analytics">
          {selectedShareId ? (
            <ShareAnalyticsDashboard shareId={selectedShareId} />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>Select a share link from the Links tab to view analytics</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Share Settings</h3>
            <p className="text-gray-600">Configure default settings for new share links</p>
            {/* Add settings configuration here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example 4: Share with Real-time Updates
 * Shows live view count and engagement metrics
 */
export function ShareWithLiveMetrics({
  blueprintId,
  blueprintTitle,
}: {
  blueprintId: string;
  blueprintTitle: string;
}) {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [activeViewers, setActiveViewers] = useState(0);

  // In a real implementation, you would use WebSocket or polling for real-time updates
  // For now, this is a placeholder

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Share Performance</h3>
          <p className="text-sm text-gray-600">Real-time sharing metrics</p>
        </div>
        <ShareDialog
          blueprintId={blueprintId}
          blueprintTitle={blueprintTitle}
          existingShares={shares}
          onShareCreated={(share) => setShares([...shares, share])}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-500">Total Shares</p>
          <p className="text-2xl font-bold">{shares.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold">{totalViews}</p>
        </div>
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-500">Active Viewers</p>
          <p className="text-2xl font-bold text-green-600">{activeViewers}</p>
        </div>
      </div>

      {shares.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Active Share Links</h4>
          {shares.slice(0, 3).map((share) => (
            <div key={share.id} className="flex items-center justify-between rounded bg-white p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">{share.permissionLevel}</span>
                <span className="text-xs text-gray-500">• {share.viewCount} views</span>
              </div>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Integration with Blueprint Page
 * This shows how to integrate sharing into your existing blueprint page
 */
export function BlueprintPageWithSharing() {
  // This would typically come from your blueprint data
  const blueprint = {
    id: 'example-blueprint-id',
    title: 'Advanced Learning Blueprint',
    content: 'Blueprint content here...',
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Blueprint Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{blueprint.title}</h1>
            <p className="text-gray-600">Created on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button variant="outline">Export</Button>
            <Button variant="outline">Print</Button>
            <ShareDialog blueprintId={blueprint.id} blueprintTitle={blueprint.title} />
          </div>
        </div>
      </div>

      {/* Blueprint Content */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="prose max-w-none">{blueprint.content}</div>
      </div>

      {/* Share Management Section */}
      <FullSharePanel blueprintId={blueprint.id} blueprintTitle={blueprint.title} />
    </div>
  );
}

/**
 * Usage Instructions:
 *
 * 1. Simple Integration:
 *    Import SimpleShareButton and add to any page:
 *    <SimpleShareButton blueprintId={id} blueprintTitle={title} />
 *
 * 2. Custom Styling:
 *    Use CustomShareButton for branded share buttons
 *
 * 3. Full Management:
 *    Use FullSharePanel for complete share management
 *
 * 4. Analytics Only:
 *    Import ShareAnalyticsDashboard directly for analytics view
 *
 * 5. Link Management:
 *    Import ShareLinkManager for managing multiple share links
 *
 * Features Included:
 * - Password-protected shares
 * - Time-limited shares
 * - View count limits
 * - Custom slugs for pretty URLs
 * - Email verification
 * - Domain restrictions
 * - QR code generation
 * - Social media sharing
 * - Comprehensive analytics
 * - Real-time tracking
 * - Export capabilities
 * - Permission levels (view, comment, edit)
 * - Rate limiting
 * - Security features
 *
 * The share system is fully compatible with:
 * - Next.js 15 App Router
 * - Supabase RLS policies
 * - TypeScript strict mode
 * - WCAG AA accessibility standards
 */
