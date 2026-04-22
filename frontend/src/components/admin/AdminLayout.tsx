/**
 * AdminLayout Component
 * Responsive layout wrapper for admin pages
 * Coordinates AdminSidebar and AdminHeader with mobile menu state
 */

'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import type { AdminUser } from '@/lib/auth/adminAuth';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { NotificationProvider } from '@/contexts/NotificationContext';

interface AdminLayoutProps {
  user: AdminUser;
  children: React.ReactNode;
}

export default function AdminLayout({ user, children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDesktop } = useMediaQuery();

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (isDesktop) {
      setMobileMenuOpen(false);
    }
  }, [isDesktop]);

  return (
    <NotificationProvider>
      <div className="relative flex min-h-screen w-full bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b]">
        {/* Sidebar */}
        <AdminSidebar
          user={user}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex min-h-screen w-full flex-col lg:pl-64">
          {/* Header */}
          <AdminHeader user={user} onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
