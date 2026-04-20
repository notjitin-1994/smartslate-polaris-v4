'use client';

import { memo, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function resolveUserAvatarUrl(user: User | null): string | null {
  const meta: any = user?.user_metadata ?? {};
  if (meta.noAvatar === true) return null;

  // PRIORITY 1: Check user metadata for avatar URL (updated by upload process)
  if (meta.avatar_url) return meta.avatar_url;

  // PRIORITY 2: Check for avatar path in storage
  const avatarPath: string | undefined = meta.avatar_path;
  if (avatarPath) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.storage.from('public-assets').getPublicUrl(avatarPath);
      const url = data.publicUrl as string;
      if (url) return url;
    } catch {}
  }

  // PRIORITY 3: OAuth provider avatars
  const identities: any[] = (user as any)?.identities ?? [];
  const identityData = identities.find((i) => i?.identity_data)?.identity_data ?? {};
  return (
    (meta.avatarURL as string) ||
    (meta.avatar as string) ||
    (meta.picture as string) ||
    (identityData.avatar_url as string) ||
    (identityData.picture as string) ||
    null
  );
}

export function getUserInitial(user: User | null): string {
  const rawName =
    (user?.user_metadata?.first_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.email as string) ||
    'U';
  return rawName.toString().trim().charAt(0).toUpperCase();
}

interface UserAvatarProps {
  user: User | null;
  sizeClass: string;
  textClass?: string;
  avatarUrl?: string | null;
}

export const UserAvatar = memo(function UserAvatar({
  user,
  sizeClass,
  textClass = 'text-sm font-semibold text-foreground',
  avatarUrl: propAvatarUrl,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Use provided avatar URL or resolve from user metadata
  const avatarUrl = propAvatarUrl !== undefined ? propAvatarUrl : resolveUserAvatarUrl(user);
  const showImg = Boolean(avatarUrl) && !imgError;

  if (showImg) {
    return (
      <img
        src={avatarUrl as string}
        alt="User avatar"
        className={`${sizeClass} rounded-full object-cover shadow-sm`}
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        draggable="false"
      />
    );
  }

  return (
    <span
      className={`${sizeClass} bg-primary/10 inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200/30 ring-1 ring-neutral-200/20`}
    >
      <span className={textClass}>{getUserInitial(user)}</span>
    </span>
  );
});
