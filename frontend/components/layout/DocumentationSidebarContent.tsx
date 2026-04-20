'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, Lightbulb, GitBranch } from 'lucide-react';
import { IconApps, IconEye, IconSun, IconSettings, IconMap } from '@/components/layout/icons';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function DocumentationSidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useUserProfile();
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [exploreSuiteExpanded, setExploreSuiteExpanded] = useState(false);
  // Always keep documentation section expanded by default
  const [documentationExpanded, setDocumentationExpanded] = useState(true);

  // Ensure documentation section stays expanded on mount
  React.useEffect(() => {
    setDocumentationExpanded(true);
  }, []);

  // Check if user is admin/developer
  const isAdmin = profile?.user_role === 'developer' || profile?.user_role === 'admin';

  const quickActionsItems = [
    { title: 'Dashboard', icon: IconApps, href: '/', isExternal: false },
    {
      title: 'My Learning Design Starmaps',
      icon: IconMap,
      href: '/my-starmaps',
      isExternal: false,
    },
    ...(isAdmin
      ? [
          {
            title: 'Admin',
            icon: IconSettings,
            href: '/admin',
            badge: 'Admin',
            badgeType: 'admin' as const,
            isExternal: false,
          },
        ]
      : []),
    {
      title: 'Solara Learning Engine',
      icon: IconSun,
      href: 'https://solara.smartslate.io',
      isExternal: true,
    },
    {
      title: 'Learn More',
      icon: IconEye,
      href: '/features',
      isExternal: false,
    },
  ];

  const exploreSuiteItems = [
    {
      title: 'Constellation',
      href: 'https://solara.smartslate.io/constellation',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      title: 'Nova',
      href: 'https://solara.smartslate.io/nova',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      title: 'Orbit',
      href: 'https://solara.smartslate.io/orbit',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
    {
      title: 'Spectrum',
      href: 'https://solara.smartslate.io/spectrum',
      badge: 'Coming Soon',
      badgeType: 'soon' as const,
      isExternal: true,
    },
  ];

  const documentationItems = [
    {
      title: 'Features',
      icon: FileText,
      href: '/features',
    },
    {
      title: 'Best Practices',
      icon: Lightbulb,
      href: '/best-practices',
    },
    {
      title: 'Recommended Workflow',
      icon: GitBranch,
      href: '/recommended-workflow',
    },
  ];

  const handleNavigation = (href: string, isExternal: boolean = false) => {
    if (isExternal) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };

  return (
    <nav
      className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4"
      aria-label="Documentation navigation"
    >
      {/* Quick Actions Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
          className="text-primary hover:bg-foreground/5 font-quicksand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200"
        >
          <span className="flex-1 text-left">Quick Actions</span>
          <svg
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${quickActionsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {quickActionsExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
            {quickActionsItems.map(({ title, icon: Icon, href, badge, badgeType, isExternal }) => (
              <button
                key={title}
                type="button"
                onClick={() => handleNavigation(href, isExternal)}
                className="group focus-visible:ring-secondary/50 text-foreground hover:bg-foreground/5 active:bg-foreground/10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2"
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
            ))}
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
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${exploreSuiteExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {exploreSuiteExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
            {exploreSuiteItems.map(({ title, href, badge, badgeType, isExternal }) => (
              <button
                key={title}
                type="button"
                onClick={() => handleNavigation(href, isExternal)}
                className="group text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <span className="flex-1 truncate text-left">{title}</span>
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
            ))}
          </div>
        )}
      </div>

      {/* Documentation Section */}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {documentationExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in space-y-1.5 duration-200">
            {documentationItems.map(({ title, icon: Icon, href }) => {
              const isActive = pathname === href;
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleNavigation(href)}
                  className={`group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-foreground/5 active:bg-foreground/10'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-left">{title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
