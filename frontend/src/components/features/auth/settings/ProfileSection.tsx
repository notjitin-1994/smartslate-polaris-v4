'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, X, Upload, Calendar, Shield, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  full_name: z.string().optional(),
  preferences: z.any().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfileSection() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile, uploadAvatar } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      full_name: profile?.full_name || '',
      preferences: (profile?.preferences as Record<string, any>) || {},
    },
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        full_name: profile.full_name || '',
        preferences: (profile.preferences as Record<string, any>) || {},
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    if (!profile) return;

    setIsUpdating(true);
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        preferences: data.preferences,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        full_name: profile.full_name || '',
        preferences: (profile.preferences as Record<string, any>) || {},
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
        <p className="text-error mb-4">Failed to load profile: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <User className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-title text-foreground">Profile Information</h2>
            <p className="text-caption text-text-secondary">
              Manage your personal information and profile details
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="btn-primary">
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative">
              <div className="bg-primary/20 border-primary/30 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="text-primary h-12 w-12" />
                )}
              </div>
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-primary text-primary-foreground hover:bg-primary/80 absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div>
              <h3 className="text-heading text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-caption text-text-secondary">{profile?.user_role || 'User'}</p>
              <p className="text-caption text-text-secondary mt-1">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-body text-foreground mb-2 block">First Name</label>
                <Input
                  {...register('first_name')}
                  disabled={!isEditing || isUpdating}
                  className={errors.first_name ? 'border-error' : ''}
                />
                {errors.first_name && (
                  <p className="text-caption text-error mt-1">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="text-body text-foreground mb-2 block">Last Name</label>
                <Input
                  {...register('last_name')}
                  disabled={!isEditing || isUpdating}
                  className={errors.last_name ? 'border-error' : ''}
                />
                {errors.last_name && (
                  <p className="text-caption text-error mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Email Field (Read-only, managed through auth) */}
            <div>
              <label className="text-body text-foreground mb-2 block">Email Address</label>
              <Input value={user?.email || ''} disabled className="bg-surface/50" />
              <p className="text-caption text-text-secondary mt-1">
                Email is managed through your account settings
              </p>
            </div>

            {/* Role Display (Read-only, managed by admin) */}
            <div>
              <label className="text-body text-foreground mb-2 block">Current Role</label>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 border-primary/20 rounded-lg border px-3 py-2">
                  <span className="text-body text-primary font-medium capitalize">
                    {profile?.user_role || 'explorer'}
                  </span>
                </div>
                <p className="text-caption text-text-secondary">
                  Role is managed by administrators
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" disabled={isUpdating || isUploading} className="btn-primary">
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUpdating || isUploading}
                  className="btn-secondary"
                >
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </div>
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Additional Profile Information */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Details */}
        <GlassCard className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <Info className="text-primary h-5 w-5" />
            </div>
            <h3 className="text-heading text-foreground">Account Details</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">User ID</span>
              <span className="text-caption text-foreground font-mono">
                {profile?.user_id?.slice(0, 12)}...
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Full Name</span>
              <span className="text-caption text-foreground">
                {profile?.full_name || 'Not set'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Subscription Tier</span>
              <span className="text-caption text-foreground font-medium capitalize">
                {profile?.subscription_tier || 'explorer'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Account Created</span>
              <span className="text-caption text-foreground">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-body text-text-secondary">Last Updated</span>
              <span className="text-caption text-foreground">
                {profile?.updated_at
                  ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Role & Permissions */}
        <GlassCard className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <Shield className="text-primary h-5 w-5" />
            </div>
            <h3 className="text-heading text-foreground">Role & Permissions</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Current Role</span>
              <span className="text-caption text-foreground font-medium capitalize">
                {profile?.user_role || 'explorer'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Role Assigned At</span>
              <span className="text-caption text-foreground">
                {profile?.role_assigned_at
                  ? new Date(profile.role_assigned_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>

            {profile?.role_assigned_by && (
              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">Assigned By</span>
                <span className="text-caption text-foreground font-mono">
                  {profile.role_assigned_by.slice(0, 12)}...
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-neutral-200 py-3">
              <span className="text-body text-text-secondary">Blueprint Creation Limit</span>
              <span className="text-caption text-foreground font-medium">
                {profile?.blueprint_creation_limit || 0}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-body text-text-secondary">Blueprint Saving Limit</span>
              <span className="text-caption text-foreground font-medium">
                {profile?.blueprint_saving_limit || 0}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Preferences Section (if exists) */}
      {profile?.preferences &&
        typeof profile.preferences === 'object' &&
        Object.keys(profile.preferences).length > 0 && (
          <GlassCard className="mt-6 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-heading text-foreground">Preferences</h3>
            </div>

            <div className="space-y-3">
              {Object.entries(profile.preferences as Record<string, any>).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between border-b border-neutral-200 py-2 last:border-0"
                >
                  <span className="text-body text-text-secondary capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-caption text-foreground ml-4 text-right font-mono break-all">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
    </motion.div>
  );
}
