'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, FileText, Settings, Rocket, Compass } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const quickActions = [
  {
    icon: Plus,
    title: 'Create New Starmap',
    description: 'Start a new learning journey',
    href: '/static-wizard',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    icon: Compass,
    title: 'Browse Templates',
    description: 'Explore ready-made blueprints',
    href: '/templates',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    icon: FileText,
    title: 'My Starmaps',
    description: 'View your saved blueprints',
    href: '/my-starmaps',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Manage your account',
    href: '/settings',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
];

export function QuickActionsCard() {
  return (
    <GlassCard className="h-full p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="from-primary to-primary flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
          <Rocket className="h-5 w-5 text-black" />
        </div>
        <div>
          <h3 className="text-title text-foreground font-bold">Quick Actions</h3>
          <p className="text-caption text-text-secondary">Get started quickly</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={action.href}>
                <div
                  className={`group rounded-xl border p-4 ${action.borderColor} ${action.bgColor} cursor-pointer transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg transition-shadow group-hover:shadow-xl`}
                    >
                      <Icon className="h-5 w-5 text-black" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-body text-foreground group-hover:text-primary mb-1 font-semibold transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-caption text-text-secondary">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
