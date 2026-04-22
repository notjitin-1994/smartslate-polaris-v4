'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

type ProtectedRouteProps = { children: React.ReactNode };

export default function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      const url = new URL('/login', window.location.origin);
      url.searchParams.set('redirect', pathname ?? '/');
      router.replace(url.toString());
    }
  }, [loading, user, router, pathname]);

  if (loading) return <div className="p-4">Checking authentication...</div>;
  if (!user) return <div className="p-4">Redirecting...</div>;
  return <>{children}</>;
}
