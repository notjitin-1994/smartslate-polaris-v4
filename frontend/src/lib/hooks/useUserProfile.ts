'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client-fixed';
import type { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create it using the secure database function
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            '';
          const nameParts = displayName.split(' ').filter(Boolean);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Use the SECURITY DEFINER function to create profile safely
          const { data: newProfile, error: createError } = await supabase.rpc(
            'create_user_profile',
            {
              p_user_id: user.id,
              p_full_name: displayName,
              p_first_name: firstName,
              p_last_name: lastName,
              p_avatar_url: null,
            }
          );

          if (createError) {
            console.error('Failed to create profile:', createError.message);
            throw new Error(`Failed to create profile: ${createError.message}`);
          }

          setProfile(newProfile);
        } else {
          console.error('Profile fetch error:', fetchError.message);
          throw new Error(`Failed to fetch profile: ${fetchError.message}`);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('Profile fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user?.id || !profile) {
        throw new Error('User not authenticated or profile not loaded');
      }

      try {
        setError(null);
        const supabase = getSupabaseBrowserClient();

        const { data, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error updating user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to update profile');
        throw err;
      }
    },
    [user?.id, profile]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        const supabase = getSupabaseBrowserClient();

        // Create a unique filename (flatten structure to avoid folder issues)
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;

        // Delete old avatar if it exists
        if (profile?.avatar_url) {
          try {
            // Extract filename from URL - handle both old folder structure and new flat structure
            const urlParts = profile.avatar_url.split('/avatars/');
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0]; // Remove query params
              await supabase.storage.from('avatars').remove([oldFileName]);
              console.log('Deleted old avatar:', oldFileName);
            }
          } catch (deleteError) {
            console.warn('Failed to delete old avatar (non-critical):', deleteError);
            // Continue with upload even if delete fails
          }
        }

        // Determine content type - ensure it's NEVER empty
        const getContentType = (file: File): string => {
          // First, try to use the file's MIME type
          if (file.type && file.type.trim() !== '') {
            return file.type;
          }

          // Fallback: infer from file extension
          const ext = file.name.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            bmp: 'image/bmp',
            ico: 'image/x-icon',
          };

          return mimeTypes[ext || ''] || 'application/octet-stream';
        };

        const contentType = getContentType(file);

        // Upload file to Supabase Storage
        console.log('Uploading avatar:', {
          fileName,
          fileType: file.type,
          inferredContentType: contentType,
          fileSize: file.size,
        });
        console.log('Auth state:', { userId: user.id, isAuthenticated: !!user });

        // Use direct HTTP upload to ensure content-type is set correctly
        // The Supabase JS SDK has issues with contentType parameter
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }

        // Get the current session token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        // Upload using fetch with proper content-type header
        const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${fileName}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': contentType,
            'x-upsert': 'false',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(
            `Upload failed: ${uploadResponse.statusText} - ${JSON.stringify(errorData)}`
          );
        }

        const uploadData = await uploadResponse.json();

        console.log('Upload response:', { data: uploadData, error: null });
        console.log('Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

        if (!urlData.publicUrl) {
          console.error('Failed to get public URL');
          throw new Error('Failed to get public URL for uploaded avatar');
        }

        console.log('Avatar uploaded successfully:', {
          fileName,
          publicUrl: urlData.publicUrl,
        });

        // Update profile with new avatar URL
        console.log('Updating profile with new avatar URL:', urlData.publicUrl);
        await updateProfile({ avatar_url: urlData.publicUrl });
        console.log('Profile updated successfully');

        // Also update user metadata for immediate access
        if (user) {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.updateUser({
            data: { avatar_url: urlData.publicUrl },
          });
        }

        return urlData.publicUrl;
      } catch (err) {
        console.error('Error uploading avatar:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        throw err;
      }
    },
    [user?.id, updateProfile]
  );

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [user?.id]); // Use user.id directly instead of fetchProfile function

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  };
}
