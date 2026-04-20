'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Brand } from '@/components/layout/Brand';
import { UserAvatar } from '@/components/layout/UserAvatar';
import {
  IconSidebarToggle,
  IconApps,
  IconEye,
  IconSun,
  IconLogout,
  IconSettings,
} from '@/components/layout/icons';

interface SidebarProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false); // Default to expanded
  const [isMounted, setIsMounted] = useState(false);

  // Load state from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    // Load sidebar collapsed state
    try {
      const stored = localStorage.getItem('portal:sidebarCollapsed');
      if (stored) {
        setSidebarCollapsed(stored === '1');
      }
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('portal:sidebarCollapsed', sidebarCollapsed ? '1' : '0');
    } catch {}
  }, [sidebarCollapsed, isMounted]);

  // Add keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getFirstName = (): string => {
    const rawName =
      (user?.user_metadata?.first_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.full_name as string) ||
      (user?.email as string) ||
      'User';
    return rawName.toString().trim().split(' ')[0];
  };

  const getCapitalizedFirstName = (): string => {
    const name = getFirstName();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const collapsedQuickItems = [
    { title: 'Dashboard', icon: IconApps, path: '/' },
    { title: 'Explore', icon: IconEye, path: '/explore', badge: 'Coming Soon', disabled: true },
    { title: 'Learning', icon: IconSun, path: '/learning', badge: 'Coming Soon', disabled: true },
  ];

  const productLinks = [
    {
      name: 'Constellation',
      path: '/constellation',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
    },
    { name: 'Nova', path: '/nova', badge: 'Coming Soon', badgeType: 'soon' as const },
    { name: 'Orbit', path: '/orbit', badge: 'Coming Soon', badgeType: 'soon' as const },
    { name: 'Spectrum', path: '/spectrum', badge: 'Coming Soon', badgeType: 'soon' as const },
  ];

  return (
    <aside
      className={`hidden h-full min-h-0 flex-col md:flex ${sidebarCollapsed ? 'md:w-16 lg:w-16' : 'md:w-72 lg:w-80'} bg-surface shadow-sm backdrop-blur-xl transition-all duration-300 ease-out`}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Header with Brand & Toggle */}
      <div
        className={` ${sidebarCollapsed ? 'px-2 py-3' : 'px-6 py-5'} flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} bg-surface/80 sticky top-0 z-20 backdrop-blur-sm`}
      >
        {!sidebarCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <Brand />
          </div>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`group text-text-secondary hover:text-foreground hover:bg-foreground/5 active:bg-foreground/10 focus-visible:ring-secondary/50 relative flex items-center justify-center rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-9'}`}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconSidebarToggle
            className={`h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation Content */}
      {!sidebarCollapsed && (
        // Expanded View: Full Navigation
        <nav
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4"
          aria-label="Primary navigation"
        >
          {/* Quick Access Section */}
          <div className="space-y-1.5">
            <h2 className="text-primary mb-2 px-3 text-[5px] font-bold tracking-wider uppercase">
              Quick Access
            </h2>
            {collapsedQuickItems.map(({ title, icon: Icon, path, badge, disabled }) => {
              const isActive = pathname === path;
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => !disabled && router.push(path)}
                  disabled={disabled}
                  className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : disabled
                        ? 'text-text-disabled cursor-not-allowed'
                        : 'text-text-secondary hover:text-foreground hover:bg-foreground/5 active:scale-[0.98]'
                  } `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-left">{title}</span>
                  {badge && (
                    <span className="border-primary/40 bg-primary/10 text-primary shadow-primary/20 inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200">
                      {badge}
                    </span>
                  )}
                  {isActive && !disabled && (
                    <div className="bg-primary absolute top-1/2 right-0 h-8 w-1 -translate-y-1/2 rounded-l-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Product Links */}
          <div className="space-y-1">
            <h2 className="text-primary mb-2 px-3 text-[5px] font-bold tracking-wider uppercase">
              Explore Suite
            </h2>
            {productLinks.map(({ name, path, badge, badgeType }) => {
              const isActive = pathname === path;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => router.push(path)}
                  disabled={badgeType === 'soon'}
                  className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : badgeType === 'soon'
                        ? 'text-text-disabled cursor-not-allowed'
                        : 'text-text-secondary hover:text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]'
                  } `}
                >
                  <span className="flex-1 truncate text-left">{name}</span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                      badgeType === 'soon'
                        ? 'border-primary/40 bg-primary/10 text-primary shadow-primary/20 shadow'
                        : 'text-text-disabled border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                    } `}
                  >
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Footer Section */}
      <div className="bg-surface/50 mt-auto w-full flex-shrink-0 backdrop-blur-sm">
        {sidebarCollapsed ? (
          // Collapsed Footer - Subscribe and Logout Buttons
          <div className="flex flex-col items-center space-y-2 px-2 py-3">
            {/* Subscribe Button - Collapsed */}
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              title="Subscribe to Polaris"
              aria-label="Subscribe to Polaris"
              className="group hover:shadow-secondary/25 focus-visible:ring-secondary/50 bg-secondary hover:bg-secondary/90 relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
            >
              <svg
                className="text-secondary-foreground h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            {/* Logout Button - Collapsed */}
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 transition-all duration-200 hover:bg-red-700 hover:shadow-red-500/25 focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 active:scale-95"
            >
              <IconLogout className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          // Expanded Footer
          <div className="space-y-2 px-4 py-4">
            {/* Subscribe Button - Expanded */}
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="group hover:shadow-secondary/20 focus-visible:ring-secondary/50 bg-secondary hover:bg-secondary/90 relative w-full overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2 px-4 py-2.5">
                <svg
                  className="text-secondary-foreground h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-secondary-foreground text-sm font-semibold">
                  Subscribe to Polaris
                </span>
              </div>
            </button>

            {/* Divider below subscribe removed per request; keep profile divider intact above */}

            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="group hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <div className="relative">
                <UserAvatar user={user} sizeClass="w-9 h-9" textClass="text-sm font-bold" />
                <div className="bg-success border-surface absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-foreground truncate text-sm font-semibold">
                  {getCapitalizedFirstName()}
                </p>
                <p className="text-text-secondary truncate text-xs">{user?.email}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="group text-text-secondary hover:text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <IconSettings className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Settings</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="group text-text-secondary hover:text-error hover:bg-error/5 focus-visible:ring-error/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <IconLogout className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
