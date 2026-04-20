-- Run this in Supabase Dashboard SQL Editor
-- Check avatars bucket configuration

SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  avif_autodetection
FROM storage.buckets
WHERE id = 'avatars';

-- Check if there's any metadata on the uploaded files
SELECT
  name,
  metadata,
  created_at
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 5;
