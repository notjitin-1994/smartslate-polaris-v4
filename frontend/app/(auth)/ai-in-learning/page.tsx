import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Brain,
  Users,
  BarChart3,
  Rocket,
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
  Award,
  Layers,
  Lightbulb,
  Shield,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'AI in Learning: The Future of Corporate Training | SmartSlate',
  description:
    "Discover how AI is transforming corporate learning. SmartSlate's ecosystem powers personalized training, blueprint generation, and learning analytics.",
  keywords: [
    'AI in learning',
    'corporate training',
    'learning technology',
    'AI-powered training',
    'learning blueprint',
    'training design',
    'learning analytics',
    'personalized learning',
    'adaptive learning',
    'learning ecosystem',
  ],
  openGraph: {
    title: 'AI in Learning: The Future of Corporate Training | SmartSlate',
    description:
      "SmartSlate's ecosystem powers personalized training, blueprint generation, and learning analytics for the future of corporate learning.",
    type: 'website',
  },
};

// Constellation background component
function ConstellationBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(2,12,27)] to-[rgb(2,12,27)]" />
      {Array.from({ length: 150 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 animate-pulse rounded-full bg-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.7 + 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Stats badge component
function StatsBadge() {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[rgb(167,218,219)]" />
        <span className="text-sm text-[rgb(224,224,224)]">
          <strong>71%</strong> of organizations use AI
        </span>
      </div>
      <div className="h-4 w-px bg-[rgba(167,218,219,0.2)]" />
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-[rgb(167,218,219)]" />
        <span className="text-sm text-[rgb(224,224,224)]">
          <strong>78%</strong> in 2024
        </span>
      </div>
      <div className="h-4 w-px bg-[rgba(167,218,219,0.2)]" />
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-[rgb(167,218,219)]" />
        <span className="text-sm text-[rgb(224,224,224)]">
          <strong>60%</strong> retention improvement
        </span>
      </div>
    </div>
  );
}

// Hero section
function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-start px-4 py-20">
      <div className="animate-fade-in-up mx-auto max-w-7xl space-y-8 text-left">
        {/* Badge */}
        <div className="flex justify-start">
          <StatsBadge />
        </div>

        {/* Headline */}
        <h1 className="text-left text-5xl leading-tight font-bold text-[rgb(224,224,224)] md:text-7xl lg:text-8xl">
          The Future of Learning is Here.
          <br />
          <span className="text-[rgb(167,218,219)]">Are You Ready to Lead It?</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-4xl text-left text-xl leading-relaxed text-[rgb(176,197,198)] md:text-2xl">
          AI in learning is not coming—it is already reshaping how forward-thinking organizations
          develop talent. SmartSlate is building the comprehensive AI-powered learning ecosystem
          that will define the next decade of corporate training.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-start justify-start gap-4 pt-8 sm:flex-row">
          <Button
            size="large"
            className="min-h-[56px] bg-[rgb(167,218,219)] px-8 text-lg font-semibold text-[rgb(2,12,27)] hover:bg-[rgb(167,218,219)]/90"
          >
            <Link href="/demo">
              Start with Polaris - Free
              <Rocket className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="large"
            variant="outline"
            className="min-h-[56px] border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] px-8 text-lg text-[rgb(167,218,219)] hover:bg-[rgba(167,218,219,0.1)]"
          >
            <Link href="#ecosystem">
              Explore the Ecosystem
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Floating elements */}
        <div className="relative mt-20 h-40">
          <div className="absolute top-0 left-1/4 h-16 w-16 animate-pulse rounded-full bg-[rgba(167,218,219,0.2)] blur-xl" />
          <div className="absolute top-10 right-1/4 h-20 w-20 animate-pulse rounded-full bg-[rgba(167,218,219,0.2)] blur-xl delay-1000" />
        </div>
      </div>
    </section>
  );
}

