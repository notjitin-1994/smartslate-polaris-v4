'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  category?: 'billing' | 'features' | 'support' | 'general';
}

const faqData: FAQItem[] = [
  {
    question: 'Do my unused Starmaps expire?',
    answer:
      "Never, as long as you maintain an active subscription. Your saved Starmaps accumulate month over month, building a permanent library. Think of it like a gym membership where you actually get to keep the muscle you've built. Your monthly creations refresh on the 1st of each month, and any Starmaps you save remain in your library indefinitely.",
    category: 'features',
  },
  {
    question: 'What\'s the difference between "creations" and "saved Starmaps"?',
    answer:
      'Creations are your monthly creation limit — how many new AI-Assisted Learning Experience Designs you can create each month. Saved Starmaps is your storage library — how many you can keep and access anytime. For example, Navigator gives you 25 new creations each month, and you can save up to 25 Starmaps in your library that roll over and accumulate.',
    category: 'features',
  },
  {
    question: 'What happens if I upgrade or downgrade my plan?',
    answer:
      'When you upgrade, your saved Starmaps remain, and you start receiving your new, higher monthly allocation immediately. When you downgrade, you keep all saved Starmaps — you just receive fewer new creations each month going forward. Your library is always yours.',
    category: 'billing',
  },
  {
    question: 'Is there a maximum number of Starmaps I can save?',
    answer:
      'Yes, to ensure system performance: Explorer can save up to 5 Starmaps (60 with rollover over 12 months), Navigator up to 25 Starmaps (300 with 12-month accumulation), and Voyager up to 50 saved Starmaps (600 with 12-month accumulation). Team plans have shared pools: Crew (10/user), Fleet (30/user), Armada (60/user).',
    category: 'features',
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer:
      "If you cancel, you'll have 30 days to download or use your saved Starmaps. We'll send you reminders before your access expires. Simply reactivate before the 30-day window closes to retain your full library. We want you to keep what you've built.",
    category: 'billing',
  },
  {
    question: 'Is there a free trial available?',
    answer:
      "Yes! All plans come with a 14-day free trial with 3 Starmap generations included. No credit card required to start. If you subscribe after your trial, those 3 Starmaps roll over into your library — they don't disappear!",
    category: 'billing',
  },
  {
    question: 'How does team collaboration work?',
    answer:
      'Team plans include shared workspaces where members can collaborate in real-time. You can set role-based permissions, share templates, and work together on Starmaps. The team shares a collective pool of monthly generations and saved Starmaps that grows each month.',
    category: 'features',
  },
  {
    question: 'Can I export my Starmaps?',
    answer:
      'All plans include export to PDF. Navigator and above can export to Word and PDF formats with advanced formatting. We&apos;re also working on API access for Voyager users to integrate with other tools in your workflow.',
    category: 'features',
  },
];

interface PricingFAQProps {
  className?: string;
}

export function PricingFAQ({ className = '' }: PricingFAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const filteredFAQs = activeCategory
    ? faqData.filter((item) => item.category === activeCategory)
    : faqData;

  const categories = [
    { id: null, label: 'All Questions', icon: '🌟' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'support', label: 'Support', icon: '🛟' },
  ];

  return (
    <div className={className}>
      {/* Minimal Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="font-heading text-foreground mb-3 text-3xl font-bold sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="text-text-secondary">
          Everything you need to know about our plans and pricing
        </p>
      </motion.div>

      {/* Minimal Category filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mb-12 flex flex-wrap justify-center gap-2"
      >
        {categories.map((category) => (
          <button
            key={category.id ?? 'all'}
            onClick={() => setActiveCategory(category.id)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
              activeCategory === category.id
                ? 'bg-primary/10 text-primary border-primary/30 border'
                : 'bg-background/60 text-text-secondary hover:border-primary/20 hover:text-foreground border border-neutral-200/50 dark:border-neutral-800/50'
            } `}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {/* FAQ Items */}
      <div className="mx-auto max-w-3xl space-y-3">
        <AnimatePresence mode="wait">
          {filteredFAQs.map((item, index) => {
            const isOpen = openItems.has(index);

            return (
              <motion.div
                key={`${activeCategory}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div
                  className={`bg-background/40 overflow-hidden rounded-xl border border-neutral-200/50 backdrop-blur-sm transition-all duration-200 dark:border-neutral-800/50 ${isOpen ? 'border-primary/20 shadow-lg' : 'hover:border-primary/10'} `}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="hover:bg-foreground/5 flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <div className="flex-1">
                      <h3 className="text-foreground font-medium">{item.question}</h3>
                    </div>

                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <svg
                        className={`h-5 w-5 transition-colors ${isOpen ? 'text-primary' : 'text-text-disabled'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-neutral-200/50 dark:border-neutral-800/50"
                      >
                        <div className="px-6 py-4">
                          <p className="text-text-secondary text-sm leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Minimal Contact support CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 text-center"
      >
        <p className="text-text-secondary mb-6">Still have questions? We&apos;re here to help</p>
        <a
          href="mailto:support@smartslate.io"
          className="bg-background/60 text-foreground hover:border-primary/30 hover:bg-background/80 group inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-6 py-3 text-sm font-medium transition-all duration-200 dark:border-neutral-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Contact Support
        </a>
      </motion.div>
    </div>
  );
}
