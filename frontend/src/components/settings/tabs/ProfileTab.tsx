'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

/**
 * ProfileTab - Simplified profile information editing
 * Focuses only on essential fields: avatar, name
 */
export function ProfileTab() {
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar, refreshProfile } = useUserProfile();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  // Sync state with profile when it loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      // Reset image error when profile updates with a new avatar URL
      if (profile.avatar_url) {
        setImageError(false);
      }
    }
  }, [profile]);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            },
            file.type,
            0.95 // High quality JPEG/PNG compression
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please upload an image file');
      return;
    }

    // Validate file size (max 5MB before resize)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Please upload an image smaller than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Resize image to max 400x400 for optimal display and storage
      const resizedFile = await resizeImage(file, 400, 400);
      console.log('Image resized:', {
        originalSize: file.size,
        resizedSize: resizedFile.size,
        reduction: `${Math.round((1 - resizedFile.size / file.size) * 100)}%`,
      });

      await uploadAvatar(resizedFile);
      setImageError(false); // Reset error state on successful upload
      await refreshProfile(); // Refresh profile to get updated avatar URL
      setAvatarKey((prev) => prev + 1); // Force re-render of image
      toast.success('Success', 'Profile photo updated successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Upload Failed', 'Failed to update profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Only log if we actually have an avatar URL to avoid false errors
    if (profile?.avatar_url) {
      console.warn('Avatar image failed to load:', {
        src: e.currentTarget.src,
        avatarUrl: profile.avatar_url,
      });
    }
    setImageError(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error('Validation Error', 'First name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      toast.success('Saved', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Save Failed', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <User className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Profile Information</h3>
            <p className="text-caption text-text-secondary">
              Update your personal details and profile photo
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl shadow-md',
                  'from-primary/20 to-secondary/20 bg-gradient-to-br'
                )}
                style={{ border: '2px solid rgba(255, 255, 255, 0.1)' }}
              >
                {profile?.avatar_url && !imageError && profile.avatar_url.trim() !== '' ? (
                  <img
                    key={avatarKey}
                    src={`${profile.avatar_url}?v=${avatarKey}`}
                    alt={profile.full_name || 'User avatar'}
                    className="h-full w-full object-cover"
                    style={{
                      imageRendering: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                    }}
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  <User className="text-primary h-10 w-10" />
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* Avatar Actions */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-body text-foreground font-medium">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-caption text-text-secondary">{user?.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="secondary"
                    size="medium"
                    disabled={isUploading}
                    className="cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <p className="text-caption text-text-secondary">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-body text-foreground font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                size="large"
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-body text-foreground font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                size="large"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-body text-foreground font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              size="large"
              disabled
              readOnly
              className="cursor-not-allowed opacity-60"
            />
            <p className="text-caption text-text-secondary">
              Contact support to change your email address
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end border-t border-neutral-200/10 pt-6">
            <Button
              type="submit"
              variant="secondary"
              size="large"
              disabled={isSaving || !firstName.trim()}
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
        </form>
      </GlassCard>
    </motion.div>
  );
}