// Industry trends section
function IndustryTrendsSection() {
  const stats = [
    {
      icon: TrendingUp,
      value: '78%',
      label: 'Organizations Using AI',
      description: 'Up from 65% in early 2024',
      color: 'rgb(167,218,219)',
    },
    {
      icon: Brain,
      value: '60%',
      label: 'Retention Improvement',
      description: 'AI personalization: 25-60% vs traditional 8-10%',
      color: 'rgb(167,218,219)',
    },
    {
      icon: Rocket,
      value: '57%',
      label: 'Closing AI Skills Gaps',
      description: '97M new jobs by 2025',
      color: 'rgb(167,218,219)',
    },
  ];

  return (
    <section className="relative px-4 py-32">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-4 text-left">
          <h2 className="text-left text-4xl font-bold text-[rgb(224,224,224)] md:text-6xl">
            The L&D Landscape is Undergoing Its
            <br />
            <span className="text-[rgb(167,218,219)]">Biggest Transformation in 50 Years</span>
          </h2>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="animate-fade-in-up space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_30px_rgba(167,218,219,0.2)]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <stat.icon className="mb-4 h-12 w-12" style={{ color: stat.color }} />
              <div className="text-5xl font-bold text-[rgb(224,224,224)]">{stat.value}</div>
              <div className="text-xl font-semibold text-[rgb(167,218,219)]">{stat.label}</div>
              <p className="text-[rgb(176,197,198)]">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Problem statement */}
        <div className="space-y-6 rounded-xl border border-l-4 border-[rgba(167,218,219,0.2)] border-l-[rgb(167,218,219)] bg-[rgba(167,218,219,0.05)] p-10">
          <h3 className="flex items-center gap-3 text-left text-2xl font-bold text-[rgb(224,224,224)]">
            <Zap className="h-8 w-8 text-[rgb(167,218,219)]" />
            But Traditional L&D is Struggling to Keep Up
          </h3>
          <div className="grid grid-cols-1 gap-6 text-left text-[rgb(176,197,198)] md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">12%</div>
              <p>Only 12% of employees apply new skills on the job</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">98%</div>
              <p>Plan to use elearning, but engagement is number 1 challenge</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">45+</div>
              <p>Hours needed for comprehensive needs analysis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// SmartSlate vision section
function SmartSlateVisionSection() {
  return (
    <section id="ecosystem" className="relative px-4 py-32">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
            <Sparkles className="h-5 w-5 text-[rgb(167,218,219)]" />
            <span className="font-semibold text-[rgb(167,218,219)]">The SmartSlate Ecosystem</span>
          </div>
          <h2 className="text-left text-5xl font-bold text-[rgb(224,224,224)] md:text-7xl">
            One Platform.
            <br />
            <span className="text-[rgb(167,218,219)]">Infinite Learning Possibilities.</span>
          </h2>
          <p className="max-w-4xl text-left text-xl leading-relaxed text-[rgb(176,197,198)]">
            While other platforms offer disconnected point solutions, SmartSlate is building the
            first truly integrated AI learning ecosystem—from blueprint creation to content
            generation, learner personalization to analytics. Everything you need to design,
            deliver, and measure world-class learning experiences, all powered by AI, all in one
            place.
          </p>
        </div>

        {/* Constellation diagram */}
        <div className="relative h-[600px] overflow-hidden rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-12">
          {/* Center - Polaris */}
          <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.2)] shadow-[0_0_40px_rgba(167,218,219,0.6)]">
                <Star className="h-16 w-16 fill-current text-[rgb(167,218,219)]" />
              </div>
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 transform whitespace-nowrap">
                <div className="text-xl font-bold text-[rgb(224,224,224)]">Polaris</div>
                <div className="text-sm text-[rgb(167,218,219)]">Available Now</div>
              </div>
            </div>
          </div>

          {/* Orbiting products */}
          {[
            { name: 'Constellation', icon: Layers, angle: 0, distance: 200 },
            { name: 'Nova', icon: Lightbulb, angle: 72, distance: 200 },
            { name: 'Orbit', icon: Globe, angle: 144, distance: 200 },
            { name: 'Nebula', icon: MessageSquare, angle: 216, distance: 200 },
            { name: 'Spectrum', icon: BarChart3, angle: 288, distance: 200 },
          ].map((product, index) => {
            const x = Math.cos((product.angle * Math.PI) / 180) * product.distance;
            const y = Math.sin((product.angle * Math.PI) / 180) * product.distance;

            return (
              <div
                key={product.name}
                className="absolute top-1/2 left-1/2 z-0"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                {/* Connection line */}
                <svg
                  className="pointer-events-none absolute top-1/2 left-1/2"
                  style={{
                    width: Math.abs(x) * 2,
                    height: Math.abs(y) * 2,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <line
                    x1="50%"
                    y1="50%"
                    x2={x > 0 ? '0%' : '100%'}
                    y2={y > 0 ? '0%' : '100%'}
                    stroke="rgba(167,218,219,0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Product node */}
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(167,218,219,0.5)] bg-[rgba(167,218,219,0.1)] transition-transform hover:scale-110">
                    <product.icon className="h-8 w-8 text-[rgb(167,218,219)]" />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 transform text-center whitespace-nowrap">
                    <div className="text-sm font-semibold text-[rgb(224,224,224)]">
                      {product.name}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Polaris today section
function PolarisTodaySection() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description:
        'Two-phase AI system generates personalized learning blueprints in minutes, not weeks',
    },
    {
      icon: Target,
      title: 'Context-Aware Design',
      description:
        'Captures organizational, audience, and project context for truly customized solutions',
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description:
        'From concept to comprehensive blueprint in under 15 minutes—45+ hours saved per project',
    },
  ];

  return (
    <section className="relative bg-[rgba(13,27,42,0.3)] px-4 py-32">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-4 text-left">
          <h2 className="text-left text-4xl font-bold text-[rgb(224,224,224)] md:text-6xl">
            <span className="text-[rgb(167,218,219)]">Polaris:</span> The AI-Powered Blueprint
            Generator
            <br />
            Transforming Learning Design
          </h2>
          <p className="max-w-3xl text-left text-xl text-[rgb(176,197,198)]">
            Available today. Free to start. The foundation of the SmartSlate ecosystem begins with
            revolutionary blueprint generation.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-fade-in-up space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_40px_rgba(167,218,219,0.2)]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(167,218,219,0.1)]">
                <feature.icon className="h-8 w-8 text-[rgb(167,218,219)]" />
              </div>
              <h3 className="text-left text-xl font-bold text-[rgb(224,224,224)]">
                {feature.title}
              </h3>
              <p className="text-left text-[rgb(176,197,198)]">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-left">
          <Button
            size="large"
            className="min-h-[56px] bg-[rgb(167,218,219)] px-8 font-semibold text-[rgb(2,12,27)] hover:bg-[rgb(167,218,219)]/90"
          >
            <Link href="/demo">
              Try Polaris Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Ecosystem tomorrow section (COMPLETE WITH ALL 5 PRODUCTS)
function EcosystemTomorrowSection() {
  const products = [
    {
      name: 'Constellation',
      tagline: 'Instructional Design',
      launch: '2026',
      icon: Layers,
      color: 'rgb(167,218,219)',
      description:
        'Advanced instructional design frameworks and pedagogy tools. Takes your Polaris blueprint and guides detailed learner journey mapping with expert recommendations.',
      features: [
        'Advanced ID frameworks (ADDIE, SAM, Agile)',
        'Learner journey mapping tools',
        'Expert pedagogy recommendations',
        "Bloom's Taxonomy alignment",
        'Instructional strategy selection',
        'Learning objective refinement',
      ],
    },
    {
      name: 'Nova',
      tagline: 'Content Development (ASSISTED)',
      launch: '2026',
      icon: Lightbulb,
      color: 'rgb(167,218,219)',
      description:
        'AI-assisted content creation—not AI replacement. Nova helps you develop slides, scripts, and activities faster while you stay in control. Your expertise + AI speed.',
      features: [
        'AI-assisted slide deck creation',
        'Script and narration drafting support',
        'Activity and exercise templates',
        'Assessment item generation assistance',
        'Multi-format export (PowerPoint, PDF, SCORM)',
        'You stay in control—AI assists, never replaces',
      ],
    },
    {
      name: 'Orbit',
      tagline: 'AI-First LMS',
      launch: '2027',
      icon: Globe,
      color: 'rgb(167,218,219)',
      description:
        'Complete AI-powered Learning Management System. Intelligent course delivery, learner tracking, adaptive recommendations—with Nebula AI tutor integrated for 24/7 learner support.',
      features: [
        'Complete LMS platform with AI core',
        'Intelligent course delivery and sequencing',
        'Learner tracking and progress monitoring',
        'Adaptive recommendations engine',
        'Nebula AI tutor embedded (24/7 support)',
        'Multi-tenant architecture for enterprises',
      ],
    },
    {
      name: 'Nebula',
      tagline: 'AI Tutor (in Orbit)',
      launch: '2027',
      icon: MessageSquare,
      color: 'rgb(167,218,219)',
      description:
        'Intelligent AI tutor embedded in Orbit LMS. Real-time learner assistance, personalized concept clarification, adaptive help—scales across all learners, 24/7.',
      features: [
        'Real-time learner assistance (24/7)',
        'Personalized concept clarification',
        'Adaptive help based on learner needs',
        'Context-aware Q&A for course content',
        'Scales across unlimited learners',
        'Embedded directly in Orbit LMS',
      ],
    },
    {
      name: 'Spectrum',
      tagline: 'AI-Powered Analytics',
      launch: '2027',
      icon: BarChart3,
      color: 'rgb(167,218,219)',
      description:
        'Prove learning impact with comprehensive analytics. Kirkpatrick Level 3-4 measurement, predictive insights, ROI tracking—from design efficiency to business outcomes.',
      features: [
        'End-to-end learning analytics dashboard',
        'Kirkpatrick Level 3-4 impact measurement',
        'Predictive insights and recommendations',
        'ROI tracking and business impact correlation',
        'Design time savings and efficiency metrics',
        'AI-powered continuous improvement suggestions',
      ],
    },
  ];

  return (
    <section className="relative px-4 py-32">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
            <Clock className="h-5 w-5 text-[rgb(167,218,219)]" />
            <span className="font-semibold text-[rgb(167,218,219)]">Coming 2026-2027</span>
          </div>
          <h2 className="text-left text-5xl font-bold text-[rgb(224,224,224)] md:text-7xl">
            Beyond Blueprints:
            <br />
            <span className="text-[rgb(167,218,219)]">The Complete AI Learning Platform</span>
          </h2>
          <p className="max-w-4xl text-left text-xl leading-relaxed text-[rgb(176,197,198)]">
            Polaris is just the beginning. Over the next 18 months, SmartSlate will evolve into a
            comprehensive ecosystem that handles every aspect of the learning lifecycle—from design
            to delivery, personalization to analytics.
          </p>
        </div>

        {/* Product cards */}
        <div className="space-y-12">
          {products.map((product, index) => (
            <div
              key={product.name}
              className="animate-fade-in-up space-y-6 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-10 transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_30px_rgba(167,218,219,0.2)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `rgba(167,218,219,0.2)` }}
                  >
                    <product.icon className="h-8 w-8" style={{ color: product.color }} />
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-3xl font-bold" style={{ color: product.color }}>
                      {product.name}
                    </h3>
                    <p className="text-xl text-[rgb(176,197,198)]">{product.tagline}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] px-4 py-2">
                  <Clock className="h-4 w-4 text-[rgb(167,218,219)]" />
                  <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                    {product.launch}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-left text-lg leading-relaxed text-[rgb(176,197,198)]">
                {product.description}
              </p>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-left text-lg font-semibold text-[rgb(224,224,224)]">
                  <CheckCircle2 className="h-5 w-5" style={{ color: product.color }} />
                  What You Will Get:
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {product.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-start gap-2 text-left text-[rgb(176,197,198)]"
                    >
                      <CheckCircle2
                        className="mt-1 h-4 w-4 flex-shrink-0"
                        style={{ color: product.color }}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline visualization */}
        <div className="space-y-8 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-10">
          <h3 className="text-left text-2xl font-bold text-[rgb(224,224,224)]">Roadmap Timeline</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-8 right-0 left-0 h-1 bg-[rgb(167,218,219)]" />

            {/* Timeline points */}
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
              {[
                { quarter: 'Now', label: 'Polaris', status: 'Live' },
                { quarter: '2026 Q2', label: 'Constellation', status: 'Coming' },
                { quarter: '2026 Q3', label: 'Nova', status: 'Coming' },
                { quarter: '2027 Q1', label: 'Orbit + Nebula', status: 'Coming' },
                { quarter: '2027 Q2', label: 'Spectrum', status: 'Coming' },
              ].map((milestone, index) => (
                <div key={milestone.quarter} className="relative text-left">
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                      milestone.status === 'Live'
                        ? 'bg-[rgb(167,218,219)]'
                        : 'border-2 border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)]'
                    }`}
                  >
                    {milestone.status === 'Live' ? (
                      <CheckCircle2 className="h-8 w-8 text-[rgb(2,12,27)]" />
                    ) : (
                      <Clock className="h-8 w-8 text-[rgb(167,218,219)]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[rgb(167,218,219)]">
                      {milestone.quarter}
                    </div>
                    <div className="text-lg font-bold text-[rgb(224,224,224)]">
                      {milestone.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Why choose SmartSlate section
function WhyChooseSmartSlateSection() {
  const comparisons = [
    {
      category: 'Design Philosophy',
      generic: 'Generic AI tools built for any use case',
      smartslate: 'Purpose-built for L&D professionals by L&D experts',
    },
    {
      category: 'Learning Expertise',
      generic: 'No domain knowledge—you provide all context',
      smartslate: 'Embedded instructional design best practices and pedagogy',
    },
    {
      category: 'Integration',
      generic: 'Standalone tools with manual data transfer',
      smartslate: 'Seamless ecosystem—data flows across all products',
    },
    {
      category: 'Personalization',
      generic: 'One-size-fits-all outputs',
      smartslate: 'Context-aware, adaptive to your org and learners',
    },
    {
      category: 'ROI Measurement',
      generic: 'No built-in analytics or impact tracking',
      smartslate: 'Comprehensive analytics from design through business impact',
    },
    {
      category: 'Support',
      generic: 'Community forums and self-service docs',
      smartslate: 'Dedicated L&D success team and continuous optimization',
    },
  ];

  const valuProps = [
    {
      icon: BookOpen,
      title: 'L&D Expertise Embedded',
      description:
        "Built by instructional designers who understand ADDIE, Bloom's Taxonomy, adult learning principles, and real-world L&D challenges. Our AI does not just generate text—it applies proven learning science.",
    },
    {
      icon: Layers,
      title: 'Ecosystem Thinking',
      description:
        'While competitors offer disconnected point solutions, SmartSlate provides a unified platform where design, content, delivery, and analytics work together seamlessly. No more juggling 10 different tools.',
    },
    {
      icon: Shield,
      title: 'Partnership, Not Replacement',
      description:
        'AI augments your expertise, not replaces it. SmartSlate amplifies L&D professionals, giving you superpowers to do more strategic work while AI handles the repetitive tasks.',
    },
  ];

  return (
    <section className="relative bg-[rgba(13,27,42,0.3)] px-4 py-32">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-4 text-left">
          <h2 className="text-left text-4xl font-bold text-[rgb(224,224,224)] md:text-6xl">
            Built for L&D Professionals,
            <br />
            <span className="text-[rgb(167,218,219)]">by L&D Visionaries</span>
          </h2>
        </div>

        {/* Comparison table */}
        <div className="space-y-6 overflow-x-auto rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-10">
          <h3 className="mb-8 text-left text-2xl font-bold text-[rgb(224,224,224)]">
            Generic AI Tools vs. SmartSlate Ecosystem
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(167,218,219,0.1)]">
                <th className="px-4 py-4 text-left font-semibold text-[rgb(176,197,198)]">
                  Category
                </th>
                <th className="px-4 py-4 text-left font-semibold text-[rgb(176,197,198)]">
                  Generic AI Tools
                </th>
                <th className="px-4 py-4 text-left font-semibold text-[rgb(167,218,219)]">
                  SmartSlate Ecosystem
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <tr
                  key={row.category}
                  className="animate-fade-in-up border-b border-[rgba(167,218,219,0.05)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <td className="px-4 py-4 text-left font-semibold text-[rgb(224,224,224)]">
                    {row.category}
                  </td>
                  <td className="px-4 py-4 text-left text-[rgb(176,197,198)]">{row.generic}</td>
                  <td className="px-4 py-4 text-left font-medium text-[rgb(167,218,219)]">
                    {row.smartslate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {valuProps.map((prop, index) => (
            <div
              key={prop.title}
              className="animate-fade-in-up space-y-4 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 transition-all duration-300 hover:border-[rgba(167,218,219,0.4)] hover:shadow-[0_0_30px_rgba(167,218,219,0.2)]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(167,218,219,0.1)]">
                <prop.icon className="h-8 w-8 text-[rgb(167,218,219)]" />
              </div>
              <h3 className="text-left text-xl font-bold text-[rgb(224,224,224)]">{prop.title}</h3>
              <p className="text-left leading-relaxed text-[rgb(176,197,198)]">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Join the journey section
function JoinTheJourneySection() {
  return (
    <section className="relative px-4 py-32">
      <div className="mx-auto max-w-5xl space-y-12 text-left">
        {/* Headline */}
        <div className="animate-fade-in-up space-y-6">
          <h2 className="text-left text-5xl font-bold text-[rgb(224,224,224)] md:text-7xl">
            The Future of AI in Learning
            <br />
            <span className="text-[rgb(167,218,219)]">Starts with Your First Blueprint</span>
          </h2>
          <p className="max-w-3xl text-left text-xl leading-relaxed text-[rgb(176,197,198)]">
            In 18 months, organizations using SmartSlate will be years ahead of competitors still
            relying on traditional L&D approaches. The question is not whether AI will transform
            learning—it is whether you will lead the transformation or struggle to catch up.
          </p>
        </div>

        {/* Stats badge */}
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-6 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] px-8 py-6">
            <div className="text-left">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">45+</div>
              <div className="text-sm text-[rgb(176,197,198)]">Hours Saved</div>
            </div>
            <div className="h-12 w-px bg-[rgba(167,218,219,0.2)]" />
            <div className="text-left">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">15</div>
              <div className="text-sm text-[rgb(176,197,198)]">Minutes</div>
            </div>
            <div className="h-12 w-px bg-[rgba(167,218,219,0.2)]" />
            <div className="text-left">
              <div className="text-4xl font-bold text-[rgb(167,218,219)]">Free</div>
              <div className="text-sm text-[rgb(176,197,198)]">To Start</div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-start justify-start gap-4 pt-8 sm:flex-row">
          <Button
            size="large"
            className="min-h-[56px] bg-[rgb(167,218,219)] px-8 text-lg font-semibold text-[rgb(2,12,27)] hover:bg-[rgb(167,218,219)]/90"
          >
            <Link href="/demo">
              Create Your First Blueprint - Free
              <Rocket className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="large"
            variant="outline"
            className="min-h-[56px] border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] px-8 text-lg text-[rgb(167,218,219)] hover:bg-[rgba(167,218,219,0.1)]"
          >
            <Link href="/features">
              See All Features
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="pt-8 text-left text-sm text-[rgb(176,197,198)] italic">
          Join the waitlist for early access to Constellation, Nova, Orbit, Nebula, and Spectrum.
          <br />
          <Link href="/waitlist" className="font-semibold text-[rgb(167,218,219)] hover:underline">
            Sign up to be first in line
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function AIInLearningPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      <ConstellationBackground />

      <Suspense fallback={<div className="min-h-screen" />}>
        <HeroSection />
        <IndustryTrendsSection />
        <SmartSlateVisionSection />
        <PolarisTodaySection />
        <EcosystemTomorrowSection />
        <WhyChooseSmartSlateSection />
        <JoinTheJourneySection />
      </Suspense>
    </main>
  );
}
