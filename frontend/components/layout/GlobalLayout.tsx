'use client';

import { memo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Brand } from './Brand';
import { NavSection, type NavItem } from './NavSection';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { BlueprintSidebarProvider } from '@/contexts/BlueprintSidebarContext';

interface GlobalLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  className?: string;
}

export const GlobalLayout = memo(function GlobalLayout({
  children,
  headerTitle,
  headerSubtitle,
  className = '',
}: GlobalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Hide sidebar on login and signup pages
  const hideSidebar = pathname === '/login' || pathname === '/signup';

  // Load and track sidebar collapsed state
  useEffect(() => {
    setIsMounted(true);

    const loadSidebarState = () => {
      try {
        const stored = localStorage.getItem('portal:sidebarCollapsed');
        setSidebarCollapsed(stored === '1');
      } catch {
        // Ignore errors
      }
    };

    loadSidebarState();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portal:sidebarCollapsed') {
        setSidebarCollapsed(e.newValue === '1');
      }
    };

    // Listen for keyboard shortcut (Ctrl/Cmd + B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        // Re-read state after a small delay for the Sidebar component to update
        setTimeout(loadSidebarState, 100);
      }
    };

    // Also poll periodically to catch any missed updates
    const interval = setInterval(loadSidebarState, 500);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const learningItems: NavItem[] = ['Explore Learning', 'My Learning', 'Dynamic Learning'];

  const architectureItems: NavItem[] = ['Explore Partnership', 'My Architecture'];

  function handleMobileNavItemClick(item: NavItem) {
    setMobileMenuOpen(false);
    // Handle navigation logic here
    const label = typeof item === 'string' ? item : item.label;
    console.log(`Navigate to: ${label}`);
  }

  return (
    <BlueprintSidebarProvider>
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      <div
        className={`bg-background text-foreground flex min-h-screen w-full flex-col ${className}`}
      >
        {/* Desktop Sidebar - Hidden on login/signup pages */}
        {!hideSidebar && <Sidebar user={user} onSignOut={signOut} />}

        {/* Main Content Area with synchronized animation */}
        <div className="flex min-h-screen w-full">
          {/* Spacer that matches sidebar width with synchronized animation */}
          {!hideSidebar && (
            <motion.div
              initial={false}
              animate={{ 
                width: sidebarCollapsed ? 64 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 320 : 288),
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="hidden shrink-0 md:block"
            />
          )}

          {/* Content area that fills remaining space and centers content */}
          <main className="flex flex-1 flex-col items-center justify-start overflow-x-hidden">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />

          {/* Mobile Menu Panel */}
          <motion.div
            className="bg-paper absolute top-0 right-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-neutral-200 p-3 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-1 py-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="text-text-secondary hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg transition"
              >
                <span className="text-lg">×</span>
              </button>
              <Brand />
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
                  <span className="text-text-secondary text-sm font-medium">
                    {user?.user_metadata?.first_name || user?.email || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </BlueprintSidebarProvider>
  );
});
