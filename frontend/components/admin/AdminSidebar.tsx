'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  Bell,
  FileText,
  Database,
  ScrollText,
  X,
} from 'lucide-react';
import type { AdminUser } from '@/lib/auth/adminAuth';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface AdminSidebarProps {
  user: AdminUser;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Alerts', href: '/admin/alerts', icon: Bell },
  { label: 'Cost Monitoring', href: '/admin/costs', icon: DollarSign },
  { label: 'Database', href: '/admin/database', icon: Database },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
];

export default function AdminSidebar({ user, isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if ((isMobile || isTablet) && onClose && isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if ((isMobile || isTablet) && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isTablet, isOpen]);

  const handleNavClick = () => {
    if ((isMobile || isTablet) && onClose) {
      onClose();
    }
  };

  // SSR-safe rendering
  if (!isMounted) {
    return null;
  }

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-6">
        <Link href="/admin" className="flex items-center space-x-2" onClick={handleNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/30 to-[#4f46e5]/30 shadow-sm">
            <Shield className="h-5 w-5 text-[#a7dadb]" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-white">Admin Dashboard</div>
            <div className="text-xs text-[#b0c5c6]">Polaris v3</div>
          </div>
        </Link>

        {/* Close button for mobile and tablet */}
        {!isDesktop && onClose && (
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 md:px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={`group flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border border-[#a7dadb]/30 bg-gradient-to-r from-[#a7dadb]/20 to-[#4f46e5]/20 text-white shadow-sm'
                      : 'border border-transparent text-[#b0c5c6] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#a7dadb]' : 'text-[#7a8a8b] group-hover:text-[#b0c5c6]'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full border border-[#a7dadb]/30 bg-[#a7dadb]/20 px-2 py-0.5 text-xs font-medium text-[#a7dadb]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3 md:p-4">
        <div className="flex min-h-[44px] items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/20 to-[#4f46e5]/20">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-[#a7dadb]">
                {user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium text-white">
              {user.full_name || 'Admin User'}
            </div>
            <div className="truncate text-xs text-[#7a8a8b]">{user.email}</div>
          </div>
        </div>
      </div>
    </>
  );

  // Desktop: Fixed sidebar - Revamped with Framer Motion
  if (isDesktop) {
    return (
      <motion.aside 
        initial={false}
        animate={{ 
          width: isOpen ? 256 : 80, // Using isOpen as a proxy for expanded/collapsed in admin context if needed, 
                                    // but admin sidebar is usually fixed width. 
                                    // Looking at the code, admin doesn't seem to have a collapsed state yet.
                                    // I will maintain its fixed width for now but wrap it in motion for consistency
                                    // and prepared for future collapse feature.
          transition: { type: 'spring', stiffness: 300, damping: 35 }
        }}
        className="fixed top-0 left-0 z-30 flex h-screen h-[100dvh] w-64 flex-col border-r border-white/10 bg-[#0d1b2a]/95 backdrop-blur-xl overflow-hidden"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex h-full flex-col"
        >
          {sidebarContent}
        </motion.div>
      </motion.aside>
    );
  }

  // Mobile/Tablet: Slide-out drawer
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 z-50 flex h-screen h-[100dvh] w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1b2a]/98 shadow-2xl backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
