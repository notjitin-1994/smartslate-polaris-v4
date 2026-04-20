'use client';

import { memo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function resolveUserAvatarUrl(user: User | null): string | null {
  const meta: any = user?.user_metadata ?? {};
  if (meta.noAvatar === true) return null;

  // Prefer stored avatar in Supabase storage if available
  const avatarPath: string | undefined = meta.avatar_path;
  if (avatarPath) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.storage.from('public-assets').getPublicUrl(avatarPath);
      const url = data.publicUrl as string;
      if (url) return url;
    } catch {}
  }

  const identities: any[] = (user as any)?.identities ?? [];
  const identityData = identities.find((i) => i?.identity_data)?.identity_data ?? {};
  return (
    (meta.avatar_url as string) ||
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
}

export const UserAvatar = memo(function UserAvatar({
  user,
  sizeClass,
  textClass = 'text-sm font-semibold text-foreground',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = resolveUserAvatarUrl(user);
  const showImg = Boolean(avatarUrl) && !imgError;

  if (showImg) {
    return (
      <img
        src={avatarUrl as string}
        alt="User avatar"
        className={`${sizeClass} bg-background rounded-full border-2 border-neutral-200/30 object-cover ring-1 ring-neutral-200/20 transition-all duration-200`}
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
