'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  BarChart3,
  Bell,
  FileText,
  Settings,
  Database,
  Zap,
} from 'lucide-react';
import type { AdminUser } from '@/lib/auth/adminAuth';

interface AdminSidebarProps {
  user: AdminUser;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
  { label: 'Cost Monitoring', href: '/admin/costs', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/admin/alerts', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
  { label: 'Database', href: '/admin/database', icon: Database },
  { label: 'Performance', href: '/admin/performance', icon: Zap },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Admin Dashboard
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Polaris v3</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  } `}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500'
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center">
          <div className="bg-primary-100 dark:bg-primary-900/30 flex h-10 w-10 items-center justify-center rounded-full">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <span className="text-primary-700 dark:text-primary-400 text-sm font-medium">
                {user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user.full_name || 'Admin User'}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
