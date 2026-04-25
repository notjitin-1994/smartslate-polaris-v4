'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Brand } from './Brand';
import { NavSection, type NavItem } from './NavSection';
import { UserAvatar } from './UserAvatar';
import { IconSidebarToggle } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useResponsive } from '@/lib/design-system/hooks/useResponsive';

interface AppLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  className?: string;
}

export const AppLayout = memo(function AppLayout({
  children,
  headerTitle,
  headerSubtitle,
  className = '',
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { sidebarCollapsed } = useSidebar();
  const { isDesktop } = useResponsive();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const learningItems: NavItem[] = ['Explore Learning', 'My Learning', 'Dynamic Learning'];

  const architectureItems: NavItem[] = ['Explore Partnership', 'My Architecture'];

  function handleMobileNavItemClick(item: NavItem) {
    setMobileMenuOpen(false);
    // Handle navigation logic here
    const label = typeof item === 'string' ? item : item.label;
    console.log(`Navigate to: ${label}`);
  }

  // Width calculation that avoids hydration mismatch
  const sidebarWidth = !isMounted 
    ? 288 
    : (sidebarCollapsed ? 64 : (isDesktop ? 320 : 288));

  return (
    <div
      className={`h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${className}`}
    >
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <Sidebar user={user} onSignOut={signOut} />

        {/* Main Content Area */}
        <main 
          className={`h-full min-w-0 flex-1 overflow-y-auto transition-all duration-300 ease-out`}
          style={{ marginLeft: isMounted ? undefined : 288 }} // Fallback for initial render
        >
          {/* Synchronized spacer for fixed sidebar */}
          <motion.div
            initial={false}
            animate={{ width: sidebarWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="hidden shrink-0 md:block"
          />

          <div className="flex flex-col flex-1 min-h-full">
            <Header
              title={headerTitle}
              subtitle={headerSubtitle}
              showMobileMenu={mobileMenuOpen}
              onMobileMenuToggle={() => setMobileMenuOpen(true)}
            />

            {/* Page Content */}
            <div className="flex-1">{children}</div>
          </div>
        </main>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              className="bg-background absolute top-0 right-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-neutral-300 p-3 shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                  setMobileMenuOpen(false);
                }
              }}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between border-b border-neutral-300 px-1 py-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="text-text-secondary hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg transition"
                >
                  <span className="text-lg">×</span>
                </button>
                <div className="h-7 w-[140px] flex items-center justify-end">
                  <Brand />
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="mt-3 flex-1 space-y-3 overflow-y-auto pb-6">
                <NavSection
                  title="Learning Hub"
                  items={learningItems}
                  defaultOpen
                  onItemClick={handleMobileNavItemClick}
                />
                <NavSection
                  title="Strategic Skills Architecture"
                  items={architectureItems}
                  defaultOpen
                  onItemClick={handleMobileNavItemClick}
                />
              </nav>

              {/* Mobile Menu Footer */}
              <div className="mt-auto">
                <div className="border-t border-neutral-200 px-1 py-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserAvatar user={user} sizeClass="w-8 h-8" />
                    <span className="text-foreground text-sm font-medium">
                      {user?.user_metadata?.first_name || user?.email || 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
});
