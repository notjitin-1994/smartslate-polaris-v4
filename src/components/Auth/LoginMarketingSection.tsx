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
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, #a7dadb15, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative z-10 mb-6">
        <div className="relative inline-block">
          <div
            className="absolute inset-0 opacity-50 blur-lg"
            style={{ background: 'rgba(167,218,219,0.2)' }}
            aria-hidden="true"
          />
          <img src="/logo.png" alt="Smartslate" className="relative z-10 h-8 w-auto" />
        </div>
      </div>

      {/* Enhanced Hero Section */}
      <div className="relative z-10 mb-10 text-left">
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading mb-4 text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
            Transform Learning Design
            <span className="relative mt-2 block" style={{ color: '#a7dadb' }}>
              from Weeks to Hours
            </span>
          </h1>

          {/* Sparkle Accent */}
          <motion.div
            className="text-primary absolute -top-4 -right-8"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            <SparklesIcon className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.p
          className="text-base leading-relaxed font-medium text-white/80 md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          AI-assisted Learning Experience Design for professionals. Select the role that best
          <br />
          aligns with your needs to know how Smartslate Polaris makes your life easier:
        </motion.p>
      </div>

      {/* Top - Modern Tab Navigation */}
      <nav
        role="tablist"
        aria-label="Choose your professional role"
        className="relative z-10 mb-10"
      >
        {/* Tab Container with Background Track */}
        <div className="relative rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
          <div className="scrollbar-none flex gap-1 overflow-x-auto">
            {personasData.map((persona) => {
              const isActive = activePersona === persona.id;

              return (
                <button
                  key={persona.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`persona-panel-${persona.id}`}
                  id={`persona-tab-${persona.id}`}
                  onClick={() => setActivePersona(persona.id)}
                  className={`group focus:ring-primary/50 relative flex min-w-[110px] flex-col items-center justify-center rounded-lg px-3 py-1.5 text-center transition-all duration-200 ease-out focus:ring-2 focus:outline-none ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  {/* Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: '#a7dadb',
                        boxShadow:
                          '0 4px 12px rgba(167, 218, 219, 0.3), 0 0 20px rgba(167, 218, 219, 0.2)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}

                  {/* Two-line Label */}
                  <span
                    className={`font-heading relative z-10 text-[11px] leading-[1.3] font-bold tracking-tight transition-all duration-200 ${
                      isActive ? 'text-[#020C1B]' : 'text-current'
                    }`}
                  >
                    {persona.id === 'lxd-specialist' ? (
                      <>
                        <span className="block">Learning Experience</span>
                        <span className="block">Designer</span>
                      </>
                    ) : (
                      persona.title.split(' ').map((word, i, arr) => (
                        <span key={i} className="block">
                          {i === arr.length - 1 ? word : `${word} `}
                        </span>
                      ))
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom - Content Area */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Tab Content - Scrollable area */}
        <div className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1 overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePersona}
              id={`persona-panel-${activePersona}`}
              role="tabpanel"
              aria-labelledby={`persona-tab-${activePersona}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-left"
            >
              {/* Enhanced Persona Header */}
              <div className="mb-8">
                <div className="flex items-start gap-4">
                  <motion.div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl shadow-xl"
                    style={{
                      background: '#a7dadb30',
                      boxShadow: '0 8px 32px #a7dadb30',
                    }}
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                  >
                    {currentPersona.icon}
                  </motion.div>
                  <div className="flex-1">
                    <h2
                      className="font-heading mb-2 text-2xl font-bold"
                      style={{ color: '#a7dadb' }}
                    >
                      {currentPersona.title}
                    </h2>
                    <p className="text-base font-medium text-white/80">{currentPersona.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Benefits + Metrics */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
                {/* Left: Enhanced Benefits List */}
                <div>
                  <h3
                    className="mb-5 flex items-center gap-2 text-sm font-bold tracking-wider uppercase"
                    style={{ color: '#a7dadb' }}
                  >
                    <span className="h-1 w-8 rounded-full" style={{ backgroundColor: '#a7dadb' }} />
                    Key Benefits
                  </h3>
                  <ul className="space-y-3.5">
                    {currentPersona.benefits.map((benefit, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.4, ease: 'easeOut' }}
                        className="group flex items-start gap-3 rounded-lg p-2 transition-all duration-300 hover:bg-white/[0.03]"
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <CheckCircleIcon
                            className="mt-0.5 h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:drop-shadow-lg"
                            style={{
                              color: '#a7dadb',
                              filter: 'drop-shadow(0 0 8px #a7dadb40)',
                            }}
                          />
                        </motion.div>
                        <span className="text-sm leading-relaxed text-white/85 transition-colors duration-300 group-hover:text-white">
                          {benefit}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Right: Perpetually Animated Infographic Metric Cards */}
                {currentPersona.stats && currentPersona.stats.length > 0 && (
                  <div className="flex flex-col gap-4 lg:w-56">
                    <h3
                      className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider uppercase"
                      style={{ color: '#a7dadb' }}
                    >
                      <span
                        className="h-1 w-6 rounded-full"
                        style={{ backgroundColor: '#a7dadb' }}
                      />
                      Impact Metrics
                    </h3>
                    <div className="flex flex-col gap-4">
                      {currentPersona.stats.map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: 0.1 * i,
                            duration: 0.5,
                            ease: 'easeOut',
                          }}
                          className="group relative cursor-default overflow-hidden rounded-2xl p-6"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px #a7dadb20',
                          }}
                        >
                          {/* Static Border with Subtle Glow */}
                          <div
                            className="absolute inset-0 rounded-2xl opacity-60"
                            style={{
                              background: '#a7dadb',
                              padding: '1px',
                              WebkitMask:
                                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                              WebkitMaskComposite: 'xor',
                              maskComposite: 'exclude',
                            }}
                          />

                          {/* Static Glow Effect */}
                          <div
                            className="absolute inset-0 rounded-2xl opacity-40"
                            style={{
                              background:
                                'radial-gradient(circle at top right, #a7dadb40, transparent 60%)',
                            }}
                            aria-hidden="true"
                          />

                          {/* Subtle Shimmer Effect on Hover Only */}
                          <div
                            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                            style={{
                              background:
                                'linear-gradient(110deg, transparent 30%, #a7dadb20 50%, transparent 70%)',
                              backgroundSize: '200% 100%',
                            }}
                            aria-hidden="true"
                          />

                          <div className="relative z-10">
                            {/* Static Counter with Hover Effect */}
                            <div
                              className="font-heading mb-2 text-4xl leading-none font-extrabold transition-transform duration-300 group-hover:scale-105"
                              style={{
                                color: '#a7dadb',
                                textShadow: '0 4px 12px #a7dadb40',
                              }}
                            >
                              {stat.value}
                              <span className="text-2xl font-bold">{stat.suffix}</span>
                            </div>

                            {/* Label with Enhanced Typography */}
                            <div className="text-xs leading-tight font-semibold tracking-wide text-white/80 uppercase">
                              {stat.label}
                            </div>
                          </div>

                          {/* 3D Corner Accent - Static */}
                          <div
                            className="absolute -top-2 -right-2 h-20 w-20 rounded-full opacity-40 blur-2xl"
                            style={{
                              background: 'radial-gradient(circle, #a7dadb, transparent 60%)',
                            }}
                            aria-hidden="true"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
