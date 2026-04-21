'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  IconChevronRight,
} from '@/components/layout/icons';
import { useSidebar } from '@/contexts/SidebarContext';

interface SidebarProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
  const [solaraSuiteOpen, setSolaraSuiteOpen] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  if (!isMounted) return null;

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

  const quickAccessItems = [
    { title: 'Dashboard', icon: IconApps, path: '/' },
    { title: 'Explore', icon: IconEye, path: '/explore', badge: 'Soon', disabled: true },
    { title: 'Learning', icon: IconSun, path: '/learning', badge: 'Soon', disabled: true },
  ];

  const solaraSuiteLinks = [
    { name: 'Constellation', path: '/constellation', badge: 'Soon', badgeType: 'soon' as const },
    { name: 'Nova', path: '/nova', badge: 'Soon', badgeType: 'soon' as const },
    { name: 'Orbit', path: '/orbit', badge: 'Soon', badgeType: 'soon' as const },
    { name: 'Spectrum', path: '/spectrum', badge: 'Soon', badgeType: 'soon' as const },
  ];

  return (
    <aside
      className={`hidden h-screen flex-col md:flex fixed left-0 top-0 z-50 transition-all duration-300 ease-out border-r border-white/5 bg-surface/80 backdrop-blur-xl ${
        sidebarCollapsed ? 'w-16' : 'w-72 lg:w-80'
      }`}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Header with Brand & Toggle */}
      <div
        className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-6 py-5'} sticky top-0 z-20`}
      >
        {!sidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.3 }}
          >
            <Brand />
          </motion.div>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`group text-text-secondary hover:text-foreground hover:bg-foreground/5 p-2 rounded-lg transition-all ${
            sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-9'
          }`}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconSidebarToggle
            className={`h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        {!sidebarCollapsed ? (
          <nav className="px-4 py-4 space-y-6">
            {/* Quick Access Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => setQuickAccessOpen(!quickAccessOpen)}
                className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
              >
                <span className="!text-[10px] font-bold tracking-[0.2em] uppercase text-left">
                  Quick Access
                </span>
                <IconChevronRight 
                  className={`h-3 w-3 transition-transform duration-300 ${quickAccessOpen ? 'rotate-90' : ''}`} 
                />
              </button>
              <AnimatePresence initial={false}>
                {quickAccessOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1"
                  >
                    {quickAccessItems.map(({ title, icon: Icon, path, badge, disabled }) => {
                      const isActive = pathname === path;
                      return (
                        <button
                          key={title}
                          type="button"
                          onClick={() => !disabled && router.push(path)}
                          disabled={disabled}
                          className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                            isActive
                              ? 'bg-primary/10 text-primary shadow-sm font-bold'
                              : disabled
                                ? 'text-text-disabled cursor-not-allowed opacity-60'
                                : 'text-text-secondary hover:bg-white/5 hover:text-foreground active:scale-[0.98]'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 truncate text-left">{title}</span>
                          {badge && (
                            <span className="border-primary/40 bg-primary/10 text-primary shadow-primary/20 inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solara Suite Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => setSolaraSuiteOpen(!solaraSuiteOpen)}
                className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
              >
                <span className="!text-[10px] font-bold tracking-[0.2em] uppercase text-left">
                  Solara Suite
                </span>
                <IconChevronRight 
                  className={`h-3 w-3 transition-transform duration-300 ${solaraSuiteOpen ? 'rotate-90' : ''}`} 
                />
              </button>
              <AnimatePresence initial={false}>
                {solaraSuiteOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-1"
                  >
                    {solaraSuiteLinks.map(({ name, path, badge, badgeType }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => router.push(path)}
                        disabled={badgeType === 'soon'}
                        className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-text-secondary hover:text-foreground hover:bg-white/5 disabled:text-text-disabled disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <span className="truncate flex-1 text-left">{name}</span>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                            badgeType === 'soon'
                              ? 'border-neutral-700 bg-neutral-800 text-text-disabled'
                              : 'border-primary/40 bg-primary/10 text-primary shadow-primary/20 shadow'
                          }`}
                        >
                          {badge}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        ) : (
          <nav className="flex flex-col items-center space-y-4 py-6">
            {quickAccessItems.map(({ title, icon: Icon, path, disabled }) => {
              const isActive = pathname === path;
              return (
                <motion.div key={title} whileHover={{ x: 3 }}>
                  <button
                    type="button"
                    onClick={() => !disabled && router.push(path)}
                    disabled={disabled}
                    title={title}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(167,218,219,0.15)]' 
                        : disabled
                          ? 'text-text-disabled opacity-40 cursor-not-allowed'
                          : 'text-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </motion.div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-auto w-full p-4 relative z-10 border-t border-white/10 bg-surface/50 backdrop-blur-sm">
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-4 px-2 py-4">
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              title="Subscribe to Polaris"
              className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-white shadow-sm hover:bg-secondary/90 transition-all active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <UserAvatar user={user} sizeClass="w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 text-secondary hover:bg-secondary/10 active:scale-[0.98]"
            >
              <span className="truncate">Subscribe to Polaris</span>
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="group hover:bg-white/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="relative">
                <UserAvatar user={user} sizeClass="w-9 h-9" textClass="text-sm font-bold" />
                <div className="bg-success absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-foreground truncate text-sm font-semibold leading-tight">
                  {getCapitalizedFirstName()}
                </p>
                <p className="text-text-secondary truncate text-xs leading-tight mt-0.5">{user?.email}</p>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="group flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-white/5 rounded-lg transition-all active:scale-[0.98]"
              >
                <IconSettings className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">Settings</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="group flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-all active:scale-[0.98]"
              >
                <IconLogout className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
