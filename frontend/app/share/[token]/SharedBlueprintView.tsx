'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Plus, Rocket, Presentation } from 'lucide-react';
import { InteractiveBlueprintDashboard } from '@/components/features/blueprints/InteractiveBlueprintDashboard';
import { Footer } from '@/components/layout/Footer';
import { useMobileDetect } from '@/lib/hooks/useMobileDetect';
import type { BlueprintJSON } from '@/components/features/blueprints/types';

interface SharedBlueprintViewProps {
  blueprint: {
    id: string;
    title: string;
    created_at: string;
    blueprint_json: BlueprintJSON;
    blueprint_markdown?: string;
  };
}

export default function SharedBlueprintView({ blueprint }: SharedBlueprintViewProps) {
  const { shouldReduceAnimations, isMobile } = useMobileDetect();
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isSolaraButtonHovered, setIsSolaraButtonHovered] = useState(false);
  const [isPresentButtonHovered, setIsPresentButtonHovered] = useState(false);

  // Normalize blueprint data structure
  const normalizedBlueprint = blueprint.blueprint_json;

  // Extract executive summary for hero section
  const executiveSummary =
    typeof normalizedBlueprint?.executive_summary === 'string'
      ? normalizedBlueprint.executive_summary
      : normalizedBlueprint?.executive_summary?.content || 'No executive summary available.';

  return (
    <>
      {/* Main Content */}
      <div
        className="bg-background relative w-full overflow-x-hidden"
        style={{ overflowAnchor: 'none' }}
      >
        {/* Animated Background Pattern - Static on mobile for performance */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse" />
          <div className="bg-secondary/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse md:delay-1000" />
          <div className="bg-primary/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl md:animate-pulse md:delay-500" />
        </div>

        {/* Hero Section - Minimalistic Design */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Title Section - Clean Typography */}
            <div className="space-y-6">
              {/* Platform Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                {/* Mobile-optimized Platform Banner */}
                <div className="border-primary/40 inline-flex w-full items-center gap-2.5 rounded-full border bg-white/5 py-2 pr-4 pl-2 shadow-[0_0_20px_rgba(167,218,219,0.3)] sm:w-auto sm:text-sm">
                  <motion.div
                    className="relative h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7"
                    animate={shouldReduceAnimations ? {} : { rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Image
                      src="/logo-swirl.png"
                      alt="Smartslate Polaris Logo"
                      fill
                      className="relative object-contain p-0.5"
                    />
                  </motion.div>
                  <span className="text-text-secondary text-[10px] leading-tight font-medium sm:text-sm">
                    Built by <span className="text-primary font-semibold">Smartslate Polaris</span>{' '}
                    | Powered by{' '}
                    <span className="font-semibold text-yellow-400">Solara Learning Engine</span>
                  </span>
                </div>

                {/* Action Buttons Grid - Mobile Responsive */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:flex md:flex-wrap lg:flex-nowrap">
                  {/* Animated Create New Blueprint Button */}
                  <motion.button
                    onClick={() => window.open('https://polaris.smartslate.io', '_blank')}
                    onHoverStart={() => !isMobile && setIsButtonHovered(true)}
                    onHoverEnd={() => !isMobile && setIsButtonHovered(false)}
                    className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 md:w-auto"
                    style={{ minWidth: '48px' }}
                    initial={false}
                    animate={{
                      width: !isMobile && isButtonHovered ? '210px' : !isMobile ? '48px' : 'auto',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <motion.div
                      className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                      animate={{
                        rotate: isButtonHovered ? 90 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-white md:hidden">
                        Create New Blueprint
                      </span>
                    </motion.div>

                    <AnimatePresence>
                      {isButtonHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: 0.05 }}
                          className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                        >
                          Create New Blueprint
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Animated Present Button */}
                  <motion.button
                    onClick={() => window.open('https://polaris.smartslate.io', '_blank')}
                    onHoverStart={() => !isMobile && setIsPresentButtonHovered(true)}
                    onHoverEnd={() => !isMobile && setIsPresentButtonHovered(false)}
                    className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 md:w-auto"
                    style={{ minWidth: '48px' }}
                    initial={false}
                    animate={{
                      width:
                        !isMobile && isPresentButtonHovered ? '140px' : !isMobile ? '48px' : 'auto',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <motion.div
                      className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                      animate={{
                        scale: isPresentButtonHovered ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Presentation className="h-5 w-5 text-white" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-white md:hidden">Present</span>
                    </motion.div>

                    <AnimatePresence>
                      {isPresentButtonHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: 0.05 }}
                          className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                        >
                          Present
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Animated Explore Solara Button */}
                  <motion.button
                    onClick={() => window.open('https://solara.smartslate.io', '_blank')}
                    onHoverStart={() => !isMobile && setIsSolaraButtonHovered(true)}
                    onHoverEnd={() => !isMobile && setIsSolaraButtonHovered(false)}
                    className="bg-primary hover:bg-primary/90 active:bg-primary/80 relative col-span-2 flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full shadow-lg transition-colors active:scale-95 md:col-span-1 md:w-auto"
                    style={{ minWidth: '48px' }}
                    initial={false}
                    animate={{
                      width:
                        !isMobile && isSolaraButtonHovered ? '250px' : !isMobile ? '48px' : 'auto',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    {/* Icon Container */}
                    <motion.div
                      className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                      animate={{
                        rotate: isSolaraButtonHovered ? -15 : 0,
                        y: isSolaraButtonHovered ? -2 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Rocket className="h-5 w-5 text-black" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-black md:hidden">
                        Explore Solara Learning Engine
                      </span>
                    </motion.div>

                    {/* Desktop: Animated Text */}
                    <AnimatePresence>
                      {isSolaraButtonHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: 0.05 }}
                          className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-black md:inline"
                        >
                          Explore Solara Learning Engine
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-primary text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                {blueprint.title || 'Learning Blueprint'}
              </motion.h1>

              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-4"
              >
                {executiveSummary.split('\n').map((paragraph, index) => {
                  // Skip empty lines
                  if (!paragraph.trim()) return null;
                  return (
                    <p key={index} className="text-text-secondary text-lg leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Blueprint Content */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <InteractiveBlueprintDashboard
              blueprint={normalizedBlueprint}
              blueprintId={blueprint.id}
              isPublicView={true}
            />
          </motion.div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
