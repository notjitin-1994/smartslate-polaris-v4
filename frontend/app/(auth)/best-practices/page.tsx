'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle,
  Target,
  Users,
  Shield,
  BookOpen,
  Lightbulb,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  BarChart3,
  Zap,
  XCircle,
  Award,
  MessageSquare,
  ListChecks,
  Brain,
  ChevronRight,
} from 'lucide-react';

export default function BestPracticesPage() {
  return (
    <div className="min-h-screen bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.1)] bg-[rgb(2,12,27)]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center text-left"
            >
              <div className="mb-6 inline-block w-fit rounded-full border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
                <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                  Blueprint Quality Excellence
                </span>
              </div>

              <h1 className="font-heading mb-6 text-4xl leading-tight font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                Create <span className="text-[rgb(167,218,219)]">World-Class</span> Learning
                Blueprints
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-[rgb(176,197,198)] sm:text-xl">
                Smartslate Polaris uses a 4-phase workflow to capture 100 percent of your
                requirements and generate production-ready learning blueprints. Follow these best
                practices to maximize quality, ensure stakeholder alignment, and create blueprints
                that deliver measurable business impact.
              </p>

              <div className="flex flex-col gap-3 text-sm text-[rgb(176,197,198)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <span>Phase 1: Static questionnaire (10 min) - Establish baseline context</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <span>
                    Phase 2: Solara Learning Engine generates 50-70 custom questions (1-3 min)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <span>Phase 3: Dynamic questionnaire (30 min) - Deep dive answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[rgb(167,218,219)]" />
                  <span>
                    Phase 4: Solara Learning Engine generates 11-section blueprint (1-3 min)
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Animated Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden min-h-[500px] items-center justify-center lg:flex"
            >
              <div className="relative flex h-[500px] w-[480px] items-center justify-center">
                {/* Subtle Background Glow */}
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

                {/* Quality Indicators - Staggered Stack */}
                <div className="relative h-full w-full">
                  {[
                    { title: 'Stakeholder Alignment', score: 95, icon: Users, delay: 0 },
                    { title: 'Compliance Coverage', score: 100, icon: Shield, delay: 0.15 },
                    { title: 'Detail Precision', score: 92, icon: Target, delay: 0.3 },
                  ].map((metric, index) => (
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
                        delay: 0.4 + metric.delay,
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
                        {/* Metric Header */}
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                            <metric.icon className="h-4 w-4 text-[rgb(167,218,219)]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[rgb(224,224,224)]">
                              {metric.title}
                            </div>
                            <div className="text-xs text-[rgb(176,197,198)]">Quality Metric</div>
                          </div>
                          <div className="text-xl font-bold text-[rgb(167,218,219)]">
                            {metric.score} percent
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 overflow-hidden rounded-full bg-[rgba(167,218,219,0.1)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.score}%` }}
                            transition={{
                              duration: 1.2,
                              delay: 0.6 + metric.delay,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-[rgb(167,218,219)] to-[rgb(123,197,199)]"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Central Excellence Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="absolute top-1/2 right-12 -translate-y-1/2"
                    style={{ zIndex: 5 }}
                  >
                    <div className="relative">
                      {/* Rotating Ring */}
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

                      {/* Center Badge */}
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
                          <Award className="h-10 w-10 text-[rgb(167,218,219)]" />
                        </motion.div>
                      </div>

                      {/* Label */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 1.6 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        <div className="text-xs font-medium text-[rgb(167,218,219)]">
                          Excellence
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Floating Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.8 }}
                    className="absolute top-4 right-20 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.9)] px-3 py-1.5 backdrop-blur-sm"
                    style={{ zIndex: 6 }}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-[rgb(167,218,219)]" />
                      <span className="font-medium text-[rgb(224,224,224)]">
                        Zero Revision Cycles
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
                      <TrendingUp className="h-3 w-3 text-[rgb(167,218,219)]" />
                      <span className="font-medium text-[rgb(224,224,224)]">Production-Ready</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: Before You Begin */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <ListChecks className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Preparation Phase
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Before You Begin
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              Research shows that 67% of projects fail due to poor stakeholder alignment—not
              technical or financial obstacles. Invest 30-60 minutes in preparation to ensure your
              blueprint captures every requirement and delivers measurable business impact.
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Gather Stakeholder Input',
                  description:
                    'Use surveys, interviews, and workshops to capture diverse perspectives. Document learning objectives, success criteria, and constraints from all key stakeholders.',
                  tips: [
                    'Schedule 1:1 interviews with subject matter experts',
                    'Run focus groups with target learners',
                    'Survey leadership for strategic alignment',
                  ],
                },
                {
                  icon: Target,
                  title: 'Define SMART Objectives',
                  description:
                    'Create Specific, Measurable, Achievable, Relevant, and Time-bound learning objectives tied directly to business outcomes.',
                  tips: [
                    'What specific skills will learners gain?',
                    'How will success be measured?',
                    'What business metrics will improve?',
                  ],
                },
                {
                  icon: Shield,
                  title: 'Document Compliance Requirements',
                  description:
                    'List ALL compliance requirements (HIPAA, GDPR, SOC 2, ISO 27001, etc.). The Solara Learning Engine filters questions that violate your stated requirements.',
                  tips: [
                    'Review data privacy regulations',
                    'Identify industry-specific certifications',
                    'Note security clearance levels',
                  ],
                },
                {
                  icon: Clock,
                  title: 'Set Realistic Constraints',
                  description:
                    'Define your actual budget, timeline, team size, and resources. Internal consistency across these constraints is critical for blueprint quality.',
                  tips: [
                    'Budget: Include development and delivery costs',
                    'Timeline: Factor in review cycles',
                    'Team: List available FTE and external vendors',
                  ],
                },
                {
                  icon: Brain,
                  title: 'Profile Your Audience',
                  description:
                    'Understand demographics, prior knowledge, learning preferences, motivation factors, geographic distribution, and device access.',
                  tips: [
                    'Current skill level: Novice, intermediate, or expert?',
                    'Learning environment: Office, remote, or field?',
                    'Accessibility needs: Language, disabilities, time zones?',
                  ],
                },
                {
                  icon: FileText,
                  title: 'Organize Your Information',
                  description:
                    'Have key documents ready: existing training materials, job descriptions, competency frameworks, performance data, and stakeholder feedback.',
                  tips: [
                    'Create a shared folder with reference materials',
                    'Document existing learning programs',
                    'Compile performance gap analysis',
                  ],
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6 backdrop-blur-sm transition-all"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                    <item.icon className="h-6 w-6 text-[rgb(167,218,219)]" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[rgb(224,224,224)]">{item.title}</h3>
                  <p className="mb-4 text-[rgb(176,197,198)]">{item.description}</p>
                  <ul className="space-y-2">
                    {item.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="flex items-start gap-2 text-sm text-[rgb(176,197,198)]"
                      >
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Phase 1 Best Practices */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <BookOpen className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Phase 1: 10 Minutes
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Static Questionnaire Best Practices
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              Phase 1 establishes the baseline context that the Solara Learning Engine uses to
              generate your personalized Phase 2 questions. Specificity here determines the
              relevance of the 50-70 questions you'll receive.
            </p>

            <div className="space-y-12">
              {[
                {
                  section: 'Section 1: Role & Experience',
                  icon: Users,
                  dos: [
                    'Be specific about your current role (e.g., "Senior Learning Professional specializing in healthcare compliance training" vs generic titles)',
                    'Provide accurate years of experience to calibrate question complexity',
                    'Select ALL relevant industries from your background—this unlocks industry-specific best practices',
                    'Specify your team size accurately—solo practitioners get automation-first recommendations; large teams get collaboration strategies',
                  ],
                  donts: [
                    "Don't use generic job titles without context",
                    "Don't underestimate or overestimate your experience",
                    "Don't skip the technical skills field if you have development capabilities",
                  ],
                },
                {
                  section: 'Section 2: Organization & Compliance',
                  icon: Shield,
                  dos: [
                    'List your organization name for context (not used for tracking)',
                    'Select the industry sector that best matches your work—this triggers sector-specific compliance checks',
                    'Choose organization size accurately—budget and resource recommendations scale accordingly',
                    'List ALL compliance requirements: HIPAA for healthcare, GDPR for EU operations, SOC 2 for SaaS, etc.',
                    'Specify data sharing policies and security clearance levels if applicable',
                    'Document any legal restrictions in the optional field (export controls, industry regulations, contractual obligations)',
                  ],
                  donts: [
                    "Don't omit compliance requirements—the engine will generate questions you can't answer",
                    "Don't guess at organization size—this affects budget calculations",
                    "Don't skip the legal restrictions field if you have constraints",
                  ],
                },
                {
                  section: 'Section 3: Learning Gap & Objectives',
                  icon: Target,
                  dos: [
                    'Describe the specific problem your learning program will solve (performance gap, new skill requirement, regulatory mandate)',
                    'Quantify the target audience size—this affects delivery strategy recommendations',
                    'Specify current knowledge level: Are learners novices, have some experience, or are experts needing updates?',
                    'List primary motivation factors: Career advancement, compliance requirement, performance improvement, etc.',
                    'Indicate geographic distribution and device access—this determines delivery modality',
                    'Provide a realistic budget range (development + delivery costs)',
                  ],
                  donts: [
                    'Don\'t be vague ("improve skills" vs "reduce medication errors by 40% within 6 months")',
                    "Don't underestimate timeline—factor in stakeholder review cycles",
                    "Don't overstate budget if you have constraints—the engine will recommend unaffordable solutions",
                  ],
                },
              ].map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8 backdrop-blur-sm"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(167,218,219,0.15)]">
                      <section.icon className="h-7 w-7 text-[rgb(167,218,219)]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[rgb(224,224,224)]">
                      {section.section}
                    </h3>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[rgb(167,218,219)]" />
                        <h4 className="text-lg font-semibold text-[rgb(167,218,219)]">Do This</h4>
                      </div>
                      <ul className="space-y-3">
                        {section.dos.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-[rgb(176,197,198)]">
                            <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <h4 className="text-lg font-semibold text-red-400">Avoid This</h4>
                      </div>
                      <ul className="space-y-3">
                        {section.donts.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-[rgb(176,197,198)]">
                            <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-red-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Phase 2 & 3 Best Practices */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <Brain className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Phase 2 & 3: 35 Minutes
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Dynamic Questionnaire Best Practices
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              The Solara Learning Engine generates 10 sections with 5-7 questions each (50-70
              total), hyper-personalized to your Phase 1 inputs. This replaces weeks of stakeholder
              workshops with one 30-minute session.
            </p>

            <div className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8">
              <h3 className="mb-6 text-2xl font-bold text-[rgb(224,224,224)]">
                How Solara Generates Your Questions
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Target,
                    title: 'Role-Specific Language',
                    desc: 'C-Suite gets strategic questions, learning professionals get detailed questions',
                  },
                  {
                    icon: Shield,
                    title: 'Compliance Filtering',
                    desc: 'Excludes questions that violate your stated requirements',
                  },
                  {
                    icon: Lightbulb,
                    title: 'Industry Customization',
                    desc: '9 major industries with sector-specific best practices',
                  },
                  {
                    icon: Users,
                    title: 'Team Size Scaling',
                    desc: 'Solo practitioners get automation tips, large teams get collaboration strategies',
                  },
                  {
                    icon: BarChart3,
                    title: 'Budget-Aware',
                    desc: 'Recommendations scale to your stated budget range',
                  },
                  {
                    icon: Clock,
                    title: 'Timeline Realistic',
                    desc: 'Phases and milestones align with your delivery date',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                      <item.icon className="h-5 w-5 text-[rgb(167,218,219)]" />
                    </div>
                    <div>
                      <div className="mb-1 font-semibold text-[rgb(224,224,224)]">{item.title}</div>
                      <div className="text-sm text-[rgb(176,197,198)]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                <h3 className="mb-6 text-2xl font-bold text-[rgb(224,224,224)]">
                  Answering Strategies
                </h3>

                <div className="space-y-6">
                  {[
                    {
                      title: 'Be Specific, Not Generic',
                      good: '"New nurses will complete a 4-week hybrid program covering medication administration, patient assessment, and electronic health records. They\'ll shadow experienced nurses for 2 weeks, complete 20 online modules, and pass a competency assessment."',
                      bad: '"Train new employees on their job duties."',
                      why: 'Specific answers generate actionable blueprints. Generic answers produce generic blueprints.',
                    },
                    {
                      title: 'Reference Earlier Context',
                      good: '"Given our HIPAA requirements from Section 2, all training materials must be hosted on our compliant LMS. Patient data examples must use synthetic datasets only."',
                      bad: '"Use standard training materials."',
                      why: 'Context integration ensures all 10 sections align and respect your constraints.',
                    },
                    {
                      title: 'Provide Measurable Outcomes',
                      good: '"Success metrics: 90% pass rate on certification exam, 40% reduction in medication errors within 6 months, 85% nurse retention after 1 year."',
                      bad: '"Improve performance."',
                      why: 'Measurable outcomes enable the engine to recommend appropriate assessment strategies and KPIs.',
                    },
                    {
                      title: 'Use the Right Input Types',
                      good: 'Sliders for budget ranges, multi-select for learning modalities, scales for priority ranking, radio pills for single choices.',
                      bad: 'Rushing through without reading the question type.',
                      why: 'The platform offers 27+ input types designed for precision—use them.',
                    },
                  ].map((strategy, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="border-l-2 border-[rgb(167,218,219)] pl-6"
                    >
                      <h4 className="mb-3 text-lg font-bold text-[rgb(167,218,219)]">
                        {strategy.title}
                      </h4>
                      <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Good Example
                        </div>
                        <p className="text-sm text-[rgb(176,197,198)] italic">{strategy.good}</p>
                      </div>
                      <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-400">
                          <XCircle className="h-4 w-4" />
                          Bad Example
                        </div>
                        <p className="text-sm text-[rgb(176,197,198)] italic">{strategy.bad}</p>
                      </div>
                      <p className="text-sm text-[rgb(176,197,198)]">
                        <span className="font-semibold text-[rgb(167,218,219)]">
                          Why it matters:
                        </span>{' '}
                        {strategy.why}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                <h3 className="mb-6 text-2xl font-bold text-[rgb(224,224,224)]">
                  Pro Tips for Phase 3
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Zap, text: 'Auto-save runs every 30 seconds—no need to click save' },
                    { icon: Clock, text: 'Complete section-by-section, not all at once' },
                    {
                      icon: ListChecks,
                      text: 'Use the progress tracker to see which sections need attention',
                    },
                    {
                      icon: MessageSquare,
                      text: 'Read the help text for each question—it provides context',
                    },
                    { icon: Target, text: 'Take your time—specificity beats speed' },
                    {
                      icon: Lightbulb,
                      text: 'If unsure, provide a range or options rather than leaving blank',
                    },
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-[rgba(167,218,219,0.1)] bg-[rgba(13,27,42,0.3)] p-4"
                    >
                      <tip.icon className="mt-1 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                      <span className="text-[rgb(176,197,198)]">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Phase 4 & Quality */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <Award className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Phase 4: Blueprint Generation
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Blueprint Quality & Review
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              The Solara Learning Engine analyzes your complete questionnaire and generates an
              11-section, 20-30 page production-ready blueprint in 1-3 minutes. Here's how to review
              for quality and export effectively.
            </p>

            <div className="mb-12 grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                  11 Blueprint Sections
                </h3>
                <div className="space-y-3">
                  {[
                    'Executive Summary (2-3 paragraph narrative)',
                    'Learning Objectives (with baseline/target metrics)',
                    'Target Audience (demographics, percentages, preferences)',
                    'Instructional Strategy (modality allocations)',
                    'Content Outline (modules, topics, duration, activities)',
                    'Resources (human FTE, tools/platforms, budget)',
                    'Assessment Strategy (KPIs, measurement, passing criteria)',
                    'Implementation Timeline (phases, milestones, dependencies)',
                    'Risk Mitigation (probability, impact, strategies)',
                    'Success Metrics (baseline vs target, reporting)',
                    'Sustainability Plan (maintenance, updates, scaling)',
                  ].map((section, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-xs font-bold text-[rgb(167,218,219)]">
                        {i + 1}
                      </div>
                      <span className="text-[rgb(176,197,198)]">{section}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                  Quality Checklist
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Internal Consistency',
                      desc: 'Budget, timeline, and scope align across all 11 sections',
                    },
                    {
                      title: 'Compliance Respected',
                      desc: 'All recommendations respect your stated requirements (HIPAA, GDPR, etc.)',
                    },
                    {
                      title: 'Stakeholder Alignment',
                      desc: 'Learning objectives match business outcomes from Phase 1',
                    },
                    {
                      title: 'Actionable Details',
                      desc: 'Specific tasks, owners, dates, and deliverables—not vague recommendations',
                    },
                    {
                      title: 'Measurable Metrics',
                      desc: 'Clear KPIs with baseline, target, and measurement methods',
                    },
                    {
                      title: 'Risk Coverage',
                      desc: 'Identified risks include mitigation strategies and contingency plans',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-[rgba(167,218,219,0.1)] bg-[rgba(13,27,42,0.3)] p-4"
                    >
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                      <div>
                        <div className="mb-1 font-semibold text-[rgb(224,224,224)]">
                          {item.title}
                        </div>
                        <div className="text-sm text-[rgb(176,197,198)]">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8">
              <h3 className="mb-6 text-2xl font-bold text-[rgb(224,224,224)]">
                Export Format Guide
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    format: 'PDF',
                    icon: FileText,
                    when: 'Stakeholder presentations, executive reviews, final deliverables',
                    why: 'Brand-styled with interactive report design, professional appearance, cross-platform compatibility',
                  },
                  {
                    format: 'Microsoft Word',
                    icon: FileText,
                    when: 'Collaborative editing, template creation, detailed revisions',
                    why: 'Fully editable with rich text formatting, track changes support, familiar interface for non-technical stakeholders',
                  },
                  {
                    format: 'Markdown',
                    icon: FileText,
                    when: 'Version control (Git), documentation sites, developer handoff',
                    why: 'Plain text for easy diffing, integrates with CI/CD pipelines, converts to HTML/PDF programmatically',
                  },
                  {
                    format: 'JSON',
                    icon: FileText,
                    when: 'System integration, API consumption, data analysis',
                    why: 'Structured data for programmatic access, machine-readable for automation, database import ready',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                        <item.icon className="h-5 w-5 text-[rgb(167,218,219)]" />
                      </div>
                      <h4 className="text-xl font-bold text-[rgb(167,218,219)]">{item.format}</h4>
                    </div>
                    <div className="mb-3">
                      <div className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">
                        When to use:
                      </div>
                      <div className="text-sm text-[rgb(176,197,198)]">{item.when}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">Why:</div>
                      <div className="text-sm text-[rgb(176,197,198)]">{item.why}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 5: Common Pitfalls */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Avoid These Mistakes</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Common Pitfalls to Avoid
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              Learn from the most common mistakes that reduce blueprint quality and how to avoid
              them.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: XCircle,
                  title: 'Generic Answers',
                  problem: '"Train employees on software" provides no context.',
                  solution:
                    'Specify: Which software? Which features? What proficiency level? What job tasks require it?',
                },
                {
                  icon: Shield,
                  title: 'Ignoring Compliance',
                  problem:
                    'Omitting HIPAA requirements in Phase 1, then receiving questions about patient data.',
                  solution:
                    'List ALL compliance requirements upfront—the engine filters appropriately.',
                },
                {
                  icon: Clock,
                  title: 'Unrealistic Timeline',
                  problem:
                    'Claiming a 2-week timeline for a complex 40-hour program with stakeholder reviews.',
                  solution: 'Factor in development, review cycles, pilot testing, and revisions.',
                },
                {
                  icon: Target,
                  title: 'Vague Objectives',
                  problem: '"Improve skills" or "increase knowledge" without measurable targets.',
                  solution:
                    'Use SMART objectives: "Reduce customer complaint resolution time from 48 hours to 24 hours within 3 months."',
                },
                {
                  icon: Users,
                  title: 'Skipping Stakeholder Input',
                  problem:
                    'Answering Phase 1 without gathering input from subject matter experts or learners.',
                  solution:
                    'Invest 30-60 minutes in stakeholder interviews before starting Phase 1.',
                },
                {
                  icon: BarChart3,
                  title: 'Budget Inconsistency',
                  problem:
                    'Stating $10K budget in Phase 1, then requesting custom LMS development and video production.',
                  solution:
                    'Be realistic about budget constraints—the engine scales recommendations accordingly.',
                },
                {
                  icon: FileText,
                  title: 'Not Reviewing Before Export',
                  problem:
                    'Exporting immediately without checking for internal consistency across sections.',
                  solution:
                    'Spend 10 minutes reviewing the blueprint—verify timeline, budget, and scope align.',
                },
                {
                  icon: Lightbulb,
                  title: 'Ignoring Context',
                  problem:
                    'Phase 3 answers contradict Phase 1 inputs (e.g., stating remote delivery despite saying "on-site only").',
                  solution:
                    'Reference earlier answers for consistency—the engine integrates context across all phases.',
                },
                {
                  icon: MessageSquare,
                  title: 'Rushing Through Phase 3',
                  problem: 'Spending only 10 minutes on 50-70 personalized questions.',
                  solution: 'Allocate 30-45 minutes—specificity here determines blueprint quality.',
                },
              ].map((pitfall, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                    <pitfall.icon className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-[rgb(224,224,224)]">
                    {pitfall.title}
                  </h3>
                  <div className="mb-3 text-sm text-red-400">
                    <span className="font-semibold">Problem:</span> {pitfall.problem}
                  </div>
                  <div className="text-sm text-[rgb(176,197,198)]">
                    <span className="font-semibold text-[rgb(167,218,219)]">Solution:</span>{' '}
                    {pitfall.solution}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 6: Success Metrics */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <TrendingUp className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                Measuring Success
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              What Separates Successful Deployments
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              High-quality blueprints share these characteristics. Use this checklist to evaluate
              your blueprint before finalizing.
            </p>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                  Quality Indicators
                </h3>
                <div className="space-y-4">
                  {[
                    'Executive summary is a compelling 2-3 paragraph narrative (not bullet points)',
                    'Learning objectives include baseline and target metrics',
                    'Target audience section shows demographics with percentages',
                    'Instructional strategy allocates modalities that sum to 100%',
                    'Content outline includes specific topics, duration, activities, and assessments',
                    'Resources section lists human FTE, tools with costs, and budget breakdown',
                    'Assessment strategy defines KPIs, measurement methods, and passing criteria',
                    'Implementation timeline has phases with dates, milestones, and dependencies',
                    'Risk mitigation identifies risks with probability, impact, and strategies',
                    'Success metrics compare baseline vs target with reporting requirements',
                    'Sustainability plan includes maintenance schedule and scaling considerations',
                  ].map((indicator, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                      <span className="text-[rgb(176,197,198)]">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8">
                  <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                    Continuous Improvement
                  </h3>
                  <p className="mb-6 text-[rgb(176,197,198)]">
                    The best learning operations teams treat blueprints as living documents. After
                    deployment:
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Gather Feedback',
                        desc: 'Survey learners, instructors, and stakeholders within 30 days',
                      },
                      {
                        title: 'Measure KPIs',
                        desc: 'Track the success metrics defined in Section 10 of your blueprint',
                      },
                      {
                        title: 'Iterate',
                        desc: 'Create a new blueprint incorporating lessons learned for version 2.0',
                      },
                      {
                        title: 'Scale',
                        desc: 'Use successful blueprints as templates for similar programs',
                      },
                    ].map((step, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-[rgba(167,218,219,0.1)] bg-[rgba(13,27,42,0.3)] p-4"
                      >
                        <div className="mb-1 font-semibold text-[rgb(224,224,224)]">
                          {step.title}
                        </div>
                        <div className="text-sm text-[rgb(176,197,198)]">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(167,218,219,0.3)] bg-gradient-to-br from-[rgba(167,218,219,0.1)] to-[rgba(167,218,219,0.05)] p-8">
                  <h3 className="mb-4 text-2xl font-bold text-[rgb(167,218,219)]">
                    Ready to Create Your Blueprint?
                  </h3>
                  <p className="mb-6 text-[rgb(176,197,198)]">
                    Follow these best practices to generate production-ready learning blueprints in
                    under an hour—with zero revision cycles.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href="http://localhost:3000/"
                      className="rounded-lg bg-[rgb(79,70,229)] px-6 py-3 text-center font-semibold text-white transition-all hover:bg-[rgb(67,56,202)] hover:shadow-lg"
                    >
                      Start Creating
                    </a>
                    <a
                      href="https://polaris.smartslate.io/share/QHkOFAQZc3PJmcKvSnEk7BGETffE44wb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[rgba(167,218,219,0.3)] px-6 py-3 text-center font-semibold text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.1)]"
                    >
                      View an Example
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
