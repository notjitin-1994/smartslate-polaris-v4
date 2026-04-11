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
      <div className="relative z-10 mb-12">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shadow-[0_0_20px_rgba(167,218,219,0.1)]">
            <SparklesIcon className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-white leading-tight">
              SmartSlate <span className="text-primary-500">Polaris</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
              Discovery Engine v4.0
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-heading mb-6 text-4xl leading-[1.1] font-bold text-white lg:text-5xl tracking-tight">
            Design transformational
            <span className="block text-primary-500 italic font-serif mt-1">learning experiences.</span>
          </h1>

          <p className="text-lg leading-relaxed text-white/60 max-w-lg font-sans font-light">
            Empowering professionals to bridge the gap between complex concepts and 
            <span className="text-white/90 font-medium"> impactful instruction</span> in record time.
          </p>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <nav
        role="tablist"
        aria-label="Choose your professional role"
        className="relative z-10 mb-12"
      >
        <div className="flex flex-wrap gap-2">
          {personasData.map((persona) => {
            const isActive = activePersona === persona.id;

            return (
              <button
                key={persona.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePersona(persona.id)}
                className={`group relative flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 border ${
                  isActive
                    ? 'bg-primary-500 border-primary-500 text-[#020C1B] shadow-[0_4px_20px_rgba(167,218,219,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="relative z-10 uppercase tracking-wider text-[10px]">
                  {persona.label}
                </span>
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
            className="flex flex-col h-full"
          >
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_240px]">
              {/* Left: Persona Details */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px w-8 bg-primary-500/50" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-500">
                      Target Role
                    </span>
                  </div>
                  <h2 className="font-heading text-3xl font-bold text-white mb-3">
                    {currentPersona.title}
                  </h2>
                  <p className="text-lg text-white/70 font-medium leading-snug italic">
                    &quot;{currentPersona.subtitle}&quot;
                  </p>
                </div>

                <ul className="space-y-4">
                  {currentPersona.benefits.slice(0, 5).map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-start gap-4 group"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(167,218,219,0.8)] group-hover:scale-150 transition-transform duration-300" />
                      <span className="text-[15px] leading-relaxed text-white/60 group-hover:text-white/90 transition-colors">
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right: Metrics */}
              <div className="flex flex-col gap-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 px-1">
                  Proven Impact
                </span>
                {currentPersona.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl p-6 bg-white/[0.03] border border-white/5 group hover:border-primary-500/30 transition-colors duration-500"
                  >
                    <div className="relative z-10">
                      <div className="font-heading text-4xl font-extrabold text-white mb-1 tracking-tighter">
                        {stat.value}
                        <span className="text-primary-500 text-2xl ml-0.5">{stat.suffix}</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                        {stat.label}
                      </div>
                    </div>
                    {/* Subtle internal glow */}
                    <div className="absolute top-0 right-0 h-16 w-16 bg-primary-500/5 blur-2xl rounded-full" />
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
