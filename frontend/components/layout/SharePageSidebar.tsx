'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { IconSidebarToggle, IconApps, IconEye, IconSun } from '@/components/layout/icons';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SharePageSidebarProps {}

export function SharePageSidebar(_props: SharePageSidebarProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const collapsedQuickItems = [
    {
      title: 'Explore Polaris: Learning Design',
      icon: IconApps,
      path: 'https://polaris.smartslate.io',
      isExternal: true,
    },
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

  const handleNavigation = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 hidden h-screen flex-col md:flex ${sidebarCollapsed ? 'md:w-16 lg:w-16' : 'md:w-72 lg:w-80'} bg-surface z-50 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out`}
      aria-label="Navigation"
      role="navigation"
    >
      {/* Header with Brand & Toggle */}
      <div
        className={`${sidebarCollapsed ? 'px-2 py-3' : 'px-6 py-5'} flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} bg-surface/80 sticky top-0 z-20 backdrop-blur-sm`}
      >
        {!sidebarCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="relative h-8 w-32">
              <Image
                src="/images/logos/logo.png"
                alt="SmartSlate"
                fill
                className="object-contain"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(85%) sepia(20%) saturate(150%) hue-rotate(135deg) brightness(100%) contrast(95%)',
                }}
                priority
              />
            </div>
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
        <nav
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4"
          aria-label="Primary navigation"
        >
          {/* Quick Access Section */}
          <div className="space-y-1.5">
            <h2 className="text-primary mb-2 px-3 text-[5px] font-bold tracking-wider uppercase">
              Quick Access
            </h2>
            {collapsedQuickItems.map(({ title, icon: Icon, path, isExternal }) => {
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleNavigation(path, isExternal)}
                  className="group focus-visible:ring-secondary/50 text-text-secondary hover:text-foreground hover:bg-foreground/5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-left">{title}</span>
                </button>
              );
            })}
          </div>

          {/* Product Links */}
          <div className="space-y-1">
            <h2 className="text-primary mb-2 px-3 text-[5px] font-bold tracking-wider uppercase">
              Explore Suite
            </h2>
            {productLinks.map(({ name, path, badge, badgeType, isExternal }) => {
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleNavigation(path, isExternal)}
                  className="group text-text-secondary hover:text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
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
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Footer Section */}
      <div className="bg-surface/50 mt-auto w-full flex-shrink-0 backdrop-blur-sm">
        {sidebarCollapsed ? (
          // Collapsed Footer
          <div className="flex flex-col items-center space-y-2 px-2 py-3">
            {/* Subscribe Button - Collapsed */}
            <button
              type="button"
              onClick={() => window.open('https://polaris.smartslate.io/pricing', '_blank')}
              title="Subscribe to Polaris"
              aria-label="Subscribe to Polaris"
              className="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-95"
            >
              <Crown className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Expanded Footer
          <div className="px-4 py-4">
            {/* Subscribe Button - Expanded */}
            <button
              type="button"
              onClick={() => window.open('https://polaris.smartslate.io/pricing', '_blank')}
              className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span className="flex-1 text-left font-semibold">Subscribe to Polaris</span>
              <Crown className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
