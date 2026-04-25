'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Brand } from './Brand';
import { UserAvatar } from './UserAvatar';
import { SubscriptionCTA } from './SubscriptionCTA';
import {
  IconSidebarToggle,
  IconApps,
  IconSun,
  IconLogout,
  IconSettings,
  IconMap,
  IconChevronRight,
} from './icons';
import { useBlueprintSidebar } from '@/contexts/BlueprintSidebarContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { BlueprintSidebarContent } from './BlueprintSidebarContent';
import { SettingsSidebarContent } from './SettingsSidebarContent';
import { DocumentationSidebarContent } from './DocumentationSidebarContent';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface SidebarProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  const [solaraSuiteExpanded, setSolaraSuiteExpanded] = useState(false);
  const [documentationExpanded, setDocumentationExpanded] = useState(false);
  const { isActiveBlueprintPage, blueprintData } = useBlueprintSidebar();
  const { profile } = useUserProfile();

  const isSettingsPage = pathname === '/settings';
  const isFeaturesPage =
    pathname === '/features' ||
    pathname === '/best-practices' ||
    pathname === '/recommended-workflow';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isFeaturesPage) {
      setQuickAccessExpanded(false);
      setSolaraSuiteExpanded(false);
      setDocumentationExpanded(true);
    } else {
      setQuickAccessExpanded(true);
      setSolaraSuiteExpanded(false);
      setDocumentationExpanded(false);
    }
  }, [pathname, isFeaturesPage]);

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
    if (profile?.first_name) return profile.first_name;
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

  const isAdmin = profile?.user_role === 'developer' || profile?.user_role === 'admin';

  const quickAccessItems = [
    { title: 'Dashboard', icon: IconApps, path: '/' },
    { title: 'My Starmaps', icon: IconMap, path: '/my-starmaps' },
    ...(isAdmin
      ? [
          {
            title: 'Admin',
            icon: IconSettings,
            path: '/admin',
            badge: 'Admin',
            badgeType: 'admin' as const,
            isExternal: true,
          },
        ]
      : []),
    {
      title: 'Solara Engine',
      icon: IconSun,
      path: 'https://solara.smartslate.io',
      isExternal: true,
    },
  ];

  const solaraSuiteLinks = [
    { name: 'Constellation', path: 'https://solara.smartslate.io/constellation', badge: 'Soon', badgeType: 'soon' as const, isExternal: true },
    { name: 'Nova', path: 'https://solara.smartslate.io/nova', badge: 'Soon', badgeType: 'soon' as const, isExternal: true },
    { name: 'Orbit', path: 'https://solara.smartslate.io/orbit', badge: 'Soon', badgeType: 'soon' as const, isExternal: true },
    { name: 'Spectrum', path: 'https://solara.smartslate.io/spectrum', badge: 'Soon', badgeType: 'soon' as const, isExternal: true },
  ];

  const renderNavContent = () => {
    if (isActiveBlueprintPage && blueprintData) {
      return (
        <BlueprintSidebarContent 
          {...blueprintData} 
          blueprintId={blueprintData.id || blueprintId || ''} 
        />
      );
    }
    if (isSettingsPage) {
      return <SettingsSidebarContent />;
    }
    if (isFeaturesPage) {
      return <DocumentationSidebarContent />;
    }

    return (
      <nav className="space-y-6">
        {/* Quick Access Section */}
        <div className="space-y-1.5">
          <button
            onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
            className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
          >
            <span className="!text-[10px] font-bold tracking-[0.2em] uppercase text-left">
              Quick Access
            </span>
            <IconChevronRight 
              className={`h-3 w-3 transition-transform duration-300 ${quickAccessExpanded ? 'rotate-90' : ''}`} 
            />
          </button>
          <AnimatePresence initial={false}>
            {quickAccessExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden space-y-1"
              >
                {quickAccessItems.map(({ title, icon: Icon, path, badge, badgeType, disabled, isExternal }) => {
                  const isActive = pathname === path;
                  const content = (
                    <>
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 truncate text-left">{title}</span>
                      {badge && (
                        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200 ${
                          badgeType === 'admin' ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400' : 'border-primary/40 bg-primary/10 text-primary'
                        }`}>
                          {badge}
                        </span>
                      )}
                    </>
                  );
                  const className = `group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                    isActive ? 'bg-primary/10 text-primary shadow-sm font-bold' : 'text-text-secondary hover:bg-white/5 hover:text-foreground active:scale-[0.98]'
                  }`;

                  return isExternal ? (
                    <a key={title} href={path} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
                  ) : (
                    <button key={title} type="button" onClick={() => !disabled && router.push(path)} disabled={disabled} className={className}>{content}</button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Solara Suite Section */}
        <div className="space-y-1.5">
          <button
            onClick={() => setSolaraSuiteExpanded(!solaraSuiteExpanded)}
            className="w-full flex items-center justify-between px-3 py-1 text-primary hover:text-foreground transition-colors group"
          >
            <span className="!text-[10px] font-bold tracking-[0.2em] uppercase text-left">
              Solara Suite
            </span>
            <IconChevronRight 
              className={`h-3 w-3 transition-transform duration-300 ${solaraSuiteExpanded ? 'rotate-90' : ''}`} 
            />
          </button>
          <AnimatePresence initial={false}>
            {solaraSuiteExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden space-y-1"
              >
                {solaraSuiteLinks.map(({ name, path, badge, badgeType, isExternal }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => isExternal ? window.open(path, '_blank') : router.push(path)}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-text-secondary hover:text-foreground hover:bg-white/5 active:scale-[0.98]"
                  >
                    <span className="truncate flex-1 text-left">{name}</span>
                    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                      badgeType === 'soon' ? 'border-neutral-700 bg-neutral-800 text-text-disabled' : 'border-primary/40 bg-primary/10 text-primary shadow-primary/20 shadow'
                    }`}>
                      {badge}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: sidebarCollapsed ? 64 : 288,
        transition: { type: 'spring', stiffness: 300, damping: 35 }
      }}
      className="fixed top-0 left-0 z-[999] hidden h-[100dvh] flex-col overflow-hidden transition-all duration-300 ease-out border-r border-white/5 bg-surface/80 backdrop-blur-xl md:flex"
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Header with Brand & Toggle */}
      <div
        className={`flex items-center sticky top-0 z-20 ${
          sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-6 py-5'
        }`}
      >
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <Brand />
          </motion.div>
        )}
        
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`text-text-secondary hover:text-foreground hover:bg-foreground/5 p-2 rounded-lg transition-all ${
            sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-9'
          }`}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconSidebarToggle
            className={`h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation Content Area */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative z-10">
        {!sidebarCollapsed ? (
          <div className="px-4 py-4 space-y-6">
            {renderNavContent()}
          </div>
        ) : (
          <nav className="flex flex-col items-center space-y-4 py-6">
            {quickAccessItems.map(({ title, icon: Icon, path, isExternal, disabled }) => {
              const isActive = pathname === path;
              return (
                <motion.div key={title} whileHover={{ x: 3 }}>
                  <button
                    onClick={() => !disabled && (isExternal ? window.open(path, '_blank') : router.push(path))}
                    disabled={disabled}
                    title={title}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(167,218,219,0.15)]' 
                        : 'text-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </button>
                </motion.div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-auto w-full relative z-10 border-t border-white/10 bg-surface/50 backdrop-blur-sm">
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-4 px-2 py-4">
            <SubscriptionCTA tier={profile?.subscription_tier as any} collapsed={true} />
            <UserAvatar user={user} sizeClass="w-8 h-8" avatarUrl={profile?.avatar_url} />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <SubscriptionCTA tier={profile?.subscription_tier as any} collapsed={false} />

            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="group hover:bg-white/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="relative">
                <UserAvatar user={user} sizeClass="w-9 h-9" textClass="text-sm font-bold" avatarUrl={profile?.avatar_url} />
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
    </motion.aside>
  );
}
