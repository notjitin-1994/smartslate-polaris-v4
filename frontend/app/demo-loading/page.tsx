/**
 * Loading Screens Demo Page
 * Preview both dynamic questions and blueprint generation loading screens
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, Compass, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

type LoadingType = 'dynamic-questions' | 'blueprint-generation';

function DemoContent(): React.JSX.Element {
  const { user } = useAuth();
  const [activeDemo, setActiveDemo] = useState<LoadingType>('dynamic-questions');

  // For demo purposes, create a mock user if none exists
  const _demoUser = user || {
    id: 'demo-user',
    email: 'demo@smartslate.com',
    user_metadata: { name: 'Demo User' },
  };
  const [progress, setProgress] = useState(45); // Demo progress
  const [currentStep, setCurrentStep] = useState(2);

  // Toggle between demos
  const switchDemo = (type: LoadingType) => {
    setActiveDemo(type);
    setProgress(45);
    setCurrentStep(2);
  };

  // Demo configurations - matching actual loading screen experiences
  const demos = {
    'dynamic-questions': {
      title: 'Analyzing Mission Data',
      statusMessage: 'Mapping personalized waypoints...',
      steps: [
        'Analyzing your mission parameters',
        'Cross-referencing stellar archives',
        'Calibrating personalized vectors',
        'Assembling your navigation chart',
      ],
      stepCount: 4,
      badge: 'Perplexity Research',
      infoTitle: 'Trajectory Computation',
      primaryColor: 'primary',
    },
    'blueprint-generation': {
      title: 'Constructing Your Starmap',
      statusMessage: 'Mapping your learning universe...',
      steps: [
        'Synthesizing navigation data',
        'Plotting personalized learning coordinates',
        'Designing orbital trajectory strategies',
        'Assembling your complete starmap',
      ],
      stepCount: 6,
      badge: 'Gemini 3.1 Pro',
      infoTitle: 'Mission Status',
      primaryColor: 'primary',
    },
  };

  const config = demos[activeDemo];

  // Get the appropriate icon for the current demo
  const getDemoIcon = () => {
    return activeDemo === 'dynamic-questions' ? Telescope : Compass;
  };

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Primary gradient overlay */}
        <div className="bg-primary/[0.02] absolute inset-0" />

        {/* Floating orbital elements */}
        <motion.div
          className="border-primary/10 absolute top-1/4 left-1/4 h-32 w-32 rounded-full border"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-primary/60 absolute top-0 left-1/2 h-2 w-2 -translate-x-1 -translate-y-1 rounded-full" />
        </motion.div>

        <motion.div
          className="border-secondary/10 absolute right-1/4 bottom-1/3 h-24 w-24 rounded-full border"
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-secondary/60 absolute top-1/2 left-0 h-1 w-1 -translate-x-0.5 -translate-y-0.5 rounded-full" />
        </motion.div>

        {/* Sparkle effects */}
        {[...Array(6)].map((_, i) => {
          const topPositions = ['top-5', 'top-8', 'top-11', 'top-14', 'top-17', 'top-20'];
          const leftPositions = [
            'left-2.5',
            'left-10',
            'left-2.5',
            'left-10',
            'left-2.5',
            'left-10',
          ];

          return (
            <motion.div
              key={i}
              className={`bg-primary/40 absolute h-1 w-1 rounded-full ${topPositions[i]} ${leftPositions[i]}`}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Header with Tabbed Interface */}
      <header className="glass relative sticky top-0 z-50 overflow-hidden border-b border-neutral-200/50">
        {/* Subtle background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="bg-primary/[0.02] absolute inset-0" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Back button */}
            <div className="flex items-center">
              <Link
                href="/"
                className="group text-text-secondary hover:text-foreground focus-visible:ring-primary/50 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </div>

            {/* Center: Tabbed Interface */}
            <div className="flex flex-1 justify-center">
              <div className="glass-strong flex items-center gap-2 rounded-xl p-1">
                <button
                  onClick={() => switchDemo('dynamic-questions')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeDemo === 'dynamic-questions'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-text-secondary hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Telescope className="h-4 w-4" />
                  <span>Dynamic Questions</span>
                </button>
                <button
                  onClick={() => switchDemo('blueprint-generation')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeDemo === 'blueprint-generation'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-text-secondary hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  <span>Blueprint Generation</span>
                </button>
              </div>
            </div>

            {/* Right side: Spacer for balance */}
            <div className="w-9"></div>
          </div>
        </div>
      </header>

      {/* Dynamic Questions Demo Header - Only show for dynamic questions demo */}
      {activeDemo === 'dynamic-questions' && (
        <header className="glass relative overflow-hidden border-b border-neutral-200/50">
          {/* Subtle background effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="bg-primary/[0.02] absolute inset-0" />
          </div>

          {/* Content */}
          <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Back button */}
              <div className="flex items-center">
                <Link
                  href="/"
                  className="group text-text-secondary hover:text-foreground focus-visible:ring-primary/50 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                </Link>
              </div>

              {/* Center: Title */}
              <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
                {/* Main Title - Matching Static Wizard */}
                <div className="flex-1 text-center">
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    <span>Analyzing </span>
                    <span className="text-primary">Mission Data</span>
                  </h1>
                </div>
              </div>

              {/* Right side: Spacer for balance */}
              <div className="w-9"></div>
            </div>
          </div>
        </header>
      )}

      {/* Blueprint Generation Demo Header - Only show for blueprint generation demo */}
      {activeDemo === 'blueprint-generation' && (
        <header className="glass relative overflow-hidden border-b border-neutral-200/50">
          {/* Subtle background effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="bg-primary/[0.02] absolute inset-0" />
          </div>

          {/* Content */}
          <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Back button */}
              <div className="flex items-center">
                <Link
                  href="/"
                  className="group text-text-secondary hover:text-foreground focus-visible:ring-primary/50 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                </Link>
              </div>

              {/* Center: Title */}
              <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
                {/* Main Title - Matching Static Wizard */}
                <div className="flex-1 text-center">
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    <span>Constructing </span>
                    <span className="text-primary">Your Starmap</span>
                  </h1>
                </div>
              </div>

              {/* Right side: Spacer for balance */}
              <div className="w-9"></div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Enhanced Loading Screen Preview */}
      <main className="relative z-10 w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Main Loading Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card animate-scale-in space-y-8 rounded-3xl p-8 md:p-10"
            >
              {/* Icon Section */}
              <div className="relative mb-8 flex justify-center">
                <div className="relative">
                  <motion.div
                    className="bg-primary/10 ring-primary/20 flex h-24 w-24 items-center justify-center rounded-full ring-2"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0.2)',
                        '0 0 0 8px rgba(59, 130, 246, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {React.createElement(getDemoIcon(), {
                      className: `text-primary h-12 w-12`,
                    })}
                  </motion.div>

                  {/* Pulsing rings */}
                  <motion.div
                    className="border-primary/30 absolute inset-0 rounded-full border-2"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={activeDemo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-display text-foreground mb-2"
                  >
                    {activeDemo === 'dynamic-questions'
                      ? 'Plotting Trajectory'
                      : 'Plotting Stellar Coordinates'}
                  </motion.h1>
                </AnimatePresence>

                <motion.p
                  className="text-body text-text-secondary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {config.statusMessage}
                </motion.p>
              </div>

              {/* Progress Section */}
              <div className="space-y-6">
                <div className="mx-auto max-w-sm">
                  <div className="text-text-secondary mb-3 flex justify-between text-sm font-medium">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="bg-surface/50 h-3 overflow-hidden rounded-full backdrop-blur-sm">
                    <motion.div
                      className="h-full rounded-full bg-[var(--primary-accent)]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-3">
                  {Array.from({ length: config.stepCount }).map((_, index) => {
                    const step = index + 1;
                    return (
                      <motion.div
                        key={step}
                        className={`relative h-3 w-3 rounded-full ${
                          step < currentStep
                            ? 'bg-[var(--primary-accent-dark)]'
                            : step === currentStep
                              ? 'bg-[var(--primary-accent)] shadow-lg'
                              : 'bg-surface/60'
                        }`}
                        animate={
                          step === currentStep
                            ? {
                                scale: [1, 1.4, 1],
                                boxShadow: [
                                  '0 0 0 0 rgba(167, 218, 219, 0.4)',
                                  '0 0 0 8px rgba(167, 218, 219, 0)',
                                ],
                              }
                            : {}
                        }
                        transition={{
                          duration: 1.5,
                          repeat: step === currentStep ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      >
                        {step < currentStep && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 rounded-full bg-[var(--primary-accent-dark)]"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Powered by Solara Badge */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="glass-strong rounded-full px-6 py-3 text-sm backdrop-blur-md">
                  <span className="text-text-secondary">Powered by </span>
                  <span className="text-primary font-semibold">Solara</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Trajectory Computation Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-2xl p-6 backdrop-blur-md"
            >
              <h3 className="text-foreground mb-4 text-sm font-semibold">{config.infoTitle}</h3>

              <div className="space-y-3">
                {config.steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  const isFuture = stepNumber > currentStep;

                  return (
                    <motion.div
                      key={stepNumber}
                      className={`flex items-start gap-3 rounded-lg p-2 transition-colors ${
                        isCurrent ? 'bg-primary/5' : ''
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                          >
                            <CheckCircle className="text-success h-4 w-4" />
                          </motion.div>
                        ) : isCurrent ? (
                          <motion.div
                            className="border-primary h-4 w-4 rounded-full border-2 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <div className="border-surface h-4 w-4 rounded-full border-2" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isFuture ? 'text-text-disabled' : 'text-text-secondary'
                        }`}
                      >
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Demo Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-strong mt-8 rounded-xl p-6"
          >
            <h3 className="text-foreground mb-4 text-sm font-semibold">Demo Controls</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-text-secondary mb-2 block text-xs">Progress</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`text-${config.primaryColor} mt-1 text-center text-xs`}>
                  {Math.round(progress)}%
                </div>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">Current Step</label>
                <input
                  type="range"
                  min="1"
                  max={config.stepCount}
                  value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`text-${config.primaryColor} mt-1 text-center text-xs`}>
                  Step {currentStep} of {config.stepCount}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-neutral-300 pt-4">
              <div className="text-text-secondary space-y-1 text-xs">
                <div>
                  <span className="font-semibold">Route:</span>{' '}
                  {activeDemo === 'dynamic-questions' ? '/loading/[id]' : '/generating/[id]'}
                </div>
                <div>
                  <span className="font-semibold">API:</span>{' '}
                  {activeDemo === 'dynamic-questions'
                    ? '/api/dynamic-questions'
                    : '/api/starmaps/generate'}
                </div>
                <div>
                  <span className="font-semibold">Redirect:</span>{' '}
                  {activeDemo === 'dynamic-questions' ? '/dynamic-wizard/[id]' : '/starmaps/[id]'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function DemoLoadingPage(): React.JSX.Element {
  return <DemoContent />;
}

