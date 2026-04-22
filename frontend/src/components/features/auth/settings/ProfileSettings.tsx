'use client';

import { useState } from 'react';
import { SettingCard, SettingRow } from './SettingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, Save, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * ProfileSettings - User profile information management
 * Includes avatar upload, name fields, bio, and social links
 */
export function ProfileSettings() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('user@example.com');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  return (
    <section id="profile" className="scroll-mt-24">
      <SettingCard
        title="Profile Information"
        description="Update your personal details and how others see you on the platform"
      >
        {/* Avatar Upload */}
        <div className="space-y-4">
          <label className="text-body text-foreground font-medium">Profile Photo</label>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar Preview */}
            <div className="group relative">
              <div
                className={cn(
                  'h-24 w-24 overflow-hidden rounded-full',
                  'from-primary/20 to-secondary/20 bg-gradient-to-br',
                  'border-primary/30 border-2',
                  'flex items-center justify-center',
                  'transition-all duration-300',
                  'group-hover:border-primary/50 group-hover:shadow-primary/20 group-hover:shadow-lg'
                )}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="text-text-disabled h-10 w-10" />
                )}
              </div>

              {/* Remove button */}
              {avatarPreview && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleRemoveAvatar}
                  className={cn(
                    'absolute -top-2 -right-2',
                    'h-8 w-8 rounded-full',
                    'bg-error text-white',
                    'flex items-center justify-center',
                    'shadow-lg hover:shadow-xl',
                    'transition-all duration-200',
                    'hover:scale-110',
                    'focus-visible:ring-error focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  )}
                  aria-label="Remove profile photo"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <p className="text-caption text-text-secondary">
                Upload a photo to personalize your profile. JPG, PNG or GIF. Max size 5MB.
              </p>
              <div className="flex flex-wrap gap-3">
                <label htmlFor="avatar-upload">
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-4 py-2.5',
                      'bg-primary/10 text-primary border-primary/30 border',
                      'text-sm font-medium',
                      'hover:bg-primary/20 hover:border-primary/50',
                      'transition-all duration-200',
                      'cursor-pointer',
                      'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </span>
                </label>

                {avatarPreview && (
                  <Button variant="ghost" size="medium" onClick={handleRemoveAvatar} type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-body text-foreground font-medium">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="text-body text-foreground font-medium">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>
        </div>

        {/* Email (Read-only for display) */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-body text-foreground font-medium">
            Email Address
          </label>
          <Input id="email" type="email" value={email} disabled size="large" className="w-full" />
          <p className="text-caption text-text-secondary">
            Your email is managed in the Account section
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="text-body text-foreground font-medium">
            Bio
            <span className="text-text-disabled ml-2 font-normal">(Optional)</span>
          </label>
          <textarea
            id="bio"
            rows={4}
            placeholder="Tell us a bit about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={cn(
              'w-full rounded-lg px-4 py-3',
              'bg-background-surface border border-neutral-200/10',
              'text-body text-foreground',
              'placeholder:text-text-disabled',
              'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'transition-colors duration-200',
              'resize-none',
              'min-h-[120px]'
            )}
            maxLength={500}
          />
          <p className="text-caption text-text-secondary text-right">{bio.length}/500 characters</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t border-neutral-200/10 pt-4">
          <Button
            variant="primary"
            size="large"
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </SettingCard>
    </section>
  );
}
