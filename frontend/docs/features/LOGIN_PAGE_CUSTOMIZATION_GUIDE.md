# Login Page Marketing Section - Customization Guide

## Quick Reference for Common Modifications

This guide shows you how to customize the login page marketing section for different use cases, A/B testing, or content updates.

## 📝 Changing the Headline

**File**: `/components/auth/LoginMarketingSection.tsx`
**Lines**: 69-77

### Current Implementation

```tsx
<h1 className="font-heading text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl">
  Transform Learning Programs
  <span className="from-primary via-primary-300 to-primary block bg-gradient-to-r bg-clip-text text-transparent">
    In 1 Hour, Not 6 Weeks
  </span>
</h1>
```

### Alternative Headlines

```tsx
// Option A: ROI Focus
<h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
  $50K Consulting Projects
  <span className="block bg-gradient-to-r from-primary via-primary-300 to-primary bg-clip-text text-transparent">
    For Just $240/Year
  </span>
</h1>

// Option B: Quality Focus
<h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
  Production-Ready Blueprints
  <span className="block bg-gradient-to-r from-primary via-primary-300 to-primary bg-clip-text text-transparent">
    On First Draft, Guaranteed
  </span>
</h1>

// Option C: Speed Focus
<h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
  Skip 6 Weeks of Consulting
  <span className="block bg-gradient-to-r from-primary via-primary-300 to-primary bg-clip-text text-transparent">
    Launch in 1 Hour
  </span>
</h1>
```

## 🎯 Updating Feature Cards

**File**: `/components/auth/LoginMarketingSection.tsx`
**Lines**: 83-110

### Current Features Array

```tsx
<div className="animate-fade-in-up grid gap-4 md:grid-cols-2" style={{ animationDelay: '200ms' }}>
  <FeatureCard
    icon={<RocketIcon className="h-5 w-5" />}
    title="Lightning-Fast Generation"
    description="Complete comprehensive blueprints in under 1 hour with AI-powered automation"
    delay={300}
  />
  <FeatureCard
    icon={<CheckCircleIcon className="h-5 w-5" />}
    title="Zero Revisions Needed"
    description="AI validates 100% of requirements before generation for production-ready first drafts"
    delay={400}
  />
  <FeatureCard
    icon={<SparklesIcon className="h-5 w-5" />}
    title="13+ Comprehensive Sections"
    description="Strategy, timelines, resources, assessments, and metrics in every blueprint"
    delay={500}
  />
  <FeatureCard
    icon={<RefreshCwIcon className="h-5 w-5" />}
    title="Smart Rollover Credits"
    description="Credits accumulate for 12 months - never lose value from your subscription"
    delay={600}
  />
</div>
```

### How to Add/Change Features

#### Example: Add a 5th Feature

```tsx
// 1. Import new icon (at top of file)
import { ShieldCheckIcon } from 'lucide-react';

// 2. Change grid to 3 columns on desktop
<div className="animate-fade-in-up grid gap-4 md:grid-cols-2 lg:grid-cols-3">

// 3. Add new FeatureCard
<FeatureCard
  icon={<ShieldCheckIcon className="h-5 w-5" />}
  title="Enterprise Security"
  description="Bank-level encryption, SOC 2 compliance, and dedicated support"
  delay={700}
/>
```

#### Example: Change Existing Feature

```tsx
// Replace "Zero Revisions" with "Multi-Format Export"
<FeatureCard
  icon={<FileDownIcon className="h-5 w-5" />} // New icon
  title="Multi-Format Export"
  description="Download as PDF, Word, Markdown, or JSON - works with any workflow"
  delay={400} // Keep same delay for smooth animation
/>
```

#### Available Icons (Lucide React)

```tsx
import {
  RocketIcon, // Speed, launch, fast
  CheckCircleIcon, // Success, validation, approval
  SparklesIcon, // AI, magic, quality
  RefreshCwIcon, // Rollover, cycle, renew
  ShieldCheckIcon, // Security, protection
  FileDownIcon, // Download, export
  UsersIcon, // Team, collaboration
  TrendingUpIcon, // Growth, improvement
  ZapIcon, // Power, energy
  HeartIcon, // Favorite, love
  StarIcon, // Rating, premium
} from 'lucide-react';
```

## 📊 Modifying Social Proof Stats

**File**: `/components/auth/LoginMarketingSection.tsx`
**Lines**: 116-127

### Current Stats

```tsx
<div className="grid grid-cols-3 gap-4">
  <StatCard value="15" label="Faster Time-to-Launch" animated={true} delay={700} />
  <StatCard value="98%" label="Time Savings vs Consulting" delay={800} />
  <StatCard value="$50K → $240/yr" label="Cost Reduction" delay={900} />
</div>
```

### How to Update Stats

#### Example: Change to User-Based Stats

```tsx
<div className="grid grid-cols-3 gap-4">
  <StatCard value="10000" label="Blueprints Generated" animated={true} delay={700} />
  <StatCard value="500+" label="Enterprise Customers" delay={800} />
  <StatCard value="4.9★" label="Average Rating" delay={900} />
</div>
```

