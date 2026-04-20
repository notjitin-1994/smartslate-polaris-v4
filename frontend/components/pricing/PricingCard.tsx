/**
 * Pricing Card Component
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PricingCardProps {
  plan: any;
  billing?: 'monthly' | 'annual';
  billingCycle?: 'monthly' | 'annual';
  savings?: number;
  isCenter?: boolean;
  isTeam?: boolean;
  isActive?: boolean;
  delay?: number;
  onSelect: (planId: string) => void;
  children?: React.ReactNode;
}

export function PricingCard({
  plan,
  billing,
  billingCycle,
  savings,
  isCenter,
  delay = 0,
  onSelect,
  children,
}: PricingCardProps): React.JSX.Element {
  const cycle = billing || billingCycle || 'monthly';
  // plan.price is the per-month price already adjusted for billing (e.g., discounted monthly when annual)
  // For annual display, we show the price per year instead of per month
  const monthlyBase: number = (plan.price ?? plan.priceMonthly) || 0;
  const price: number = cycle === 'annual' ? monthlyBase * 12 : monthlyBase;
  const unitLabel = cycle === 'annual' ? '/year' : '/month';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.015,
        y: -12,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-500 ${
        plan.popular || isCenter
          ? 'border-primary/50 from-primary/8 via-primary/4 to-background/60 shadow-primary/15 ring-primary/25 bg-gradient-to-br shadow-2xl ring-2'
          : 'from-background/50 to-background/20 hover:border-primary/30 hover:shadow-primary/8 border-neutral-200/60 bg-gradient-to-br backdrop-blur-sm hover:shadow-xl'
      }`}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="from-primary/10 to-secondary/10 absolute inset-0 bg-gradient-to-br via-transparent" />
      </div>

      {plan.badge && (
        <motion.div
          className="relative z-10 mb-6"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: delay + 0.2,
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <span className="from-primary/20 to-primary/10 text-primary border-primary/20 inline-flex items-center rounded-full border bg-gradient-to-r px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm">
            {plan.badge}
          </span>
        </motion.div>
      )}

      <motion.div
        className="relative z-10 flex flex-1 flex-col px-8 py-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: delay + 0.3,
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Plan name and tagline */}
        <div className="mb-8">
          <h3 className="text-foreground mb-3 text-2xl leading-tight font-bold tracking-tight">
            {plan.name}
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed font-medium">{plan.tagline}</p>
        </div>

        {/* Price section */}
        <div className="mb-10">
          <div className="mb-3 flex items-end gap-2">
            <span className="text-foreground text-6xl leading-none font-black tracking-tighter">
              ${price.toLocaleString()}
            </span>
            <span className="text-text-secondary mb-1 text-xl leading-none font-semibold">
              {unitLabel}
            </span>
          </div>
          {cycle === 'annual' && savings && (
            <motion.div
              className="bg-success/10 border-success/20 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + 0.6,
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <svg className="text-success h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-success text-xs font-bold">
                Save ${savings.toLocaleString()} annually
              </span>
            </motion.div>
          )}
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={() => onSelect(plan.id)}
          className={`mb-8 min-h-[56px] w-full rounded-2xl py-4 text-sm font-bold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
            plan.popular || isCenter
              ? 'from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 focus-visible:ring-primary/50 bg-gradient-to-r shadow-xl hover:shadow-2xl'
              : 'from-surface to-surface/90 text-foreground hover:from-surface/90 hover:to-surface/80 border border-neutral-200/40 bg-gradient-to-r shadow-md hover:border-neutral-300/60 hover:shadow-lg focus-visible:ring-neutral-400/50'
          }`}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
          }}
          whileTap={{
            scale: 0.98,
            transition: { duration: 0.1 },
          }}
          aria-label={`Get started with ${plan.name} plan for $${price}${unitLabel}`}
        >
          Get Started
        </motion.button>

        {/* Custom children content (e.g., generation/saved limits) */}
        {children && <div className="mb-8">{children}</div>}

        {/* Features list */}
        <ul className="mt-auto space-y-5">
          {plan.features.map((feature: string, index: number) => (
            <motion.li
              key={feature}
              className="text-text-secondary flex items-start gap-4 text-sm leading-relaxed"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: delay + 0.5 + index * 0.08,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="bg-primary/10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <Check className="text-primary h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="font-medium">{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
