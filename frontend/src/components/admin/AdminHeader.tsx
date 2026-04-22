'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, LogOut, X } from 'lucide-react';
import type { AdminUser } from '@/lib/auth/adminAuth';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';

interface AdminHeaderProps {
  user: AdminUser;
  onMenuToggle?: () => void;
}

export default function AdminHeader({ user, onMenuToggle }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  if (!isMounted) {
    return (
      <header className="sticky top-0 z-20 h-16 border-b border-white/10 bg-[#0d1b2a]/95 backdrop-blur-xl" />
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d1b2a]/95 px-4 backdrop-blur-xl md:px-6">
      {/* Left Section */}
      <div className="flex flex-1 items-center gap-3">
        {/* Hamburger Menu (Mobile/Tablet) */}
        {!isDesktop && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Search Bar */}
        <div
          className={`relative flex-1 transition-all duration-200 ${
            isMobile && searchFocused
              ? 'absolute top-0 right-0 left-0 z-10 h-16 bg-[#0d1b2a] px-4'
              : 'max-w-md'
          }`}
        >
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
          <input
            type="text"
            placeholder={isMobile ? 'Search...' : 'Search users, blueprints, logs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="h-10 w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-10 pl-10 text-sm text-white placeholder-[#7a8a8b] transition-all focus:border-[#a7dadb]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#7a8a8b] hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#7a8a8b] transition-colors hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0d1b2a]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Real-time Notifications Panel */}
          <NotificationPanel
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            panelRef={notificationsRef}
          />
        </div>

        {/* User Menu - Hidden on mobile, shown on tablet+ */}
        {!isMobile && (
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium text-white">{user.full_name || 'Admin User'}</div>
              <div className="text-xs text-[#7a8a8b]">Developer</div>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/20 to-[#4f46e5]/20 transition-transform hover:scale-105 focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none">
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
            </button>
          </div>
        )}

        {/* Logout - Desktop only, shown in mobile menu on mobile */}
        {isDesktop && (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#7a8a8b] transition-colors hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