#### Example: Dynamic Stats from API

```tsx
// 1. Add state at top of component
const [stats, setStats] = useState({
  blueprints: 0,
  users: 0,
  timeSaved: 0,
});

// 2. Fetch data on mount
useEffect(() => {
  fetch('/api/public/stats')
    .then((res) => res.json())
    .then((data) => setStats(data));
}, []);

// 3. Use dynamic values
<StatCard value={stats.blueprints} label="Blueprints Generated" animated={true} delay={700} />;
```

## 🎨 Adjusting Colors and Styling

### Change Gradient Colors

```tsx
// Current gradient: Primary → Primary-300 → Primary
<span className="block bg-gradient-to-r from-primary via-primary-300 to-primary bg-clip-text text-transparent">

// Alternative: Teal to Indigo
<span className="block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">

// Alternative: Warm gradient
<span className="block bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">
```

### Change Background Colors

```tsx
// Marketing section background
// File: /app/(auth)/login/LoginPageClient.tsx, Line 34
className =
  'border-r border-white/10 bg-gradient-to-br from-[#0d1b2a]/80 to-[#020c1b]/60 backdrop-blur-xl';

// Alternative: Lighter background
className =
  'border-r border-white/10 bg-gradient-to-br from-[#1a2332]/80 to-[#0d1b2a]/60 backdrop-blur-xl';

// Alternative: Warmer tone
className =
  'border-r border-white/10 bg-gradient-to-br from-[#1a1820]/80 to-[#0a0510]/60 backdrop-blur-xl';
```

### Change Hover Effects

```tsx
// Current feature card hover
className =
  'group flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-white/10 hover:shadow-lg hover:shadow-primary/10';

// More subtle hover
className =
  'group flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/8';

// More dramatic hover
className =
  'group flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:scale-105';
```

## ⏱️ Animation Timing Adjustments

### Speed Up Animations

```tsx
// Current delays: 300, 400, 500, 600ms
delay={300}  // Card 1
delay={400}  // Card 2
delay={500}  // Card 3
delay={600}  // Card 4

// Faster sequence (100ms gaps)
delay={100}
delay={200}
delay={300}
delay={400}

// Instant (no delay)
delay={0}
delay={0}
delay={0}
delay={0}
```

### Slow Down Animations

```tsx
// Slower, more dramatic (200ms gaps)
delay={500}
delay={700}
delay={900}
delay={1100}
```

### Change Transition Duration

```tsx
// Current: 300ms
className = 'transition-all duration-300';

// Faster: 200ms
className = 'transition-all duration-200';

// Slower: 500ms
className = 'transition-all duration-500';
```

## 🔢 Counter Animation Customization

**File**: `/components/auth/LoginMarketingSection.tsx`
**Lines**: 21-43

### Current Implementation

```tsx
<AnimatedCounter end={15} suffix="x" duration={2000} />
```

### Customization Options

```tsx
// Faster animation (1 second)
<AnimatedCounter end={15} suffix="x" duration={1000} />

// Slower animation (3 seconds)
<AnimatedCounter end={15} suffix="x" duration={3000} />

// Add prefix
<AnimatedCounter end={100} prefix="$" suffix="K" duration={2000} />
// Result: $100K

// Percentage
<AnimatedCounter end={98} suffix="%" duration={2000} />
// Result: 98%

// Large numbers
<AnimatedCounter end={10000} suffix="+" duration={2000} />
// Result: 10000+
```

## 📱 Mobile Teaser Customization

**File**: `/app/(auth)/login/LoginPageClient.tsx`
**Lines**: 42-71

### Current Mobile Teaser

```tsx
<section className="animate-fade-in-up mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:hidden">
  <div className="space-y-4">
    <div className="border-primary/20 bg-primary/10 inline-flex items-center gap-2 rounded-full border px-3 py-1 backdrop-blur-sm">
      <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
      <span className="text-primary text-xs font-medium">AI-Powered Learning Blueprints</span>
    </div>

    <h2 className="font-heading text-2xl font-bold text-white">
      Transform 6-Week Projects Into 1-Hour Blueprints
    </h2>

    <div className="grid grid-cols-3 gap-3">{/* 3 stat cards */}</div>
  </div>
</section>
```

### How to Simplify Mobile View

```tsx
// Minimal version - just headline
<section className="animate-fade-in-up mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:hidden">
  <h2 className="font-heading text-center text-xl font-bold text-white">
    AI-Powered Learning Blueprints
  </h2>
  <p className="mt-2 text-center text-sm text-white/70">
    Transform projects in 1 hour, not 6 weeks
  </p>
</section>
```

### How to Show More Features on Mobile

```tsx
// Add feature pills
<div className="mt-3 flex flex-wrap gap-2">
  <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-3 py-1 text-xs">
    ⚡ Fast
  </span>
  <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-3 py-1 text-xs">
    ✓ Validated
  </span>
  <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-3 py-1 text-xs">
    💎 Premium
  </span>
</div>
```

