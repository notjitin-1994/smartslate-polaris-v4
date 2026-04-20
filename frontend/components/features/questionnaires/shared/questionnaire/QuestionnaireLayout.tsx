'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useResponsive } from '@/lib/design-system/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface QuestionnaireLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

type StaticSwirl = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  flip: boolean;
};

function createSeededRng(seed: number) {
  let t = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function QuestionnaireLayout({
  children,
  sidebar,
  header,
  footer,
  className,
}: QuestionnaireLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [swirls, setSwirls] = useState<StaticSwirl[]>([]);

  // Measure viewport for swirl background
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const h = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        window.innerHeight
      );
      setViewport({ width: w, height: h });
    };

    measure();
    window.addEventListener('resize', measure);

    const observer = new MutationObserver(() => {
      setTimeout(measure, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  // Generate swirl pattern
  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    const count = window.innerWidth < 768 ? 12 : 18;
    const minSize = 36;
    const maxSize = 72;
    const opacityMin = 0.02;
    const opacityMax = 0.06;
    const areaPadding = 60;

    const rng = createSeededRng(12345);
    const results: StaticSwirl[] = [];
    const maxAttempts = count * 10;
    const spacing = 12;

    for (let i = 0; i < count && i < maxAttempts; i++) {
      const size = minSize + rng() * (maxSize - minSize);
      const x = areaPadding + rng() * (viewport.width - areaPadding * 2);
      const y = areaPadding + rng() * (viewport.height - areaPadding * 2);
      const rotation = rng() * 360;
      const opacity = opacityMin + rng() * (opacityMax - opacityMin);
      const flip = rng() > 0.5;

      let overlaps = false;
      const r = size / 2;
      for (const existing of results) {
        const dx = x - existing.x;
        const dy = y - existing.y;
        const minDist = r + existing.size / 2 + spacing;
        if (dx * dx + dy * dy < minDist * minDist) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        results.push({ x, y, size, rotation, opacity, flip });
      }
    }

    setSwirls(results);
  }, [viewport]);

  // Adaptive layout based on screen size
  const layoutConfig = {
    mobile: {
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '0',
      gap: '0',
    },
    tablet: {
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '1rem',
      gap: '1.5rem',
    },
    desktop: {
      display: 'grid',
      gridTemplateColumns: sidebar ? '280px 1fr' : '1fr',
      padding: '2rem',
      gap: '2rem',
    },
  };

  const currentLayout = isMobile
    ? layoutConfig.mobile
    : isTablet
      ? layoutConfig.tablet
      : layoutConfig.desktop;

  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020C1B] via-[#0a1628] to-[#020C1B]',
        className
      )}
    >
      {/* Enhanced multi-layer ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Primary glow - top center */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(167, 218, 219, 0.08) 0%, rgba(167, 218, 219, 0.04) 30%, transparent 70%)',
          }}
        />
        {/* Secondary glow - bottom right */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(circle at 100% 100%, rgba(79, 70, 229, 0.06) 0%, rgba(79, 70, 229, 0.02) 40%, transparent 70%)',
          }}
        />
        {/* Tertiary accent - left center */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 0% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)',
          }}
        />
        {/* Animated subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(135deg, rgba(167, 218, 219, 0.03) 0%, transparent 50%, rgba(79, 70, 229, 0.03) 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradient-shift 20s ease infinite',
          }}
        />
      </div>

      {/* Enhanced swirl pattern with better distribution */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-0 overflow-hidden"
        style={{
          width: viewport.width,
          height: viewport.height,
        }}
      >
        {swirls.map((swirl, idx) => (
          <Image
            key={idx}
            src="/logo-swirl.png"
            alt=""
            width={Math.round(swirl.size)}
            height={Math.round(swirl.size)}
            className="absolute transition-opacity duration-1000 select-none"
            style={{
              left: swirl.x,
              top: swirl.y,
              opacity: swirl.opacity,
              transform: `translate(-50%, -50%) rotate(${swirl.rotation}deg) scaleX(${swirl.flip ? -1 : 1})`,
              pointerEvents: 'none',
              filter: 'blur(0.8px) brightness(1.1)',
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167, 218, 219, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 218, 219, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content container with proper z-index */}
      <div className="relative z-10">
        {/* Header */}
        {header && (
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {header}
          </motion.header>
        )}

        {/* Main Content Area - Enhanced spacing and max-width */}
        <main
          style={{
            display: currentLayout.display,
            flexDirection:
              'flexDirection' in currentLayout ? currentLayout.flexDirection : undefined,
            gridTemplateColumns:
              'gridTemplateColumns' in currentLayout
                ? currentLayout.gridTemplateColumns
                : undefined,
            padding: currentLayout.padding,
            gap: currentLayout.gap,
          }}
          className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          {/* Sidebar - Desktop Only with enhanced glass effect */}
          {sidebar && isDesktop && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="questionnaire-sidebar"
            >
              <div className="sticky top-6 space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                {sidebar}
              </div>
            </motion.aside>
          )}

          {/* Main Content with smooth entrance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex-1 space-y-6"
          >
            {/* Mobile/Tablet Sidebar - Top Position with glass effect */}
            {sidebar && !isDesktop && (
              <div className="mb-6 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
                {sidebar}
              </div>
            )}

            {children}
          </motion.div>
        </main>

        {/* Footer with enhanced glass morphism */}
        {footer && (
          <motion.footer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              isMobile
                ? 'fixed right-0 bottom-0 left-0 z-20 border-t border-white/10 bg-gradient-to-t from-[#020C1B] via-[#020C1B]/98 to-transparent shadow-2xl shadow-black/40 backdrop-blur-2xl'
                : 'mt-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-xl backdrop-blur-xl'
            )}
          >
            {footer}
          </motion.footer>
        )}
      </div>
    </div>
  );
}
