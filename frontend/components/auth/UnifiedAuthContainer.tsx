'use client';

import { useState } from 'react';
import type React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import SwirlBackground from '@/components/SwirlBackground';
import { LoginMarketingSection } from './LoginMarketingSection';
import { Footer } from '@/components/layout/Footer';

type AuthView = 'login' | 'signup' | 'forgot-password';

interface UnifiedAuthContainerProps {
  initialView: AuthView;
  children: (view: AuthView, setView: (view: AuthView) => void) => React.ReactNode;
  mobileMarketing?: React.ReactNode;
}

export function UnifiedAuthContainer({
  initialView,
  children,
  mobileMarketing,
}: UnifiedAuthContainerProps): React.JSX.Element {
  const [view, setView] = useState<AuthView>(initialView);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  const handleViewChange = (newView: AuthView) => {
    const viewOrder: AuthView[] = ['login', 'signup', 'forgot-password'];
    const currentIndex = viewOrder.indexOf(view);
    const newIndex = viewOrder.indexOf(newView);
    setDirection(newIndex > currentIndex ? 'left' : 'right');
    setView(newView);
  };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div className="relative flex h-screen h-[100svh] w-full flex-col overflow-hidden bg-[#020C1B] lg:flex-row">
      {/* Background Layer */}
      <SwirlBackground />
      
      {/* PREFETCH OPTIMIZATION */}
      <div className="sr-only">
        <img src="/marketing-bg.jpg" alt="" fetchPriority="high" aria-hidden="true" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(167, 218, 219, 0.08), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* LEFT PANEL: Marketing (Visible on lg+) */}
      <aside 
        className="relative z-10 hidden h-full w-[45%] flex-shrink-0 border-r border-white/5 overflow-hidden lg:block xl:w-[50%]"
        aria-label="Platform features"
      >
        {/* Background Image - Immediate Display */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.45 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full w-full"
            style={{
              backgroundImage: 'url(/marketing-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(2px) brightness(0.8) saturate(1.1)',
            }}
          />
        </div>
        
        {/* Glass Overlay Layer */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#020C1B]/80 via-[#020C1B]/60 to-[#020C1B]/90 backdrop-blur-[2px]" />

        {/* Content: Delayed Entry */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-auto flex h-full max-w-2xl flex-col justify-center p-8 xl:p-12"
        >
          <LoginMarketingSection />
        </motion.div>
      </aside>

      {/* RIGHT PANEL: Auth Form - Centered on Mobile */}
      <main className="relative z-10 flex h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:p-12">
        <div className="flex w-full max-w-md flex-col items-center justify-center lg:max-w-lg xl:max-w-xl">
          
          {/* Logo - Matching container width on mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 w-full lg:hidden"
          >
            <Image
              src="/logo.png"
              alt="Smartslate Polaris"
              width={500}
              height={100}
              className="h-auto w-full"
              priority
            />
          </motion.div>

          {/* Form Container: Centered entry */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="relative w-full"
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={view}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 400, damping: 35 },
                  opacity: { duration: 0.15 },
                }}
                className="w-full"
              >
                {children(view, handleViewChange)}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
