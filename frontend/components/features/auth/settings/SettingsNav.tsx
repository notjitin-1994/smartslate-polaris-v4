'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Palette, CreditCard, type LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '#profile',
  },
  {
    id: 'account',
    label: 'Account',
    icon: CreditCard,
    href: '#account',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Palette,
    href: '#preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '#notifications',
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    icon: Lock,
    href: '#security',
  },
];

interface SettingsNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

/**
 * SettingsNav - Sidebar navigation for settings sections
 * Responsive: Shows as sidebar on desktop, horizontal scroll on mobile
 */
export function SettingsNav({ activeSection, onSectionChange, className }: SettingsNavProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, itemId: string) => {
    e.preventDefault();
    onSectionChange(itemId);

    // Smooth scroll to section
    const element = document.getElementById(itemId);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      className={cn(
        // Desktop: Sticky sidebar
        'lg:sticky lg:top-24 lg:h-fit',
        // Mobile: Horizontal scroll
        'flex gap-1 lg:flex-col',
        'scrollbar-hide overflow-x-auto lg:overflow-x-visible',
        'pb-2 lg:pb-0',
        className
      )}
      aria-label="Settings navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.id)}
            className={cn(
              // Base styles
              'relative flex items-center gap-3 rounded-xl px-4 py-3',
              'text-body font-medium transition-all duration-200',
              'min-w-fit lg:min-w-full', // Prevent shrinking on mobile
              // Touch target sizing
              'min-h-[44px]',
              // Hover state
              'hover:bg-primary/5',
              // Active state
              isActive ? 'text-primary bg-primary/10 shadow-sm' : 'text-text-secondary',
              // Focus visible
              'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeSection"
                className="bg-primary absolute top-1/2 left-0 hidden h-8 w-1 -translate-y-1/2 rounded-r-full lg:block"
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}

            {/* Icon */}
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-text-disabled'
              )}
              aria-hidden="true"
            />

            {/* Label */}
            <span className="whitespace-nowrap">{item.label}</span>

            {/* Active background gradient */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="from-primary/5 absolute inset-0 -z-10 rounded-xl bg-gradient-to-r to-transparent"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * MobileSettingsNav - Mobile-optimized dropdown navigation
 */
export function MobileSettingsNav({
  activeSection,
  onSectionChange,
}: Omit<SettingsNavProps, 'className'>) {
  const activeItem = navItems.find((item) => item.id === activeSection);
  const ActiveIcon = activeItem?.icon || User;

  return (
    <div className="mb-6 lg:hidden">
      <button
        className={cn(
          'flex w-full items-center justify-between gap-3',
          'rounded-xl px-4 py-3',
          'bg-surface border border-neutral-200/10',
          'text-body text-foreground font-medium',
          'hover:border-primary/20 transition-colors',
          'min-h-[44px]'
        )}
        type="button"
      >
        <div className="flex items-center gap-3">
          <ActiveIcon className="text-primary h-5 w-5" />
          <span>{activeItem?.label || 'Settings'}</span>
        </div>
        <svg
          className="text-text-secondary h-5 w-5"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
