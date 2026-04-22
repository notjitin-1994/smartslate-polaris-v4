'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle,
  FileText,
  Target,
  Users,
  BookOpen,
  Zap,
  BarChart3,
  Edit3,
  Share2,
  Download,
  Presentation,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';
import MobileNavigationFooter from '@/components/MobileNavigationFooter';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.1)] bg-[rgb(2,12,27)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center text-left"
            >
              <div className="mb-6 inline-block rounded-full border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] px-4 py-2 shadow-[0_0_20px_rgba(167,218,219,0.3)]">
                <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                  Powered by <span className="text-[rgb(255,215,0)]">Solara Learning Engine</span>
                </span>
              </div>

              <h1 className="font-heading mb-6 text-4xl leading-tight font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                From Concept to Blueprint in{' '}
                <span className="text-[rgb(167,218,219)]">Under an Hour</span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-[rgb(176,197,198)] sm:text-xl">
                What takes weeks of meetings, interviews, and documentation now happens in minutes.
                Smartslate Polaris uses AI-powered questionnaires and Solara Learning Engine's
                advanced reasoning to capture 100% of your requirements and generate
                production-ready learning blueprints with zero revision cycles.
              </p>
            </motion.div>

            {/* Right Side - Animated Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden min-h-[500px] items-center justify-center lg:flex"
            >
              <div className="relative flex h-[500px] w-[480px] items-center justify-center">
                {/* Subtle Background Glow - More Refined */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.15, 0.25, 0.15],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute h-[300px] w-[300px] rounded-full bg-[rgb(167,218,219)] blur-[80px]"
                />

                {/* Learning Path Flow - Visual Metaphor for Curriculum Design */}
                <div className="relative h-full w-full">
                  {/* Module Cards - Staggered Vertical Stack */}
                  {[
                    { title: 'Foundation', progress: 100, icon: Target, delay: 0 },
                    { title: 'Core Content', progress: 75, icon: BookOpen, delay: 0.15 },
                    { title: 'Assessment', progress: 45, icon: CheckCircle, delay: 0.3 },
                  ].map((module, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -40, y: 20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.6,
                        delay: 0.4 + module.delay,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="absolute"
                      style={{
                        left: `${20 + index * 15}px`,
                        top: `${80 + index * 110}px`,
                        zIndex: 3 - index,
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="w-[280px] rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.85)] p-4 shadow-xl backdrop-blur-md"
                        style={{
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(167,218,219,0.1)',
                        }}
                      >
                        {/* Module Header */}
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                            <module.icon className="h-4 w-4 text-[rgb(167,218,219)]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[rgb(224,224,224)]">
                              {module.title}
                            </div>
                            <div className="text-xs text-[rgb(176,197,198)]">
                              Module {index + 1}
                            </div>
                          </div>
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              delay: index * 0.3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="h-2 w-2 rounded-full bg-[rgb(167,218,219)]"
                          />
                        </div>

                        {/* Progress Indicator */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-[rgb(176,197,198)]">
                            <span>Progress</span>
                            <span>{module.progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(167,218,219,0.1)]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${module.progress}%` }}
                              transition={{
                                duration: 1.2,
                                delay: 0.6 + module.delay,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              className="h-full rounded-full bg-gradient-to-r from-[rgb(167,218,219)] to-[rgb(123,197,199)]"
                            />
                          </div>
                        </div>

                        {/* Content Lines - Blueprint Visual */}
                        <div className="mt-3 space-y-1.5">
                          {[0, 1, 2].map((line) => (
                            <motion.div
                              key={line}
                              initial={{ width: 0, opacity: 0 }}
                              animate={{
                                width: `${[85, 70, 60][line]}%`,
                                opacity: [0.6, 0.4, 0.3][line],
                              }}
                              transition={{
                                duration: 0.8,
                                delay: 0.8 + module.delay + line * 0.1,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              className="h-1 rounded-full bg-[rgb(167,218,219)]"
                            />
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Connecting Lines - Learning Pathway */}
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ zIndex: 1 }}
                  >
                    {[0, 1].map((index) => {
                      const startY = 135 + index * 110;
                      const endY = startY + 110;
                      const startX = 150;
                      const endX = 165;

                      return (
                        <motion.path
                          key={index}
                          d={`M ${startX} ${startY} Q ${startX + 20} ${startY + 55}, ${endX} ${endY}`}
                          stroke="rgba(167,218,219,0.3)"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{
                            duration: 1,
                            delay: 0.7 + index * 0.15,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* AI Processing Indicator - Central Focus */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="absolute top-1/2 right-12 -translate-y-1/2"
                    style={{ zIndex: 5 }}
                  >
                    <div className="relative">
                      {/* Outer Ring - AI Processing */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="absolute inset-0 h-24 w-24 rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, rgba(167,218,219,0) 0%, rgba(167,218,219,0.4) 50%, rgba(167,218,219,0) 100%)',
                        }}
                      />

                      {/* Inner Circle */}
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[rgba(167,218,219,0.3)] bg-[rgb(13,27,42)]">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Sparkles className="h-10 w-10 text-[rgb(167,218,219)]" />
                        </motion.div>

                        {/* Data Particles Flowing In */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute h-1.5 w-1.5 rounded-full bg-[rgb(167,218,219)]"
                            initial={{
                              x: -60,
                              y: -20 + i * 20,
                              opacity: 0,
                              scale: 0,
                            }}
                            animate={{
                              x: 0,
                              y: 0,
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.4,
                              repeat: Infinity,
                              repeatDelay: 1.5,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                          />
                        ))}
                      </div>

                      {/* Blueprint Generated Label */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.6 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(167,218,219)]">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="h-1.5 w-1.5 rounded-full bg-[rgb(167,218,219)]"
                          />
                          <span>Solara AI</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Output Indicator - Generated Blueprint */}
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="absolute top-1/2 right-0 -translate-y-1/2"
                    style={{ zIndex: 4 }}
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(167,218,219,0.3)',
                          '0 0 30px rgba(167,218,219,0.5)',
                          '0 0 20px rgba(167,218,219,0.3)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="flex h-20 w-16 items-center justify-center rounded-lg border-2 border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] backdrop-blur-sm"
                    >
                      <FileText className="h-8 w-8 text-[rgb(167,218,219)]" />
                    </motion.div>
                  </motion.div>

                  {/* Floating Metrics - Enterprise Grade */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.8 }}
                    className="absolute top-4 right-20 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.9)] px-3 py-1.5 backdrop-blur-sm"
                    style={{ zIndex: 6 }}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <BarChart3 className="h-3 w-3 text-[rgb(167,218,219)]" />
                      <span className="font-medium text-[rgb(224,224,224)]">
                        100% Requirement Capture
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 2 }}
                    className="absolute bottom-8 left-24 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.9)] px-3 py-1.5 backdrop-blur-sm"
                    style={{ zIndex: 6 }}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-[rgb(167,218,219)]" />
                      <span className="font-medium text-[rgb(224,224,224)]">
                        1-3 Min Generation
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: Intelligent Questionnaires */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(79,70,229,0.1)] px-4 py-2">
              <Sparkles className="h-5 w-5 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">Zero Guesswork</span>
            </div>
            <h2 className="font-heading mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              AI-Powered Requirements Capture
            </h2>
            <p className="text-lg text-[rgb(176,197,198)]">
              Replace weeks of stakeholder interviews with a 45-minute intelligent questionnaire.
              Our two-phase system uses Solara Learning Engine to ask exactly the right questions
              based on your context—no detail missed, no revision cycles needed.
            </p>
          </motion.div>

          {/* Foundation Questionnaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                <Target className="h-6 w-6 text-[rgb(167,218,219)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[rgb(224,224,224)]">
                  Phase 1: Context Foundation (10 minutes)
                </h3>
                <p className="text-[rgb(176,197,198)]">
                  Three focused sections to establish your baseline
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <h4 className="font-semibold text-[rgb(224,224,224)]">Your Role & Context</h4>
                </div>
                <p className="mb-4 text-sm text-[rgb(176,197,198)]">
                  Tell us about yourself—your role, experience level, team size, and the tools you
                  work with. This lets Solara Learning Engine generate recommendations that match
                  your actual working environment and constraints.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Solo practitioners get automation-first, time-efficient solutions
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Large teams get collaboration and stakeholder management strategies
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Technical backgrounds get tool-specific implementation guidance
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <h4 className="font-semibold text-[rgb(224,224,224)]">Organization Details</h4>
                </div>
                <p className="mb-4 text-sm text-[rgb(176,197,198)]">
                  Industry, company size, geographic footprint, and compliance requirements. Every
                  blueprint accounts for your regulatory environment from day one.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Healthcare gets HIPAA-compliant platform recommendations
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      EU operations get GDPR data handling protocols
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Financial services get SOX audit trail specifications
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <h4 className="font-semibold text-[rgb(224,224,224)]">The Learning Challenge</h4>
                </div>
                <p className="mb-4 text-sm text-[rgb(176,197,198)]">
                  Describe what needs to be learned, who needs to learn it, and why it matters.
                  Include audience size, baseline knowledge, budget, and timeline constraints.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Large audiences get scalable delivery strategies
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Tight deadlines get rapid-deploy, phased rollout plans
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[rgb(167,218,219)]" />
                    <p className="text-sm text-[rgb(176,197,198)]">
                      Low budgets get cost-effective tool recommendations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border-l-4 border-[rgb(79,70,229)] bg-[rgba(79,70,229,0.1)] p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-1 h-5 w-5 flex-shrink-0 text-[rgb(255,215,0)]" />
                <div>
                  <h4 className="mb-2 font-semibold text-[rgb(224,224,224)]">
                    Why This Matters: No Revision Cycles
                  </h4>
                  <p className="text-sm leading-relaxed text-[rgb(176,197,198)]">
                    Traditional blueprint development requires 2-3 stakeholder review cycles because
                    details are missed in initial meetings. Our Phase 1 questionnaire captures
                    everything upfront, so Solara Learning Engine generates comprehensive blueprints
                    on the first pass—no back-and-forth, no forgotten requirements.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Adaptive Questionnaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                <Sparkles className="h-6 w-6 text-[rgb(167,218,219)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[rgb(224,224,224)]">
                  Phase 2: AI-Generated Deep Dive (30 minutes)
                </h3>
                <p className="text-[rgb(176,197,198)]">
                  50-70 custom questions designed specifically for your project
                </p>
              </div>
            </div>

            <p className="mb-8 text-lg leading-relaxed text-[rgb(176,197,198)]">
              Solara Learning Engine analyzes your Phase 1 answers and generates a unique
              questionnaire with 50-70 questions across 10 learning design domains. Every question
              is contextual—compliance training gets different questions than sales enablement. This
              replaces weeks of stakeholder workshops with one 30-minute session.
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: Target,
                  title: 'Learning Objectives',
                  desc: "Bloom's taxonomy-aligned, measurable outcomes",
                },
                {
                  icon: Users,
                  title: 'Target Audience',
                  desc: 'Demographics, personas, accessibility needs',
                },
                {
                  icon: BookOpen,
                  title: 'Content Scope',
                  desc: 'Topics, depth, sequencing, prerequisites',
                },
                {
                  icon: Lightbulb,
                  title: 'Instructional Strategy',
                  desc: 'Learning approaches, engagement tactics',
                },
                {
                  icon: Zap,
                  title: 'Learning Activities',
                  desc: 'Hands-on exercises, simulations, practice',
                },
                {
                  icon: CheckCircle,
                  title: 'Assessment Design',
                  desc: 'Formative, summative, performance-based',
                },
                {
                  icon: FileText,
                  title: 'Resources & Materials',
                  desc: 'Content assets, SME needs, existing materials',
                },
                {
                  icon: BarChart3,
                  title: 'Technology Stack',
                  desc: 'LMS, authoring tools, integrations',
                },
                {
                  icon: Clock,
                  title: 'Implementation Plan',
                  desc: 'Timelines, milestones, stakeholder management',
                },
                {
                  icon: TrendingUp,
                  title: 'Success Metrics',
                  desc: 'KPIs, analytics, business impact measures',
                },
              ].map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-[rgba(167,218,219,0.15)]">
                    <section.icon className="h-4 w-4 text-[rgb(167,218,219)]" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">
                    {section.title}
                  </h4>
                  <p className="text-xs text-[rgb(176,197,198)]">{section.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6">
                <h4 className="mb-4 text-lg font-semibold text-[rgb(224,224,224)]">
                  27+ Input Types for Precision
                </h4>
                <p className="mb-4 text-sm text-[rgb(176,197,198)]">
                  Each question uses the optimal input format—radio pills for quick selections,
                  sliders for ranges, multi-select for technology stacks, currency fields for
                  budgets. Auto-save every 30 seconds means you can complete it across multiple
                  sessions.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-[rgb(224,224,224)]">
                        Smart Question Types
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-[rgb(176,197,198)]">
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Sliders:</strong> Budget ranges, audience sizes, time constraints
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Multi-select:</strong> Technology platforms, learning modalities,
                          compliance needs
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Scales:</strong> Priority rankings, confidence levels, baseline
                          knowledge
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Long-form:</strong> Strategic context, business justification,
                          stakeholder needs
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[rgb(167,218,219)]" />
                      <span className="font-medium text-[rgb(224,224,224)]">
                        Built for Efficiency
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-[rgb(176,197,198)]">
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Auto-save:</strong> Never lose progress, complete across multiple
                          sessions
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Section navigation:</strong> Progress tracker shows completion
                          status
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Accessibility-first:</strong> WCAG AA compliant, keyboard
                          navigation
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[rgb(167,218,219)]">•</span>
                        <span>
                          <strong>Mobile-responsive:</strong> Complete on desktop, tablet, or phone
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-[rgb(79,70,229)] bg-[rgba(79,70,229,0.1)] p-6">
                <div className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <div>
                    <h4 className="mb-2 font-semibold text-[rgb(224,224,224)]">
                      45 Minutes, Not 45 Hours
                    </h4>
                    <p className="text-sm leading-relaxed text-[rgb(176,197,198)]">
                      Traditional needs analysis involves scheduling multiple 2-hour stakeholder
                      workshops, transcribing notes, identifying gaps, and running follow-up
                      sessions. Smartslate compresses this into 45 minutes of focused answers. The
                      result? Same quality, 95% less time investment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Blueprint Generation */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(79,70,229,0.1)] px-4 py-2">
              <FileText className="h-5 w-5 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Production-Ready in 1-3 Minutes
              </span>
            </div>
            <h2 className="font-heading mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Comprehensive Learning Blueprints
            </h2>
            <p className="text-lg text-[rgb(176,197,198)]">
              Solara Learning Engine analyzes your complete questionnaire and generates a 20-30 page
              blueprint with executive summary, learning objectives, content modules, assessment
              strategies, implementation roadmap, and success metrics. Available in JSON, Markdown,
              PDF, and Word formats.
            </p>
          </motion.div>

          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                  <FileText className="h-5 w-5 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="text-2xl font-bold text-[rgb(224,224,224)]">Executive Summary</h3>
              </div>
              <p className="mb-4 text-[rgb(176,197,198)]">
                C-suite ready overview with business justification, high-level scope, success
                metrics, and resource requirements. Perfect for securing stakeholder buy-in.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">Business Context:</strong> Links
                    learning objectives to organizational goals and revenue impact
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">ROI Projections:</strong> Estimated
                    time-to-competency, performance lift, and cost-per-learner
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">Risk Mitigation:</strong> Compliance
                    adherence, accessibility compliance, rollback strategies
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                  <Target className="h-5 w-5 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="text-2xl font-bold text-[rgb(224,224,224)]">Learning Objectives</h3>
              </div>
              <p className="mb-4 text-[rgb(176,197,198)]">
                Bloom's Taxonomy-aligned, measurable outcomes written in ABCD format (Audience,
                Behavior, Condition, Degree). Ensures clear success criteria.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">Terminal Objectives:</strong>{' '}
                    End-of-program competencies mapped to job roles
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">Enabling Objectives:</strong>{' '}
                    Prerequisite skills broken down by module
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                  <span className="text-[rgb(176,197,198)]">
                    <strong className="text-[rgb(224,224,224)]">Cognitive Levels:</strong> Mapped to
                    Remember, Understand, Apply, Analyze, Evaluate, Create
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* All Blueprint Sections */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Target Audience Analysis',
                desc: 'Demographics, personas, prior knowledge, motivation drivers, accessibility needs, and device/environment constraints.',
              },
              {
                icon: BookOpen,
                title: 'Content Architecture',
                desc: 'Module structure, topic sequencing, depth guidelines, prerequisite mapping, and content reuse strategy.',
              },
              {
                icon: Lightbulb,
                title: 'Instructional Strategy',
                desc: 'Learning approach (constructivist, cognitivist, experiential, self-directed), engagement tactics, scaffolding design, and differentiation.',
              },
              {
                icon: Zap,
                title: 'Learning Activities',
                desc: 'Hands-on exercises, simulations, case studies, group work, and practice opportunities aligned to objectives.',
              },
              {
                icon: CheckCircle,
                title: 'Assessment Framework',
                desc: 'Formative checks, summative exams, performance tasks, rubrics, passing criteria, and remediation paths.',
              },
              {
                icon: FileText,
                title: 'Content & Resources',
                desc: 'Asset inventory, SME requirements, existing material adaptation, licensing needs, and content development plan.',
              },
              {
                icon: BarChart3,
                title: 'Technology Stack',
                desc: 'LMS selection criteria, authoring tool recommendations, integrations (SSO, HRIS), and infrastructure requirements.',
              },
              {
                icon: Clock,
                title: 'Implementation Roadmap',
                desc: 'Phase breakdown, milestones, stakeholder touchpoints, pilot strategy, and scaling plan.',
              },
              {
                icon: TrendingUp,
                title: 'Evaluation & Analytics',
                desc: 'Kirkpatrick Level 1-4 measures, KPIs, data collection methods, reporting cadence, and continuous improvement loops.',
              },
            ].map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                  <section.icon className="h-5 w-5 text-[rgb(167,218,219)]" />
                </div>
                <h4 className="mb-2 font-semibold text-[rgb(224,224,224)]">{section.title}</h4>
                <p className="text-sm leading-relaxed text-[rgb(176,197,198)]">{section.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.05)] p-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.2)]">
                <Shield className="h-6 w-6 text-[rgb(167,218,219)]" />
              </div>
              <div>
                <h4 className="mb-2 text-xl font-bold text-[rgb(224,224,224)]">
                  Framework-Aligned, Industry-Validated
                </h4>
                <p className="mb-4 leading-relaxed text-[rgb(176,197,198)]">
                  Every blueprint section adheres to evidence-based instructional design frameworks:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">ADDIE Model:</strong> Analysis,
                      Design, Development, Implementation, Evaluation phases
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">Bloom's Taxonomy:</strong>{' '}
                      Cognitive domain alignment for objective-setting
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">Kirkpatrick Model:</strong>{' '}
                      Reaction, Learning, Behavior, Results evaluation framework
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">SAM Methodology:</strong>{' '}
                      Successive Approximation for iterative design
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">WCAG AA:</strong> Accessibility
                      standards for universal design
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">
                      <strong className="text-[rgb(224,224,224)]">Action Mapping:</strong>{' '}
                      Performance gap → practice activity → content
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Features */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(79,70,229,0.1)] px-4 py-2">
              <Zap className="h-5 w-5 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Complete Workflow
              </span>
            </div>
            <h2 className="font-heading mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Share, Export, and Manage Blueprints
            </h2>
            <p className="text-lg text-[rgb(176,197,198)]">
              Once generated, your blueprints are fully yours—export to any format, share with
              stakeholders via public links, or keep them private in your dashboard. Every blueprint
              is instantly production-ready.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Share */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(79,70,229,0.2)]">
                <Share2 className="h-6 w-6 text-[rgb(79,70,229)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[rgb(224,224,224)]">Public Share Links</h3>
              <p className="mb-4 text-[rgb(176,197,198)]">
                Generate unique share URLs for any blueprint. Stakeholders view read-only versions
                without creating accounts. Perfect for client presentations, vendor RFPs, or
                executive reviews.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>No authentication required to view</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>SEO-optimized with Open Graph tags</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Copy link and share instantly</span>
                </div>
              </div>
            </motion.div>

            {/* Download */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(79,70,229,0.2)]">
                <Download className="h-6 w-6 text-[rgb(79,70,229)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[rgb(224,224,224)]">
                Multi-Format Export
              </h3>
              <p className="mb-4 text-[rgb(176,197,198)]">
                Download blueprints in four professional formats. PDF for presentations, Word for
                collaborative editing, Markdown for documentation systems, JSON for integrations.
                Batch export to ZIP for multiple blueprints.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>PDF with brand styling (print-ready)</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Word (.docx) for Microsoft Office</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Markdown for Git repos and wikis</span>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(79,70,229,0.2)]">
                <BarChart3 className="h-6 w-6 text-[rgb(79,70,229)]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[rgb(224,224,224)]">
                Centralized Dashboard
              </h3>
              <p className="mb-4 text-[rgb(176,197,198)]">
                View all blueprints with status indicators (draft, generating, completed). Create,
                rename, delete, and share from one interface. Filter and search by name or status.
                Track usage against your subscription limits.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Real-time status tracking</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Quick actions (share, export, delete)</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(176,197,198)]">
                  <CheckCircle className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span>Usage meters and limits</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid gap-6 md:grid-cols-2"
          >
            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[rgb(224,224,224)]">
                <Target className="h-5 w-5 text-[rgb(167,218,219)]" />
                Usage-Based Subscription Tiers
              </h4>
              <p className="text-sm text-[rgb(176,197,198)]">
                Start free with 5 blueprints per month. Scale up to Navigator (25/mo), Voyager
                (50/mo), or team plans (Crew, Fleet, Armada). Enterprise tier offers unlimited
                blueprints with custom pricing. Pay only for what you use.
              </p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[rgb(224,224,224)]">
                <Shield className="h-5 w-5 text-[rgb(167,218,219)]" />
                Account & Privacy Controls
              </h4>
              <p className="text-sm text-[rgb(176,197,198)]">
                Change passwords, manage active sessions, export all your data in JSON format, or
                submit account deletion requests. Full transparency and control over your data.
                GDPR-ready privacy practices.
              </p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[rgb(224,224,224)]">
                <Clock className="h-5 w-5 text-[rgb(167,218,219)]" />
                Auto-Save & Session Persistence
              </h4>
              <p className="text-sm text-[rgb(176,197,198)]">
                Questionnaires auto-save every 30 seconds. Start on desktop, finish on mobile. Your
                progress is never lost. Resume exactly where you left off, even across devices.
              </p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[rgb(224,224,224)]">
                <Zap className="h-5 w-5 text-[rgb(167,218,219)]" />
                Dual-Fallback AI System
              </h4>
              <p className="text-sm text-[rgb(176,197,198)]">
                Solara Learning Engine uses a sophisticated dual-fallback AI architecture for
                maximum reliability. Automatic failover ensures 99.9% uptime. You get consistent
                blueprint quality with enterprise-grade performance.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile-only navigation footer */}
      <MobileNavigationFooter />
    </div>
  );
}
