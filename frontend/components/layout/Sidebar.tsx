'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { FileText, Lightbulb, GitBranch } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { SubscriptionCTA } from '@/components/layout/SubscriptionCTA';
import {
  IconSidebarToggle,
  IconApps,
  IconEye,
  IconSun,
  IconLogout,
  IconSettings,
  IconMap,
} from '@/components/layout/icons';
import { useBlueprintSidebar } from '@/contexts/BlueprintSidebarContext';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false); // Default to expanded
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  const [exploreSuiteExpanded, setExploreSuiteExpanded] = useState(false);
  const [documentationExpanded, setDocumentationExpanded] = useState(false);
  const { isActiveBlueprintPage, blueprintData } = useBlueprintSidebar();
  const { profile, loading: profileLoading } = useUserProfile();

  // Check if we're on the settings page or features-related pages
  const isSettingsPage = pathname === '/settings';
  const isFeaturesPage =
    pathname === '/features' ||
    pathname === '/best-practices' ||
    pathname === '/recommended-workflow';

  // Update expanded states based on pathname changes
  useEffect(() => {
    if (isFeaturesPage) {
      // On features/documentation pages: collapse Quick Access and Explore Suite, expand Documentation
      setQuickAccessExpanded(false);
      setExploreSuiteExpanded(false);
      setDocumentationExpanded(true);
    } else {
      // On other pages: expand Quick Access, collapse Explore Suite and Documentation
      setQuickAccessExpanded(true);
      setExploreSuiteExpanded(false);
      setDocumentationExpanded(false);
    }
  }, [pathname, isFeaturesPage]);

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

  // Lock body scroll when mobile menu is open or animating
  useEffect(() => {
    if (mobileMenuOpen || isAnimating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, isAnimating]);

  // Open mobile menu with animation
  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    // Reset collapsible sections to collapsed state when opening
    setQuickAccessExpanded(false);
    setExploreSuiteExpanded(false);
    setDocumentationExpanded(false);
    // Trigger animation after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  };

  // Close mobile menu with animation
  const closeMobileMenu = () => {
    setIsAnimating(false);
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setMobileMenuOpen(false);
    }, 300); // Match animation duration
  };

  // Handle navigation with auto-close
  const handleNavigation = (path: string, isExternal: boolean = false) => {
    if (isExternal) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
    closeMobileMenu();
  };

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

  const getFullName = (): string => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || user?.email || 'User';
  };

  const getCapitalizedFirstName = (): string => {
    const name = getFirstName();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Check if user is admin/developer
  const isAdmin = profile?.user_role === 'developer' || profile?.user_role === 'admin';

  const collapsedQuickItems: Array<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
    badge?: string;
    badgeType?: 'admin' | 'soon';
    disabled?: boolean;
    isExternal?: boolean;
  }> = [
    { title: 'Dashboard', icon: IconApps, path: '/' },
    { title: 'My Learning Design Starmaps', icon: IconMap, path: '/my-starmaps' },
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
      title: 'Solara Learning Engine',
      icon: IconSun,
      path: 'https://solara.smartslate.io',
      isExternal: true,
    },
    {
      title: 'Learn More',
      icon: IconEye,
      path: 'https://www.smartslate.io',
      isExternal: true,
    },
  ];

  const productLinks = [
    {
      name: 'Constellation',
      path: 'https://solara.smartslate.io/constellation',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      name: 'Nova',
      path: 'https://solara.smartslate.io/nova',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      name: 'Orbit',
      path: 'https://solara.smartslate.io/orbit',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      name: 'Spectrum',
      path: 'https://solara.smartslate.io/spectrum',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - Revamped with Framer Motion */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? 64 : 320,
          transition: { type: 'spring', stiffness: 300, damping: 35 }
        }}
        className="fixed top-0 left-0 z-[999] hidden h-[100dvh] flex-col overflow-hidden border-r border-white/5 bg-surface shadow-xl backdrop-blur-xl md:flex"
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Header with Brand & Toggle */}
        <div
          className={`flex items-center bg-surface/80 sticky top-0 z-20 backdrop-blur-sm ${
            sidebarCollapsed ? 'justify-center px-2 py-4' : 'justify-between px-6 py-5'
          }`}
        >
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <Brand />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-secondary/50"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconSidebarToggle
              className={`h-5 w-5 transition-transform duration-500 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </motion.button>
        </div>

        {/* Navigation Content Area */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin">
          {sidebarCollapsed ? (
            /* COLLAPSED VIEW: Icon-only optimized navigation */
            <nav className="flex flex-col items-center space-y-4 py-6" aria-label="Collapsed navigation">
              {collapsedQuickItems.map(({ title, icon: Icon, path, isExternal, disabled }) => {
                const isActive = pathname === path;
                return (
                  <motion.div key={title} whileHover={{ x: 3 }}>
                    <button
                      onClick={() => !disabled && handleNavigation(path, isExternal)}
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
          ) : (
            /* EXPANDED VIEW: Full rich navigation */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="px-4 py-4"
            >
              {isActiveBlueprintPage && blueprintData ? (
                <BlueprintSidebarContent {...blueprintData} />
              ) : isSettingsPage ? (
                <SettingsSidebarContent />
              ) : isFeaturesPage ? (
                <DocumentationSidebarContent />
              ) : (
                <nav className="space-y-6" aria-label="Primary navigation">
                  {/* Quick Access Section */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
                      className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                    >
                      <span className="flex-1 text-left">Quick Access</span>
                      <svg
                        className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${quickAccessExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                {quickAccessExpanded && (
                  <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                    {collapsedQuickItems.map(
                      ({ title, icon: Icon, path, badge, badgeType, disabled, isExternal }) => {
                        const isActive = pathname === path;
                        const content = (
                          <>
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="flex-1 truncate text-left">{title}</span>
                            {badge && (
                              <span
                                className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200 ${
                                  badgeType === 'admin'
                                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 shadow-indigo-500/20'
                                    : 'border-primary/40 bg-primary/10 text-primary shadow-primary/20'
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                            {isActive && !disabled && (
                              <div className="bg-primary absolute top-1/2 right-0 h-8 w-1 -translate-y-1/2 rounded-l-full" />
                            )}
                          </>
                        );

                        const className = `group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : disabled
                              ? 'text-text-disabled cursor-not-allowed'
                              : 'text-text-secondary hover:text-foreground hover:bg-foreground/5 active:scale-[0.98]'
                        }`;

                        return isExternal ? (
                          <a
                            key={title}
                            href={path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={className}
                          >
                            {content}
                          </a>
                        ) : (
                          <button
                            key={title}
                            type="button"
                            onClick={() => !disabled && router.push(path)}
                            disabled={disabled}
                            className={className}
                          >
                            {content}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Product Links */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setExploreSuiteExpanded(!exploreSuiteExpanded)}
                  className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                >
                  <span className="flex-1 text-left">Explore Suite</span>
                  <svg
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${exploreSuiteExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {exploreSuiteExpanded && (
                  <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                    {productLinks.map(({ name, path, badge, badgeType, isExternal }) => {
                      const isActive = pathname === path;
                      const content = (
                        <>
                          <span className="flex-1 truncate text-left">{name}</span>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                              badgeType === 'soon'
                                ? 'border-primary/40 bg-primary/10 text-primary shadow-primary/20 shadow'
                                : 'text-text-disabled border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                            }`}
                          >
                            {badge}
                          </span>
                        </>
                      );

                      const className = `group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-text-secondary hover:text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]'
                      }`;

                      return isExternal ? (
                        <a
                          key={name}
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {content}
                        </a>
                      ) : (
                        <button
                          key={name}
                          type="button"
                          onClick={() => router.push(path)}
                          className={className}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documentation Section - Only show on features-related pages */}
              {isFeaturesPage && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setDocumentationExpanded(!documentationExpanded)}
                    className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                  >
                    <span className="flex-1 text-left">Documentation</span>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${documentationExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {documentationExpanded && (
                    <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                      <button
                        type="button"
                        onClick={() => router.push('/features')}
                        className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] ${
                          pathname === '/features'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:text-foreground hover:bg-foreground/5'
                        }`}
                      >
                        <FileText className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Features</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push('/best-practices')}
                        className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] ${
                          pathname === '/best-practices'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:text-foreground hover:bg-foreground/5'
                        }`}
                      >
                        <Lightbulb className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Best Practices</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push('/recommended-workflow')}
                        className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] ${
                          pathname === '/recommended-workflow'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:text-foreground hover:bg-foreground/5'
                        }`}
                      >
                        <GitBranch className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Recommended Workflow</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}
        </motion.div>
      )}
      </div>

        {/* Footer Section */}
        <div className="bg-surface/50 mt-auto w-full flex-shrink-0 backdrop-blur-sm">
          {sidebarCollapsed ? (
            // Collapsed Footer - Subscribe and Logout Buttons
            <div className="flex flex-col items-center space-y-2 px-2 py-3">
              {/* Subscription CTA - Collapsed */}
              <SubscriptionCTA tier={profile?.subscription_tier as any} collapsed={true} />

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
              {/* Subscription CTA - Expanded */}
              <SubscriptionCTA tier={profile?.subscription_tier as any} collapsed={false} />

              {/* Divider below subscribe removed per request; keep profile divider intact above */}

              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="group hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <div className="relative">
                  <UserAvatar
                    user={user}
                    sizeClass="w-9 h-9"
                    textClass="text-sm font-bold"
                    avatarUrl={profile?.avatar_url}
                  />
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
      </motion.aside>

      {/* Mobile Hamburger Button (Bottom Right) */}
      <button
        type="button"
        onClick={openMobileMenu}
        className="bg-primary shadow-primary/30 hover:shadow-primary/40 fixed right-6 bottom-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 md:hidden"
        aria-label="Open navigation menu"
      >
        <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Mobile Sidebar */}
          <aside
            className={`bg-surface fixed inset-0 z-[10000] flex flex-col p-6 transition-all duration-300 md:hidden ${
              isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
            aria-label="Mobile navigation"
            role="navigation"
          >
            {/* Header with Brand & Close */}
            <div className="mb-6 flex items-start justify-between">
              <Brand />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="group text-text-secondary hover:text-foreground -mt-1 -mr-1 flex h-10 w-10 items-center justify-center transition-all duration-200 active:scale-95"
                aria-label="Close navigation menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <nav className="flex-1 space-y-6 overflow-y-auto">
              {/* Quick Access Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
                  className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                >
                  <span className="flex-1 text-left">Quick Access</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${quickAccessExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {quickAccessExpanded && (
                  <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                    {collapsedQuickItems.map(
                      ({ title, icon: Icon, path, badge, badgeType, disabled, isExternal }) => {
                        const isActive = pathname === path;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => !disabled && handleNavigation(path, isExternal)}
                            disabled={disabled}
                            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                              isActive
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : disabled
                                  ? 'text-text-disabled cursor-not-allowed'
                                  : 'text-text-secondary hover:bg-foreground/5 hover:text-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="flex-1 truncate text-left">{title}</span>
                            {badge && (
                              <span
                                className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200 ${
                                  badgeType === 'admin'
                                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 shadow-indigo-500/20'
                                    : 'border-primary/40 bg-primary/10 text-primary shadow-primary/20'
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Explore Suite Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setExploreSuiteExpanded(!exploreSuiteExpanded)}
                  className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                >
                  <span className="flex-1 text-left">Explore Suite</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${exploreSuiteExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {exploreSuiteExpanded && (
                  <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                    {productLinks.map(({ name, path, badge, badgeType, isExternal }) => {
                      const isActive = pathname === path;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleNavigation(path, isExternal)}
                          className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary/10 text-primary shadow-sm'
                              : 'text-text-secondary hover:bg-foreground/5 hover:text-foreground'
                          }`}
                        >
                          <span className="flex-1 truncate text-left">{name}</span>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow transition-all duration-200 ${
                              badgeType === 'soon'
                                ? 'border-primary/40 bg-primary/10 text-primary shadow-primary/20'
                                : 'text-text-disabled border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                            }`}
                          >
                            {badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documentation Section */}
              {isFeaturesPage && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setDocumentationExpanded(!documentationExpanded)}
                    className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
                  >
                    <span className="flex-1 text-left">Documentation</span>
                    <svg
                      className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${documentationExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {documentationExpanded && (
                    <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
                      <button
                        type="button"
                        onClick={() => handleNavigation('/features')}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                          pathname === '/features'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        <FileText className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Features</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigation('/best-practices')}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                          pathname === '/best-practices'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        <Lightbulb className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Best Practices</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigation('/recommended-workflow')}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                          pathname === '/recommended-workflow'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        <GitBranch className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate text-left">Recommended Workflow</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Footer Section */}
            <div className="border-foreground/10 mt-6 space-y-3 border-t pt-6">
              {/* Subscription CTA */}
              <SubscriptionCTA tier={profile?.subscription_tier as any} collapsed={false} />

              {/* User Profile Button */}
              <button
                type="button"
                onClick={() => handleNavigation('/profile')}
                className="group bg-foreground/5 hover:bg-foreground/10 flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="relative">
                  <UserAvatar
                    user={user}
                    sizeClass="w-10 h-10"
                    textClass="text-sm font-bold"
                    avatarUrl={profile?.avatar_url}
                  />
                  <div className="border-surface bg-success absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {getCapitalizedFirstName()}
                  </p>
                  <p className="text-text-secondary truncate text-xs">{user?.email}</p>
                </div>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => handleNavigation('/settings')}
                className="group text-text-secondary hover:bg-foreground/5 hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <IconSettings className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Settings</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  // Wait for animation before signing out
                  setTimeout(() => {
                    onSignOut();
                  }, 300);
                }}
                className="group text-text-secondary hover:bg-error/5 hover:text-error flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <IconLogout className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
