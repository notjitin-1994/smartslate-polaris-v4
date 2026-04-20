'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  Layers,
  Lightbulb,
  Users,
  MessageSquare,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Target,
  TrendingUp,
  Shield,
  Rocket,
  ArrowRight,
  FileText,
  Share2,
  Globe,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export default function AILearningExperienceDesignPage() {
  return (
    <div className="min-h-screen bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-start overflow-hidden px-4 py-20">
        {/* Background constellation effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 h-2 w-2 animate-pulse rounded-full bg-[rgb(167,218,219)]" />
          <div className="absolute top-40 right-20 h-1 w-1 animate-pulse rounded-full bg-[rgb(167,218,219)] delay-100" />
          <div className="absolute bottom-32 left-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-[rgb(167,218,219)] delay-200" />
          <div className="absolute top-1/3 right-1/3 h-1 w-1 animate-pulse rounded-full bg-[rgb(167,218,219)] delay-300" />
        </div>

        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8 text-left"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] px-6 py-3 shadow-[0_0_20px_rgba(167,218,219,0.15)]">
                <Sparkles className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span className="text-sm font-medium text-[rgb(167,218,219)]">
                  Powered by SmartSlate Learning Ecosystem
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="font-heading text-left text-4xl leading-tight font-bold md:text-6xl lg:text-7xl"
            >
              <span className="text-[rgb(167,218,219)]">The Future of AI Learning</span>
              <br />
              <span className="text-[rgb(224,224,224)]">Experience Design Starts Here</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="font-body max-w-4xl text-left text-lg leading-relaxed text-[rgb(176,197,198)] md:text-xl lg:text-2xl"
            >
              SmartSlate is building the complete AI-powered ecosystem for Learning & Development
              teams. <strong className="text-[rgb(167,218,219)]">Polaris</strong>, our blueprint
              generation platform, is mission control—the strategic foundation that powers
              Constellation (instructional design), Nova (content development), Orbit (LMS + AI
              tutor), and Spectrum (analytics). From concept to comprehensive learning design in
              under an hour.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-start justify-start gap-4 pt-4 sm:flex-row"
            >
              <Link
                href="/demo/static"
                className="group inline-flex min-h-[56px] items-center gap-2 rounded-lg bg-[rgb(167,218,219)] px-8 py-4 text-lg font-semibold text-[rgb(2,12,27)] shadow-[0_0_30px_rgba(167,218,219,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(167,218,219,0.6)]"
              >
                Start Your Free Trial
                <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#ecosystem"
                className="group inline-flex min-h-[56px] items-center gap-2 rounded-lg border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] px-8 py-4 text-lg font-semibold text-[rgb(167,218,219)] transition-all duration-300 hover:border-[rgba(167,218,219,0.5)] hover:bg-[rgba(167,218,219,0.1)]"
              >
                Explore the Ecosystem Vision
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-start gap-6 pt-8 text-sm text-[rgb(176,197,198)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>2 free blueprints/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Headline */}
            <motion.div variants={fadeInUp} className="space-y-4 text-left">
              <h2 className="font-heading text-left text-3xl font-bold md:text-5xl">
                <span className="text-[rgb(224,224,224)]">L&D Teams Are </span>
                <span className="text-[rgb(167,218,219)]">Drowning in Manual Work</span>
                <br />
                <span className="text-[rgb(224,224,224)]">While Business Demands Accelerate</span>
              </h2>
            </motion.div>

            {/* Pain points grid */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  icon: Clock,
                  title: 'Weeks Lost to Discovery',
                  description:
                    'SME interviews, stakeholder alignment calls, and endless email threads consume 2-3 weeks before design even begins.',
                },
                {
                  icon: AlertCircle,
                  title: 'Fragmented Tool Chaos',
                  description:
                    'Google Docs for outlines, Excel for objectives, PowerPoint for storyboards—no single source of truth.',
                },
                {
                  icon: RefreshCw,
                  title: 'Revision Hell',
                  description:
                    'Late-stage feedback loops force complete redesigns. "Actually, we need microlearning modules, not a course."',
                },
                {
                  icon: Users,
                  title: 'Siloed Expertise',
                  description:
                    'Junior designers lack access to senior frameworks. Knowledge transfer happens through osmosis, not systems.',
                },
                {
                  icon: TrendingUp,
                  title: 'Scaling Bottlenecks',
                  description:
                    "Your best instructional designer becomes the bottleneck. Adding headcount doesn't solve consistency issues.",
                },
                {
                  icon: Target,
                  title: 'Framework Fatigue',
                  description:
                    'ADDIE, SAM, Agile LX—you know the models, but applying them consistently at scale is exhausting.',
                },
              ].map((pain, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="group rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-6 backdrop-blur-md transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_30px_rgba(167,218,219,0.2)]"
                >
                  <pain.icon className="mb-4 h-10 w-10 text-[rgb(167,218,219)] transition-transform group-hover:scale-110" />
                  <h3 className="font-heading mb-2 text-left text-xl font-semibold text-[rgb(224,224,224)]">
                    {pain.title}
                  </h3>
                  <p className="font-body text-left leading-relaxed text-[rgb(176,197,198)]">
                    {pain.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="relative bg-[rgba(13,27,42,0.3)] px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Headline */}
            <motion.div variants={fadeInUp} className="space-y-4 text-left">
              <h2 className="font-heading text-left text-3xl font-bold md:text-5xl">
                <span className="text-[rgb(167,218,219)]">AI Learning Experience Design:</span>
                <br />
                <span className="text-[rgb(224,224,224)]">Your Strategic Command Center</span>
              </h2>
              <p className="font-body max-w-3xl text-left text-lg text-[rgb(176,197,198)] md:text-xl">
                SmartSlate is not just another tool—it is a unified ecosystem where every L&D
                workflow connects seamlessly. Polaris is the strategic foundation, capturing
                requirements and generating comprehensive blueprints that feed into Constellation
                (instructional design), Nova (assisted content creation), Orbit (AI-first LMS with
                Nebula tutor), and Spectrum (analytics).
              </p>
            </motion.div>

            {/* Visual representation */}
            <motion.div
              variants={fadeInUp}
              className="relative rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 shadow-[0_0_40px_rgba(167,218,219,0.2)] backdrop-blur-md md:p-12"
            >
              <div className="flex flex-col items-start justify-start gap-8 md:flex-row md:gap-12">
                {/* Polaris (center/primary) */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[rgb(167,218,219)] opacity-20 blur-2xl" />
                  <div className="relative rounded-2xl border-2 border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] p-8 shadow-[0_0_30px_rgba(167,218,219,0.4)]">
                    <Star className="h-12 w-12 fill-current text-[rgb(167,218,219)]" />
                    <div className="mt-4 text-left">
                      <div className="font-heading text-xl font-bold text-[rgb(167,218,219)]">
                        Polaris
                      </div>
                      <div className="text-sm text-[rgb(176,197,198)]">Blueprint Generation</div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(167,218,219,0.2)] px-3 py-1 text-xs font-medium text-[rgb(167,218,219)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Live Now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector lines (desktop) */}
                <div className="hidden text-[rgb(176,197,198)] md:block">
                  <ArrowRight className="h-8 w-8" />
                </div>

                {/* Future ecosystem products */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Constellation', desc: 'Instructional Design', icon: Layers },
                    { name: 'Nova', desc: 'Content (Assisted)', icon: Lightbulb },
                    { name: 'Orbit + Nebula', desc: 'LMS + AI Tutor', icon: Users },
                    { name: 'Spectrum', desc: 'Analytics', icon: BarChart3 },
                  ].map((product, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-4 text-left"
                    >
                      <product.icon className="mb-2 h-8 w-8 text-[rgb(167,218,219)]" />
                      <div className="font-heading text-left text-sm font-semibold text-[rgb(224,224,224)]">
                        {product.name}
                      </div>
                      <div className="text-left text-xs text-[rgb(176,197,198)]">
                        {product.desc}
                      </div>
                      <div className="mt-1 text-left text-xs text-[rgb(167,218,219)]">
                        Coming Soon
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Polaris Features Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="space-y-4 text-left">
              <h2 className="font-heading text-left text-3xl font-bold text-[rgb(224,224,224)] md:text-5xl">
                Polaris Features: Mission Control for{' '}
                <span className="text-[rgb(167,218,219)]">Learning Design</span>
              </h2>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-8 lg:grid-cols-3"
            >
              {/* Feature 1: Intelligent Requirements Capture */}
              <motion.div
                variants={scaleIn}
                className="group rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_40px_rgba(167,218,219,0.2)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(167,218,219,0.1)] transition-transform group-hover:scale-110">
                  <MessageSquare className="h-7 w-7 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading mb-4 text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Intelligent Requirements Capture
                </h3>
                <p className="font-body mb-6 text-left leading-relaxed text-[rgb(176,197,198)]">
                  Two-phase questionnaire system replaces weeks of stakeholder interviews.{' '}
                  <strong>Phase 1 (10 min):</strong> Static baseline questions.{' '}
                  <strong>Phase 2 (30 min):</strong> AI-generated dynamic questions tailored to your
                  project context.
                </p>
                <ul className="space-y-3">
                  {[
                    'Adaptive question generation',
                    'Context-aware follow-ups',
                    'Auto-save every 30 seconds',
                    'Progress tracking across sections',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-left">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(167,218,219)]" />
                      <span className="text-[rgb(176,197,198)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Feature 2: Comprehensive Blueprint Generation */}
              <motion.div
                variants={scaleIn}
                className="group rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_40px_rgba(167,218,219,0.2)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(167,218,219,0.1)] transition-transform group-hover:scale-110">
                  <FileText className="h-7 w-7 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading mb-4 text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Comprehensive Blueprint Generation
                </h3>
                <p className="font-body mb-6 text-left leading-relaxed text-[rgb(176,197,198)]">
                  AI-powered generation creates 20-30 page professional blueprints in under an hour.
                  Includes SMART objectives, instructional strategies, assessment frameworks, and
                  implementation timelines.
                </p>
                <ul className="space-y-3">
                  {[
                    'ADDIE/SAM framework alignment',
                    "Bloom's Taxonomy integration",
                    'Detailed content outlines',
                    'Assessment strategy matrix',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-left">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(167,218,219)]" />
                      <span className="text-[rgb(176,197,198)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Feature 3: Share, Export, Collaborate */}
              <motion.div
                variants={scaleIn}
                className="group rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_40px_rgba(167,218,219,0.2)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(167,218,219,0.1)] transition-transform group-hover:scale-110">
                  <Share2 className="h-7 w-7 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading mb-4 text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Share, Export, Collaborate
                </h3>
                <p className="font-body mb-6 text-left leading-relaxed text-[rgb(176,197,198)]">
                  Multi-format export options and shareable links ensure seamless stakeholder
                  handoffs. One-click exports to PDF, Word, Markdown, or JSON for downstream tools.
                </p>
                <ul className="space-y-3">
                  {[
                    'PDF export with branding',
                    'Word (.docx) for editing',
                    'Markdown for version control',
                    'Shareable web links',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-left">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(167,218,219)]" />
                      <span className="text-[rgb(176,197,198)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Ecosystem Vision Section */}
      <section id="ecosystem" className="relative bg-[rgba(13,27,42,0.3)] px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="space-y-4 text-left">
              <h2 className="font-heading text-left text-3xl font-bold text-[rgb(224,224,224)] md:text-5xl">
                The Complete <span className="text-[rgb(167,218,219)]">SmartSlate Ecosystem</span>
              </h2>
              <p className="font-body max-w-3xl text-left text-lg text-[rgb(176,197,198)] md:text-xl">
                Polaris is just the beginning. We are building a constellation of interconnected
                products that transform every phase of the L&D lifecycle.
              </p>
            </motion.div>

            {/* Ecosystem constellation */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  name: 'Polaris',
                  tagline: 'Learning Experience Design',
                  description:
                    'Strategic foundation. Intelligent requirements capture and comprehensive learning blueprint generation—your north star for every L&D project.',
                  status: 'live',
                  icon: Star,
                  color: 'rgb(167,218,219)',
                },
                {
                  name: 'Constellation',
                  tagline: 'Instructional Design',
                  description:
                    'Advanced instructional design frameworks and pedagogy tools. Takes your Polaris blueprint and guides detailed learner journey mapping with expert recommendations.',
                  status: 'coming',
                  icon: Layers,
                  color: 'rgb(167,218,219)',
                },
                {
                  name: 'Nova',
                  tagline: 'Content Development (ASSISTED)',
                  description:
                    'AI-assisted content creation—not AI replacement. Nova helps you develop slides, scripts, and activities faster while you stay in control. Your expertise + AI speed.',
                  status: 'coming',
                  icon: Lightbulb,
                  color: 'rgb(167,218,219)',
                },
                {
                  name: 'Orbit',
                  tagline: 'AI-First LMS',
                  description:
                    'Complete AI-powered Learning Management System. Intelligent course delivery, learner tracking, adaptive recommendations—with Nebula AI tutor integrated for 24/7 learner support.',
                  status: 'coming',
                  icon: Globe,
                  color: 'rgb(167,218,219)',
                },
                {
                  name: 'Nebula',
                  tagline: 'AI Tutor (in Orbit)',
                  description:
                    'Intelligent AI tutor embedded in Orbit LMS. Real-time learner assistance, personalized concept clarification, adaptive help—scales across all learners, 24/7.',
                  status: 'coming',
                  icon: MessageSquare,
                  color: 'rgb(167,218,219)',
                },
                {
                  name: 'Spectrum',
                  tagline: 'AI-Powered Analytics',
                  description:
                    'Prove learning impact with comprehensive analytics. Kirkpatrick Level 3-4 measurement, predictive insights, ROI tracking—from design efficiency to business outcomes.',
                  status: 'coming',
                  icon: BarChart3,
                  color: 'rgb(167,218,219)',
                },
              ].map((product, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className={`group rounded-xl border p-6 ${
                    product.status === 'live'
                      ? 'border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] shadow-[0_0_30px_rgba(167,218,219,0.15)]'
                      : 'border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)]'
                  } backdrop-blur-md transition-all duration-300 hover:scale-105`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <product.icon
                      className={`h-10 w-10 ${
                        product.status === 'live'
                          ? 'fill-current text-[rgb(167,218,219)]'
                          : 'text-[rgb(167,218,219)]'
                      }`}
                    />
                    {product.status === 'live' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(167,218,219,0.2)] px-3 py-1 text-xs font-medium text-[rgb(167,218,219)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Live Now
                      </span>
                    ) : (
                      <span className="rounded-full bg-[rgba(167,218,219,0.1)] px-3 py-1 text-xs font-medium text-[rgb(167,218,219)]">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading mb-1 text-left text-xl font-bold text-[rgb(224,224,224)]">
                    {product.name}
                  </h3>
                  <div className="mb-3 text-left text-sm font-medium text-[rgb(167,218,219)]">
                    {product.tagline}
                  </div>
                  <p className="font-body text-left text-sm leading-relaxed text-[rgb(176,197,198)]">
                    {product.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why SmartSlate Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="space-y-4 text-left">
              <h2 className="font-heading text-left text-3xl font-bold text-[rgb(224,224,224)] md:text-5xl">
                Why <span className="text-[rgb(167,218,219)]">SmartSlate Polaris?</span>
              </h2>
            </motion.div>

            {/* Three columns */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-8 md:grid-cols-3"
            >
              {/* Column 1 */}
              <motion.div
                variants={fadeInUp}
                className="space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.1)]">
                  <Users className="h-6 w-6 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Built for Instructional Designers
                </h3>
                <p className="font-body text-left leading-relaxed text-[rgb(176,197,198)]">
                  Created by L&D professionals who understand your workflows, pain points, and the
                  pressure to deliver faster without sacrificing quality.
                </p>
              </motion.div>

              {/* Column 2 */}
              <motion.div
                variants={fadeInUp}
                className="space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.1)]">
                  <Layers className="h-6 w-6 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Framework-Aligned
                </h3>
                <p className="font-body text-left leading-relaxed text-[rgb(176,197,198)]">
                  ADDIE, SAM, Bloom's Taxonomy, Kirkpatrick's Model—all the industry-standard
                  frameworks baked into the AI generation process.
                </p>
              </motion.div>

              {/* Column 3 */}
              <motion.div
                variants={fadeInUp}
                className="space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.1)]">
                  <Shield className="h-6 w-6 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="font-heading text-left text-2xl font-bold text-[rgb(224,224,224)]">
                  Reliability Through Dual-Fallback
                </h3>
                <p className="font-body text-left leading-relaxed text-[rgb(176,197,198)]">
                  Primary Gemini 3.1 Pro with automatic fallback to Gemini 3.1 Pro ensures 99.9%
                  uptime. Your projects never stall.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-[rgba(13,27,42,0.3)] px-4 py-20 md:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="relative space-y-8 rounded-2xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.55)] p-12 text-left shadow-[0_0_60px_rgba(167,218,219,0.25)] backdrop-blur-md md:p-16"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-[rgb(167,218,219)] opacity-10 blur-3xl" />

            {/* Content */}
            <motion.div variants={fadeInUp} className="relative space-y-6">
              <h2 className="font-heading text-left text-3xl font-bold md:text-5xl">
                <span className="text-[rgb(167,218,219)]">
                  Start Building Your L&D Future Today
                </span>
              </h2>
              <p className="font-body max-w-2xl text-left text-lg text-[rgb(176,197,198)] md:text-xl">
                Join forward-thinking L&D teams who are already transforming their learning design
                process with AI.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="relative flex flex-col items-start justify-start gap-4 sm:flex-row"
            >
              <Link
                href="/demo/static"
                className="group inline-flex min-h-[56px] items-center gap-2 rounded-lg bg-[rgb(167,218,219)] px-8 py-4 text-lg font-semibold text-[rgb(2,12,27)] shadow-[0_0_30px_rgba(167,218,219,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(167,218,219,0.6)]"
              >
                Create Your First Blueprint (Free)
                <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pricing"
                className="group inline-flex min-h-[56px] items-center gap-2 rounded-lg border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] px-8 py-4 text-lg font-semibold text-[rgb(167,218,219)] transition-all duration-300 hover:border-[rgba(167,218,219,0.5)] hover:bg-[rgba(167,218,219,0.1)]"
              >
                View Pricing Plans
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              className="relative flex flex-wrap justify-start gap-6 text-sm text-[rgb(176,197,198)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>2 free blueprints/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[rgb(167,218,219)]" />
                <span>Full feature access</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />
    </div>
  );
}