## 🎯 CTA (Call-to-Action) Modifications

**File**: `/components/auth/LoginMarketingSection.tsx`
**Lines**: 135-148

### Current CTA

```tsx
<div className="from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-white/10 bg-gradient-to-r p-4 backdrop-blur-sm">
  <div className="flex items-center gap-3">
    <div className="bg-primary/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
      <SparklesIcon className="text-primary h-5 w-5" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-white">Start Free, Scale Smart</p>
      <p className="text-xs text-white/60">2 free blueprints/month • No credit card required</p>
    </div>
  </div>
</div>
```

### Alternative CTAs

#### Option A: Enterprise Focus

```tsx
<div className="from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-white/10 bg-gradient-to-r p-4 backdrop-blur-sm">
  <div className="flex items-center gap-3">
    <div className="bg-primary/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
      <ShieldCheckIcon className="text-primary h-5 w-5" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-white">Enterprise-Ready Security</p>
      <p className="text-xs text-white/60">SOC 2 compliant • Dedicated support • Custom SLAs</p>
    </div>
  </div>
</div>
```

#### Option B: Urgency/Scarcity

```tsx
<div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 backdrop-blur-sm">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
      <ClockIcon className="h-5 w-5 text-amber-400" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-white">Limited Time: 50% Off First Year</p>
      <p className="text-xs text-white/60">Join 1000+ organizations • Offer ends soon</p>
    </div>
  </div>
</div>
```

#### Option C: Clickable CTA Button

```tsx
<Link href="/signup" className="block">
  <div className="border-primary/30 from-primary/20 to-secondary/20 hover:border-primary/50 hover:shadow-primary/20 cursor-pointer rounded-lg border bg-gradient-to-r p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">Start Your Free Trial Today</p>
        <p className="text-xs text-white/60">No credit card required • 2 free blueprints/month</p>
      </div>
      <ArrowRightIcon className="text-primary h-5 w-5" />
    </div>
  </div>
</Link>
```

## 🔧 Layout Adjustments

### Change Column Ratio (Desktop)

**File**: `/app/(auth)/login/LoginPageClient.tsx`
**Line**: 29

```tsx
// Current: 50/50 split
<div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-2">

// 60/40 split (marketing larger)
<div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[3fr_2fr]">

// 40/60 split (form larger)
<div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[2fr_3fr]">

// 70/30 split (marketing dominant)
<div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[7fr_3fr]">
```

### Adjust Breakpoint

```tsx
// Current: Changes at 1024px (lg)
<div className="grid grid-cols-1 lg:grid-cols-2">

// Change at 768px (md)
<div className="grid grid-cols-1 md:grid-cols-2">

// Change at 1280px (xl)
<div className="grid grid-cols-1 xl:grid-cols-2">
```

## 📋 A/B Testing Setup Example

```tsx
// 1. Add variant prop
interface LoginMarketingSectionProps {
  variant?: 'A' | 'B';
}

export function LoginMarketingSection({ variant = 'A' }: LoginMarketingSectionProps) {
  // 2. Conditional rendering based on variant
  const headline =
    variant === 'A'
      ? 'Transform Learning Programs In 1 Hour, Not 6 Weeks'
      : 'AI-Powered Blueprints That Get Approved on First Draft';

  return (
    <div className="space-y-8">
      <h1>{headline}</h1>
      {/* Rest of component */}
    </div>
  );
}

// 3. In LoginPageClient, randomly assign variant
const variant = Math.random() > 0.5 ? 'A' : 'B';

// 4. Track conversions
useEffect(() => {
  analytics.track('login_page_view', { variant });
}, [variant]);
```

## 🎨 Seasonal/Event Theming

```tsx
// Halloween theme
const isHalloween = new Date().getMonth() === 9; // October

<div className={`rounded-lg border ${
  isHalloween
    ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-purple-500/10'
    : 'border-white/10 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10'
} p-4 backdrop-blur-sm`}>

// Holiday theme
const isHoliday = new Date().getMonth() === 11; // December

<SparklesIcon className={`h-5 w-5 ${
  isHoliday ? 'text-red-400' : 'text-primary'
}`} />
```

## 💡 Pro Tips

### 1. Always Test Changes Locally

```bash
npm run dev
# Check http://localhost:3000/login
```

### 2. Use Browser DevTools

- Toggle device toolbar for responsive testing
- Inspect element to preview CSS changes
- Use Performance tab to check animation frame rate

### 3. Maintain Brand Consistency

- Stick to primary color (#a7dadb) for main accents
- Use white/opacity for text (never pure white)
- Keep animations subtle (300ms default)
- Maintain touch targets ≥44px

### 4. Update Documentation

When making changes, update:

- This customization guide
- Main implementation docs
- Visual guide if layout changes

---

**Last Updated**: January 2025
**Polaris Version**: v3
**Maintained By**: Development Team
