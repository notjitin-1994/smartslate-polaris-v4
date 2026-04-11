/**
 * LoginMarketingSection - Premium Marketing Content for Learning Professionals
 *
 * Features:
 * - 5 distinct learning professional personas
 * - Elevated glassmorphism tabbed interface
 * - Premium visual effects with ambient glows
 * - 3D-style metric cards with depth
 * - Enhanced typography and spacing
 * - Smooth animations and micro-interactions
 * - WCAG AA accessibility compliance
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon } from 'lucide-react';
import { personasData } from './personasData';
import type { PersonaType } from './types';

export function LoginMarketingSection() {
  const [activePersona, setActivePersona] = useState<PersonaType>(personasData[0].id);

  const currentPersona = personasData.find((p) => p.id === activePersona) || personasData[0];

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Ambient Background Glow - Static Teal */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, #a7dadb10, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Logo Area */}
      <div className="relative z-10 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img src="/logo.png" alt="SmartSlate" className="h-5 w-auto lg:h-6 object-contain" />
            <span className="font-heading text-base lg:text-lg font-bold tracking-tight text-white ml-2 leading-none">
              <span className="text-primary-500">Polaris</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-heading mb-3 text-2xl leading-[1.1] font-bold text-white lg:text-3xl tracking-tight">
            Design transformational
            <span className="block text-primary-500 italic font-serif">learning experiences.</span>
          </h1>

          <p className="text-sm leading-relaxed text-white/50 max-w-md font-sans font-light">
            Bridging the gap between complex concepts and 
            <span className="text-white/80 font-medium"> impactful instruction</span> in record time.
          </p>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <nav
        role="tablist"
        aria-label="Choose your professional role"
        className="relative z-10 mb-6 lg:mb-8"
      >
        <div className="flex flex-wrap gap-1.5">
          {personasData.map((persona) => {
            const isActive = activePersona === persona.id;

            return (
              <button
                key={persona.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePersona(persona.id)}
                className={`group relative flex items-center justify-center rounded-full px-3 py-1.5 text-[9px] font-bold transition-all duration-300 border uppercase tracking-wider ${
                  isActive
                    ? 'bg-primary-500 border-primary-500 text-[#020C1B] shadow-[0_4px_15px_rgba(167,218,219,0.2)]'
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                }`}
              >
                {persona.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <div className="relative z-10 flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_180px]">
              {/* Left: Persona Details */}
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-6 bg-primary-500/30" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-500/70">
                      Target Role
                    </span>
                  </div>
                  <h2 className="font-heading text-xl lg:text-2xl font-bold text-white mb-1">
                    {currentPersona.title}
                  </h2>
                  <p className="text-sm text-white/60 font-medium leading-snug italic">
                    &quot;{currentPersona.subtitle}&quot;
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {currentPersona.benefits.slice(0, 4).map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-primary-500 shadow-[0_0_5px_rgba(167,218,219,0.8)]" />
                      <span className="text-[12px] leading-tight text-white/50 group-hover:text-white/80 transition-colors">
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right: Metrics */}
              <div className="flex flex-row lg:flex-col gap-3">
                {currentPersona.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="flex-1 relative overflow-hidden rounded-xl p-4 bg-white/[0.02] border border-white/5"
                  >
                    <div className="relative z-10">
                      <div className="font-heading text-2xl font-extrabold text-white leading-none mb-1">
                        {stat.value}
                        <span className="text-primary-500 text-base ml-0.5">{stat.suffix}</span>
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-white/30">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
