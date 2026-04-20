/**
 * Avatar Management API Route
 * Handles avatar upload and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/account/avatar
 * Delete user's avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current avatar URL from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract file path from URL if it's a Supabase storage URL
      const storageMatch = profile.avatar_url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);

      if (storageMatch) {
        const filePath = storageMatch[1];

        // Delete from storage
        const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath]);

        if (deleteError) {
          console.error('Failed to delete avatar from storage:', deleteError);
          // Continue anyway to remove the URL from profile
        }
      }
    }

    // Remove avatar URL from profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete avatar', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/avatar
 * Upload new avatar
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided', code: 'NO_FILE' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      const storageMatch = profile.avatar_url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
      if (storageMatch) {
        await supabase.storage.from('avatars').remove([storageMatch[1]]);
      }
    }

    // Upload new avatar
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload avatar:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar', code: 'UPLOAD_FAILED' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: publicUrl,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile with avatar URL:', updateError);
      // Try to clean up uploaded file
      await supabase.storage.from('avatars').remove([uploadData.path]);
      return NextResponse.json(
        { error: 'Failed to update profile', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
    });
  } catch (error) {
    console.error('Avatar POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
