'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { getTierInfo } from '@/lib/utils/tierDisplay';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface ProfileHeaderProps {
  user: User | null;
  profile: UserProfile | null;
}

/**
 * ProfileHeader - Modern, minimalist profile identity card
 * Features:
 * - User avatar/initials (circular)
 * - Full name and email
 * - Subscription tier badge with brand colors
 * - Member since date
 * - Quick usage stats (compact)
 */
export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Update avatar version when URL changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarVersion((prev) => prev + 1);
      setImageError(false); // Reset error when new avatar loads
    }
  }, [profile?.avatar_url]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = profile?.first_name || user.user_metadata?.first_name || '';
    const lastName = profile?.last_name || user.user_metadata?.last_name || '';
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Avatar image failed to load in ProfileHeader:', {
      src: e.currentTarget.src,
      error: e.type,
    });
    setImageError(true);
  };

  // Determine if we should show the avatar image
  const shouldShowAvatar = profile?.avatar_url && !imageError;

  // Format join date
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Get tier info for badge styling
  const tierInfo = getTierInfo(profile?.subscription_tier);

  // Calculate usage percentage
  const usagePercentage =
    profile?.blueprint_creation_limit && profile.blueprint_creation_limit > 0
      ? Math.round((profile.blueprint_creation_count / profile.blueprint_creation_limit) * 100)
      : 0;

  return (
    <div className="mb-8">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/dashboard"
          className={cn(
            'mb-6 inline-flex items-center gap-2',
            'text-text-secondary hover:text-primary-accent',
            'transition-colors duration-200',
            'text-caption font-medium',
            'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            'rounded-lg px-2 py-1'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Profile Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <GlassCard className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center overflow-hidden rounded-full',
                  'border-primary-accent/30 border-2',
                  !shouldShowAvatar && 'bg-gradient-to-br',
                  !shouldShowAvatar && tierInfo.color,
                  'shadow-lg'
                )}
              >
                {shouldShowAvatar ? (
                  <img
                    key={avatarVersion}
                    src={`${profile.avatar_url}?v=${avatarVersion}`}
                    alt={`${profile.first_name || 'User'} avatar`}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{getUserInitials()}</span>
                )}
              </div>
              {/* Online indicator */}
              <div className="bg-success border-background-paper absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2" />
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              {/* Name */}
              <h1 className="text-title text-text-primary md:text-display font-bold">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </h1>

              {/* Email */}
              <p className="text-body text-text-secondary">{user?.email}</p>

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Member Since */}
                <div className="text-text-secondary flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-caption">Joined {joinDate}</span>
                </div>

                {/* Tier Badge */}
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
                    'border border-teal-500/30 bg-gradient-to-r from-teal-500 to-cyan-500',
                    'shadow-sm'
                  )}
                >
                  <span className="text-caption font-semibold text-white">
                    {tierInfo.displayName}
                  </span>
                </div>

                {/* Quick Usage */}
                <div className="text-text-secondary flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-caption">
                    {profile?.blueprint_creation_count || 0}/
                    {profile?.blueprint_creation_limit || 0} Blueprints • {usagePercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
