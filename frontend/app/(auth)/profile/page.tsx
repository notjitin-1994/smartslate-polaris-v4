'use client';

import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { UsageOverview } from '@/components/profile/UsageOverview';
import { AccountInfoSection } from '@/components/profile/AccountInfoSection';
import { ActivitySection } from '@/components/profile/ActivitySection';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

/**
 * ProfilePage - Revamped minimalist user profile page
 *
 * Design Principles:
 * - Minimalist & modern aesthetic
 * - Glassmorphism design (Smartslate Polaris brand)
 * - Progressive disclosure (advanced features collapsed)
 * - Mobile-responsive layout
 * - WCAG AA accessibility compliance
 *
 * Layout Structure:
 * 1. ProfileHeader - Identity card with avatar, name, tier badge, quick stats
 * 2. UsageOverview - Visual progress bars for blueprint limits
 * 3. AccountInfoSection - Simplified 3-card account details + quick actions
 * 4. ActivitySection - Streamlined timeline (last 3 activities)
 * 5. SettingsSection - Collapsible (notifications + privacy controls)
 *
 * Key Improvements from Previous Version:
 * - Removed ProfileSection component (consolidated into ProfileHeader)
 * - Simplified from 6 account cards to 3 essential cards
 * - Reduced activity stats from 4 to timeline-only view
 * - Collapsed notification/privacy sections by default
 * - Better visual hierarchy with ample spacing
 * - Smoother, purposeful animations
 * - Enhanced mobile responsiveness
 */
function ProfileContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8">
      {/* Profile Header - Identity Card */}
      <ProfileHeader user={user} profile={profile} />

      {/* Main Content - Stacked Layout */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-6"
      >
        {/* Usage Dashboard */}
        <UsageOverview profile={profile} loading={profileLoading} />

        {/* Account Details */}
        <AccountInfoSection />

        {/* Recent Activity */}
        <ActivitySection />

        {/* Settings & Privacy (Collapsed) */}
        <SettingsSection />
      </motion.main>
    </div>
  );
}

/**
 * ProfilePage - Protected profile route
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
