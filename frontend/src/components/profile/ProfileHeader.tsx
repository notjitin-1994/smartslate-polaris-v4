'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, TrendingUp, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { getTierInfo } from '@/lib/utils/tierDisplay';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useToast } from '@/components/ui/toast';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface ProfileHeaderProps {
  user: User | null;
  profile: UserProfile | null;
}

/**
 * ProfileHeader - Modern, minimalist profile identity card
 * Features:
 * - User avatar/initials (circular) with direct upload capability
 * - Full name and email
 * - Subscription tier badge with brand colors
 * - Member since date
 * - Quick usage stats (compact)
 */
export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const { uploadAvatar } = useUserProfile();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Update avatar version when URL changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarVersion((prev) => prev + 1);
      setImageError(false); // Reset error when new avatar loads
    }
  }, [profile?.avatar_url]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await uploadAvatar(file);
        showSuccess('Success', 'Profile photo updated successfully');
      } catch (error) {
        console.error('Avatar upload failed:', error);
        showError('Upload Failed', 'There was an error uploading your photo.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = profile?.first_name || user.user_metadata?.first_name || '';
    const lastName = profile?.last_name || user.user_metadata?.last_name || '';
    if (firstName || lastName) {
      const firstInitial = firstName.charAt(0) || '';
      const lastInitial = lastName.charAt(0) || '';
      return `${firstInitial}${lastInitial}`.toUpperCase();
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
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={handleAvatarClick}>
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center overflow-hidden rounded-full',
                  'border-primary-accent/30 border-2 transition-all duration-300',
                  'group-hover:border-primary-accent group-hover:scale-105',
                  !shouldShowAvatar && 'bg-gradient-to-br',
                  !shouldShowAvatar && tierInfo.color,
                  'shadow-lg group-hover:shadow-primary-accent/20'
                )}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Saving</span>
                  </div>
                ) : shouldShowAvatar ? (
                  <img
                    key={avatarVersion}
                    src={`${profile.avatar_url}?v=${avatarVersion}`}
                    alt={`${profile.first_name || 'User'} avatar`}
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-40"
                    onError={handleImageError}
                  />
                ) : (
                  <span className="text-3xl font-bold text-white transition-opacity duration-300 group-hover:opacity-40">{getUserInitials()}</span>
                )}

                {/* Hover Overlay */}
                {!isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-primary-accent/20 rounded-full p-2 backdrop-blur-sm border border-white/30">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Online indicator */}
              <div className="bg-success border-background-paper absolute right-0 bottom-0 h-6 w-6 rounded-full border-4 shadow-sm" />

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
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
