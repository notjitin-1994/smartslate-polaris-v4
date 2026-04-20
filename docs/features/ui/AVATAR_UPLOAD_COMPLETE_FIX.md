# Avatar Upload - Complete Fix

## Root Cause Analysis

The avatar images were uploading successfully to Supabase Storage but failing to render in the browser due to **incorrect Content-Type headers**.

### The Problem Chain

1. **File Upload**: Files were being uploaded to Supabase Storage
2. **Metadata Issue**: Files were stored with `content-type: application/json` instead of `image/png` or `image/jpeg`
3. **Browser Rejection**: When the browser tried to render `<img src="...">`, it received JSON content-type and failed to display

### Why This Happened

The Supabase Storage `upload()` method requires an explicit `contentType` parameter. Without it, the storage API defaults to `application/json` or another generic type.

**Original Code**:
```javascript
await supabase.storage.from('avatars').upload(fileName, file, {
  cacheControl: '3600',
  upsert: false,
  // Missing: contentType parameter!
});
```

## The Complete Solution

### Fix 1: Content-Type Inference with Fallback

Added a robust content-type detection function that:
1. Uses the browser's `file.type` if available
2. Falls back to extension-based inference (.png → image/png, .jpg → image/jpeg, etc.)
3. Has a final fallback to `application/octet-stream`

**Implementation** (`frontend/lib/hooks/useUserProfile.ts`):
```javascript
const getContentType = (file: File): string => {
  // First, try to use the file's MIME type
  if (file.type && file.type.trim() !== '') {
    return file.type;
  }

  // Fallback: infer from file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
};

const contentType = getContentType(file);

// Upload with explicit content type
await supabase.storage.from('avatars').upload(fileName, file, {
  cacheControl: '3600',
  upsert: false,
  contentType: contentType, // ✅ Always set
});
```

### Fix 2: RLS Policies for Remote Database

The Row-Level Security policies needed to specify roles explicitly:

**Run in Supabase Dashboard** (https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe/sql):

```sql
-- Clean up old policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars with their user ID" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;

-- Create proper policies with role specifications
CREATE POLICY "avatar_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

CREATE POLICY "avatar_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatar_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

CREATE POLICY "avatar_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';
```

### Fix 3: Improved Error Logging

Added comprehensive logging to debug upload issues:
```javascript
console.log('Uploading avatar:', {
  fileName,
  fileType: file.type,
  inferredContentType: contentType,
  fileSize: file.size
});
```

### Fix 4: Image Loading Error Handling

Improved the ProfileTab component to only log warnings when actual avatar URLs exist:
```javascript
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (profile?.avatar_url) {
    console.warn('Avatar image failed to load:', {
      src: e.currentTarget.src,
      avatarUrl: profile.avatar_url,
    });
  }
  setImageError(true);
};
```

## Testing Instructions

### Step 1: Restart Dev Server
```bash
# Kill the current dev server (Ctrl+C)
cd frontend
npm run dev
```

### Step 2: Hard Refresh Browser
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open DevTools → Right-click refresh → "Empty Cache and Hard Reload"

### Step 3: Upload New Avatar
1. Go to Settings → Profile tab
2. Click "Upload Photo"
3. Select an image (PNG, JPG, GIF, etc.)
4. Watch the browser console for logs

### Step 4: Verify Success
You should see in the console:
```
Uploading avatar: {fileName: "avatar_...", fileType: "image/png", inferredContentType: "image/png", fileSize: 12345}
Upload successful: {path: "avatar_...", id: "..."}
Avatar uploaded successfully: {fileName: "...", publicUrl: "https://..."}
Profile updated successfully
```

The avatar image should display immediately.

## Verification

Test that the file has correct content-type:
```bash
curl -I "https://oyjslszrygcajdpwgxbe.supabase.co/storage/v1/object/public/avatars/[YOUR_FILE_NAME]"
```

Should show:
```
content-type: image/png  # ✅ Correct
# NOT: content-type: application/json  # ❌ Wrong
```

## Files Modified

1. `frontend/lib/hooks/useUserProfile.ts` - Added content-type inference
2. `frontend/components/settings/tabs/ProfileTab.tsx` - Improved error handling
3. `supabase/migrations/20251112000002_fix_avatars_storage_rls.sql` - RLS policies
4. `supabase/REMOTE_FIX_AVATAR_RLS.sql` - Remote database fix script

## Why Previous Uploads Still Fail

Files uploaded BEFORE this fix have incorrect content-type metadata stored in Supabase. They cannot be retroactively fixed - you must re-upload them.

**Old files**: `content-type: application/json` ❌
**New files**: `content-type: image/png` ✅

## Summary

✅ Content-Type is now explicitly set with intelligent fallback
✅ RLS policies properly configured with role specifications
✅ Comprehensive logging for debugging
✅ Error handling only logs when actual errors occur
✅ Works with any image format (PNG, JPG, GIF, WebP, etc.)

The avatar upload system is now production-ready!
