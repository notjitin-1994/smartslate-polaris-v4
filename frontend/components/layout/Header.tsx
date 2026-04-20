'use client';

import { memo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brand } from './Brand';
import { UserAvatar } from './UserAvatar';
import { IconSidebarToggle, IconLogout } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { DarkModeToggle } from '@/components/theme/DarkModeToggle';
import { responsiveClasses } from '@/lib/responsive';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  className?: string;
  sticky?: boolean;
  variant?: 'floating' | 'solid';
}

export const Header = memo(function Header({
  title,
  subtitle,
  showMobileMenu = false,
  onMobileMenuToggle,
  className = '',
  sticky = true,
  variant = 'floating',
}: HeaderProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  function getFirstName(): string {
    if (!user) return 'User';
    const rawName =
      (user.user_metadata?.first_name as string) ||
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      (user.email as string) ||
      'User';
    return rawName.toString().trim().split(' ')[0];
  }

  function getPageInfo() {
    switch (pathname) {
      case '/dashboard':
        return {
          title: title || `Welcome back, ${getFirstName()}`,
          subtitle: subtitle || 'Track your learning progress and explore new opportunities',
        };
      case '/static-wizard':
        return {
          title: title || 'Learning Blueprint Wizard',
          subtitle: subtitle || 'Create personalized learning experiences with AI guidance',
        };
      case '/dynamic-wizard':
        return {
          title: title || 'Dynamic Learning Path',
          subtitle: subtitle || 'Adaptive learning tailored to your responses',
        };
      case '/settings':
        return {
          title: title || 'Settings',
          subtitle: subtitle || 'Manage your account and preferences',
        };
      default:
        return {
          title: title || 'SmartSlate',
          subtitle: subtitle || 'Your learning companion',
        };
    }
  }

  const pageInfo = getPageInfo();

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const headerClasses = [
    variant === 'floating' ? 'glass' : 'bg-background',
    'border-b border-neutral-200',
    sticky ? 'sticky top-0 z-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.header
      className={headerClasses}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className={`relative ${responsiveClasses.headerContainer}`}
        style={{
          maxWidth: '1280px', // Explicit max-width for consistency
        }}
      >
        {/* Subtle ambient glow */}
        <div
          aria-hidden="true"
          className="bg-primary/[0.03] pointer-events-none absolute inset-x-0 -top-32 h-64"
        />

        <div className="relative py-4">
          {/* Mobile header */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <Brand />
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="touch-target-sm hover:bg-foreground/5 focus-visible:ring-primary/50 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                  aria-label="User menu"
                >
                  <UserAvatar user={user} sizeClass="w-8 h-8" />
                </button>

                {/* Mobile user menu */}
                {showUserMenu && (
                  <motion.div
                    className="glass-strong absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200/50 shadow-xl"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-text-secondary hover:bg-foreground/5 hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                      >
                        <IconLogout className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              {onMobileMenuToggle && (
                <button
                  type="button"
                  onClick={onMobileMenuToggle}
                  aria-label="Open menu"
                  className="touch-target-sm bg-background/50 text-text-secondary hover:bg-foreground/5 hover:text-foreground focus-visible:ring-primary/50 flex items-center justify-center rounded-lg border border-neutral-200/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                >
                  <IconSidebarToggle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop header content */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-6">
              <motion.div
                className="min-w-0 flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-foreground font-heading text-2xl leading-tight font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {pageInfo.title}
                </h1>
                <p className="text-text-secondary mt-2 max-w-3xl text-sm leading-relaxed sm:text-base">
                  {pageInfo.subtitle}
                </p>

                {/* Minimal accent line */}
                <div aria-hidden="true" className="bg-primary/60 mt-4 h-px w-12" />
              </motion.div>

              <motion.div
                className="flex shrink-0 items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <DarkModeToggle />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="hover:bg-foreground/5 focus-visible:ring-primary/50 flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                    aria-label="User menu"
                  >
                    <UserAvatar user={user} sizeClass="w-8 h-8" />
                    <span className="text-text-secondary text-sm font-medium">
                      {getFirstName()}
                    </span>
                  </button>

                  {/* Desktop user menu */}
                  {showUserMenu && (
                    <motion.div
                      className="glass-strong absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200/50 shadow-xl"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="text-text-secondary hover:bg-foreground/5 hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                        >
                          <IconLogout className="h-4 w-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
          aria-hidden="true"
        />
      )}
    </motion.header>
  );
});
