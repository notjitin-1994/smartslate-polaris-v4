'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FeedbackModal } from './FeedbackModal';
import { FeatureRequestModal } from './FeatureRequestModal';

/**
 * FeedbackCard Component
 *
 * Main entry point for the feedback system on the homepage.
 * Displays two CTAs: Share Feedback and Request Feature.
 * Opens respective modals for user input.
 *
 * Accessibility: WCAG AA compliant with keyboard navigation,
 * focus management, and ARIA labels.
 */
export function FeedbackCard() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [featureRequestOpen, setFeatureRequestOpen] = useState(false);

  return (
    <>
      <GlassCard className="relative h-full overflow-hidden p-6 sm:p-8">
        {/* Background gradient decoration */}
        <div className="from-secondary/5 to-secondary/10 absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl" />

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-title text-foreground mb-3 font-bold">
            You Build the Future of Learning Design. We Build the Tools.
          </h3>
          <p className="text-body text-text-secondary mb-4 leading-relaxed">
            You know what works in the trenches of instructional design—the time-consuming
            workflows, the impossible stakeholder feedback loops, the gap between what tools promise
            and what L&D teams actually need. We're listening.
          </p>
          <p className="text-body text-text-secondary mb-4 leading-relaxed">
            Every insight you share goes straight to our product team, no filters. When you describe
            a frustration, we see a feature. When you envision a capability, we see our roadmap.
            This isn't corporate feedback theater—it's a direct line to the people building
            Smartslate Polaris every day. We prioritize what matters most to practitioners like you,
            because the best learning tools are designed <em>with</em> designers, not just{' '}
            <em>for</em> them.
          </p>
          <p className="text-body text-text-secondary leading-relaxed">
            Your expertise shapes where we go next. Whether it's a workflow tweak that saves you 20
            minutes daily or a breakthrough feature that transforms how you create personalized
            learning, we're here to build it together.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <TooltipProvider delayDuration={200}>
            {/* Share Feedback CTA */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => setFeedbackOpen(true)}
                  className="group flex-1 justify-center gap-2 bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30"
                  aria-label="Share your feedback about Smartslate Polaris"
                >
                  <MessageSquare
                    className="h-5 w-5 text-white transition-transform group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span className="text-white">Share Feedback</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-surface/95 max-w-xs border border-indigo-500/20 px-3 py-2 text-sm backdrop-blur-xl"
              >
                <p className="text-text-primary">
                  Tell us what's working, what isn't, and how we can improve
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Request Feature CTA */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => setFeatureRequestOpen(true)}
                  className="group hover:shadow-secondary/20 flex-1 justify-center gap-2 transition-all hover:shadow-lg"
                  aria-label="Request a new feature for Smartslate Polaris"
                >
                  <Sparkles
                    className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12"
                    aria-hidden="true"
                  />
                  <span>Request Feature</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-surface/95 border-secondary/20 max-w-xs border px-3 py-2 text-sm backdrop-blur-xl"
              >
                <p className="text-text-primary">
                  Describe the capability you need—we prioritize the most requested features
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Subtle decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-6 border-t border-white/5 pt-4"
        >
          <p className="text-caption text-text-secondary text-center">
            Your voice shapes our roadmap
          </p>
        </motion.div>
      </GlassCard>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* Feature Request Modal */}
      <FeatureRequestModal open={featureRequestOpen} onOpenChange={setFeatureRequestOpen} />
    </>
  );
}
