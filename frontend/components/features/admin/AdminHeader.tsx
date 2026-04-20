'use client';

import { Bell, Search, Menu, LogOut } from 'lucide-react';
import type { AdminUser } from '@/lib/auth/adminAuth';
import { useState } from 'react';

interface AdminHeaderProps {
  user: AdminUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
      {/* Left Section - Search */}
      <div className="flex flex-1 items-center">
        <div className="relative w-96">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users, blueprints, logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-4 dark:border-gray-800">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.full_name || 'Admin User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Developer</div>
          </div>
          <button className="bg-primary-100 dark:bg-primary-900/30 flex h-8 w-8 items-center justify-center rounded-full">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <span className="text-primary-700 dark:text-primary-400 text-sm font-medium">
                {user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        </div>

        {/* Logout */}
        <button
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
