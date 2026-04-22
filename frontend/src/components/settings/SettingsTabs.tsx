'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './tabs/ProfileTab';
import { AccountTab } from './tabs/AccountTab';
import { AdvancedTab } from './tabs/AdvancedTab';
import { cn } from '@/lib/utils';

/**
 * SettingsTabs - Main tabbed settings interface
 * Organizes settings into 3 logical categories with URL hash persistence
 */
export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState('profile');

  // Persist active tab in URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['profile', 'account', 'advanced'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;

    // Store in localStorage for persistence across sessions
    try {
      localStorage.setItem('settings-active-tab', value);
    } catch (err) {
      console.error('Failed to save tab preference:', err);
    }
  };

  // Load persisted tab on mount
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('settings-active-tab');
      if (savedTab && ['profile', 'account', 'advanced'].includes(savedTab)) {
        setActiveTab(savedTab);
        window.location.hash = savedTab;
      }
    } catch (err) {
      console.error('Failed to load tab preference:', err);
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <TabsList
          className={cn(
            'glass-card inline-flex w-full gap-2 rounded-xl p-2',
            'sm:w-auto',
            'scrollbar-hide overflow-x-auto'
          )}
        >
          <TabsTrigger
            value="profile"
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg px-4 py-2',
              'text-caption font-medium transition-all duration-200',
              'hover:bg-primary/10',
              'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-text-secondary'
            )}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="account"
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg px-4 py-2',
              'text-caption font-medium transition-all duration-200',
              'hover:bg-primary/10',
              'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-text-secondary'
            )}
          >
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>

          <TabsTrigger
            value="advanced"
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg px-4 py-2',
              'text-caption font-medium transition-all duration-200',
              'hover:bg-primary/10',
              'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-text-secondary'
            )}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>
      </motion.div>

      {/* Tab Content */}
      <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
        <ProfileTab />
      </TabsContent>

      <TabsContent value="account" className="mt-0 focus-visible:outline-none">
        <AccountTab />
      </TabsContent>

      <TabsContent value="advanced" className="mt-0 focus-visible:outline-none">
        <AdvancedTab />
      </TabsContent>
    </Tabs>
  );
}
