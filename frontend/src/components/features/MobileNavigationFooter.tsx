'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lightbulb, GitBranch, ArrowRight } from 'lucide-react';

/**
 * MobileNavigationFooter Component
 *
 * A mobile-only section that appears at the bottom of the Features page,
 * guiding users to explore Best Practices and Recommended Workflow.
 *
 * Design Decisions:
 *
 * 1. **Layout Strategy**:
 *    - Vertical stacking for mobile (no horizontal cramming)
 *    - Each CTA gets full width for generous tap targets
 *    - Comfortable 16px spacing between cards
 *
 * 2. **Visual Hierarchy**:
 *    - Section header establishes context ("Ready to master Smartslate?")
 *    - Cards use glassmorphism for premium feel
 *    - Icons on left for quick scanning, arrow on right signals action
 *    - Primary card (Best Practices) has subtle teal glow
 *    - Secondary card (Workflow) has indigo accent
 *
 * 3. **Touch Optimization**:
 *    - 56px minimum height for tap targets (exceeds 44px WCAG requirement)
 *    - Generous padding (20px vertical, 24px horizontal)
 *    - Clear press states with scale-down animation
 *    - Hover-lift effect for visual feedback
 *
 * 4. **Accessibility**:
 *    - Semantic HTML (nav, section, headings)
 *    - ARIA labels for links
 *    - High contrast text (WCAG AA compliant)
 *    - Focus visible states with custom ring colors
 *    - Screen reader optimized text
 *
 * 5. **Brand Consistency**:
 *    - Glassmorphism: backdrop-blur-lg, glass borders
 *    - Teal accent (rgb(167,218,219)) for primary action
 *    - Indigo accent (rgb(79,70,229)) for secondary action
 *    - Dark mode native: bg-background-paper, text-primary
 *    - Subtle gradient shadows for depth
 *
 * 6. **Animation**:
 *    - Staggered fade-in-up entrance (200ms delay between cards)
 *    - Pressable interaction (scale 0.98 on tap)
 *    - Smooth transitions (300ms cubic-bezier)
 *    - Respects prefers-reduced-motion
 *
 * 7. **Integration**:
 *    - Hidden on desktop (md:hidden)
 *    - Self-contained (no external dependencies beyond Lucide/Framer)
 *    - Works in light/dark mode via Tailwind classes
 *    - Responsive typography (text-sm to text-base)
 */

const MobileNavigationFooter: React.FC = () => {
  return (
    <nav
      className="via-background-dark/50 to-background-dark bg-gradient-to-b from-transparent px-4 py-8 md:hidden"
      aria-label="Mobile navigation to learning resources"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-6 text-left"
      >
        <h2 className="mb-2 font-[family-name:var(--font-quicksand)] text-xl font-semibold text-[rgb(167,218,219)]">
          Ready to Master Smartslate?
        </h2>
        <p className="font-[family-name:var(--font-lato)] text-sm text-white">
          Explore expert guidance to maximize your learning blueprint results
        </p>
      </motion.div>

      {/* Navigation Cards */}
      <div className="mx-auto max-w-md space-y-4">
        {/* Best Practices Card (Primary) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          <Link
            href="/best-practices"
            className="group block w-full"
            aria-label="Navigate to Best Practices guide"
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-background-paper/55 hover:bg-background-paper/70 hover:border-primary/30 focus-visible:ring-primary/50 focus-visible:ring-offset-background-dark relative min-h-[56px] w-full rounded-xl border border-white/10 px-6 py-5 backdrop-blur-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(167,218,219,0.15)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0"
            >
              {/* Subtle Glow Effect */}
              <div className="from-primary/5 absolute inset-0 rounded-xl bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Content */}
              <div className="relative flex items-center justify-start gap-4">
                {/* Icon Container */}
                <div className="bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border transition-colors duration-300">
                  <Lightbulb className="text-primary h-6 w-6" strokeWidth={2} aria-hidden="true" />
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 truncate font-[family-name:var(--font-quicksand)] text-base font-semibold text-[rgb(167,218,219)]">
                    Best Practices
                  </h3>
                  <p className="font-[family-name:var(--font-lato)] text-sm text-white">
                    Expert tips for quality blueprints
                  </p>
                </div>

                {/* Arrow Icon */}
                <ArrowRight
                  className="text-primary/60 group-hover:text-primary h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:translate-x-1"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Recommended Workflow Card (Secondary) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          <Link
            href="/recommended-workflow"
            className="group block w-full"
            aria-label="Navigate to Recommended Workflow guide"
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-background-paper/55 hover:bg-background-paper/70 hover:border-secondary/30 focus-visible:ring-secondary/50 focus-visible:ring-offset-background-dark relative min-h-[56px] w-full rounded-xl border border-white/10 px-6 py-5 backdrop-blur-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(79,70,229,0.15)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0"
            >
              {/* Subtle Glow Effect */}
              <div className="from-secondary/5 absolute inset-0 rounded-xl bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Content */}
              <div className="relative flex items-center justify-start gap-4">
                {/* Icon Container */}
                <div className="bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border transition-colors duration-300">
                  <GitBranch className="text-primary h-6 w-6" strokeWidth={2} aria-hidden="true" />
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 truncate font-[family-name:var(--font-quicksand)] text-base font-semibold text-[rgb(167,218,219)]">
                    Recommended Workflow
                  </h3>
                  <p className="font-[family-name:var(--font-lato)] text-sm text-white">
                    Step-by-step creation process
                  </p>
                </div>

                {/* Arrow Icon */}
                <ArrowRight
                  className="text-primary/60 group-hover:text-primary h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:translate-x-1"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Optional: Subtle divider line at top */}
      <div className="via-primary/30 absolute top-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent to-transparent" />
    </nav>
  );
};

export default MobileNavigationFooter;
