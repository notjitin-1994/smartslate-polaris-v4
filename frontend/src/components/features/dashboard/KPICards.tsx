'use client';

import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Clock, BookOpen, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardKPIs } from '@/types/dashboard';

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  suffix?: string;
  prefix?: string;
}

function KPICard({
  title,
  value,
  icon,
  color,
  delay = 0,
  suffix = '',
  prefix = '',
}: KPICardProps): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      delay,
      ease: 'easeOut',
    });

    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, value, rounded, delay]);

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div
        className={cn(
          'glass rounded-2xl p-6 transition-all duration-300',
          'hover:glass-strong hover:shadow-xl',
          'group-hover:scale-105'
        )}
      >
        {/* Background gradient effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl opacity-5 transition-opacity duration-300 group-hover:opacity-10',
            color
          )}
        />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div
              className={cn(
                'rounded-lg p-3',
                color,
                'bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300'
              )}
            >
              {icon}
            </div>
            <div className="text-right">
              <motion.div
                className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                key={value}
              >
                {prefix}
                {displayValue}
                {suffix}
              </motion.div>
            </div>
          </div>

          <h3 className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
            {title}
          </h3>
        </div>

        {/* Animated progress bar */}
        <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-xl bg-slate-200 dark:bg-slate-700">
          <motion.div
            className={cn('h-full', color)}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: delay + 0.5, duration: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface KPICardsProps {
  kpis: DashboardKPIs;
  className?: string;
}

export function KPICards({ kpis, className }: KPICardsProps): React.JSX.Element {
  const cards = [
    {
      title: 'Total Learning Hours',
      value: kpis.totalLearningHours,
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-500',
      delay: 0,
    },
    {
      title: 'Total Modules',
      value: kpis.totalModules,
      icon: <BookOpen className="h-6 w-6 text-green-600" />,
      color: 'bg-green-500',
      delay: 0.2,
    },
    {
      title: 'Completed Modules',
      value: kpis.completedModules,
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
      color: 'bg-emerald-500',
      delay: 0.4,
    },
    {
      title: 'Total Resources',
      value: kpis.totalResources,
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-500',
      delay: 0.6,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4', className)}>
      {cards.map((card) => (
        <KPICard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          delay={card.delay}
        />
      ))}
    </div>
  );
}
