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

        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

        if (!urlData.publicUrl) {
          throw new Error('Failed to get public URL for uploaded avatar');
        }

        // Update profile with new avatar URL
        await updateProfile({ avatar_url: urlData.publicUrl });

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
