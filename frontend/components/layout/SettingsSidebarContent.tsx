'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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

/**
 * SettingsSidebarContent - Settings navigation adapted for the global sidebar
 * Displays settings sections when user is on /settings page
 */
export function SettingsSidebarContent() {
  const [activeSection, setActiveSection] = useState('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Handle hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Observe sections for active state
  useEffect(() => {
    if (!mounted) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -66%',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId);
          // Update URL hash without scrolling
          window.history.replaceState(null, '', `#${sectionId}`);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section elements
    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [mounted]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, itemId: string) => {
    e.preventDefault();
    setActiveSection(itemId);

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
      className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4"
      aria-label="Settings navigation"
    >
      {/* Settings Header */}
      <div className="mb-4 px-3">
        <h2 className="text-primary text-[5px] font-bold tracking-wider uppercase">Settings</h2>
      </div>

      {/* Settings Navigation Items */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.id)}
            className={cn(
              'group focus-visible:ring-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-text-secondary hover:text-foreground hover:bg-foreground/5 active:scale-[0.98]'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 truncate text-left">{item.label}</span>
            {isActive && (
              <div className="bg-primary absolute top-1/2 right-0 h-8 w-1 -translate-y-1/2 rounded-l-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
