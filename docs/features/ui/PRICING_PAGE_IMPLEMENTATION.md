# Pricing Page Implementation Guide

## Overview

This document provides step-by-step instructions for implementing the Smartslate Solara pricing page within the Polaris v3 codebase using Next.js 15, TypeScript 5.7, Tailwind CSS v4, Radix UI, and Supabase.

**Tech Stack Reference:**
- Next.js 15 App Router (Server Components by default)
- TypeScript 5.7 (strict mode)
- Tailwind CSS v4 (utility-first styling)
- Radix UI (accessible component primitives)
- Supabase PostgreSQL (database)
- Zustand (client state management if needed)
- React 19 features

---

## 1. File Structure

Create the following files in the Polaris v3 codebase:

```
frontend/
├── app/
│   └── (public)/
│       └── pricing/
│           └── page.tsx                 # Main pricing page (Server Component)
├── components/
│   └── pricing/
│       ├── PricingHeader.tsx            # Hero section
│       ├── ProductSelector.tsx          # Product tabs (Client Component)
│       ├── CurrencyToggle.tsx           # USD/INR toggle (Client Component)
│       ├── PricingCard.tsx              # Individual pricing card
│       ├── PricingBadge.tsx             # "Most Popular" badge
│       ├── FeatureList.tsx              # Checkmark feature list
│       ├── CommonFeatures.tsx           # "All Plans Include" section
│       ├── PricingFAQ.tsx               # Questions section
│       └── index.ts                     # Barrel export
├── types/
│   └── pricing.ts                       # TypeScript interfaces
├── lib/
│   └── data/
│       └── pricingPlans.ts              # Pricing data constants
└── styles/
    └── pricing.css                      # Page-specific styles (if needed)
```

---

## 2. TypeScript Types

Create `frontend/types/pricing.ts`:

```typescript
// Pricing tier discriminated union
export type SubscriptionTier =
  | 'explorer'
  | 'navigator'
  | 'voyager'
  | 'crew'
  | 'fleet'
  | 'armada';

// Plan category
export type PlanCategory = 'individual' | 'team';

// Currency
export type Currency = 'USD' | 'INR';

// Product types
export type SolaraProduct =
  | 'polaris'
  | 'constellation'
  | 'nova'
  | 'orbit'
  | 'nebula'
  | 'spectrum';

// Pricing structure for individual plans
export interface IndividualPlanAllocation {
  blueprintsPerMonth: number;
  blueprintsSaved: number;
  rolloverMonths: 12;
}

// Pricing structure for team plans (per user)
export interface TeamPlanAllocation {
  blueprintsPerUserPerMonth: number;
  blueprintsSavedPerUser: number;
  rolloverMonthsPerUser: 12;
}

// Common feature structure
export interface CommonFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// Pricing plan structure
export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  category: PlanCategory;
  name: string;
  label: string;
  price: {
    monthly: {
      USD: number;
      INR: number;
    };
    annual: {
      USD: number;
      INR: number;
    };
  };
  allocation: IndividualPlanAllocation | TeamPlanAllocation;
  savings?: {
    amount: number;
    percentage: number;
  };
  targetAudience: string;
  features: string[];
  ctaText: string;
  ctaAction: string; // URL or action
  isPopular?: boolean;
  isHighlighted?: boolean;
  badge?: string;
}

// Product selector item
export interface SolaraProductItem {
  id: SolaraProduct;
  name: string;
  description: string;
  status: 'live' | 'coming-soon';
  available: boolean;
}
```

---

## 3. Pricing Data Constants

Create `frontend/lib/data/pricingPlans.ts`:

```typescript
import { PricingPlan, SolaraProductItem } from '@/types/pricing';
import {
  Sparkles,
  Shield,
  Save,
  FileText,
  Clock,
  Lock
} from 'lucide-react'; // Using lucide-react for icons

// Exchange rate constant (update as needed)
const USD_TO_INR = 83;

// Individual Plans
export const INDIVIDUAL_PLANS: PricingPlan[] = [
  {
    id: 'explorer',
    tier: 'explorer',
    category: 'individual',
    name: 'Explorer',
    label: 'PERFECT FOR GETTING STARTED',
    price: {
      monthly: { USD: 19, INR: 19 * USD_TO_INR },
      annual: { USD: 19 * 12 * 0.8, INR: 19 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerMonth: 5,
      blueprintsSaved: 5,
      rolloverMonths: 12
    },
    targetAudience: 'Perfect for individuals exploring Solara-powered learning design',
    features: [
      'Solara-powered blueprint generation',
      'Professional templates & formatting',
      'Export to PDF & Word',
      'Community support'
    ],
    ctaText: 'Get Started for Free',
    ctaAction: '/signup',
    isHighlighted: false
  },
  {
    id: 'navigator',
    tier: 'navigator',
    category: 'individual',
    name: 'Navigator',
    label: 'FOR PROFESSIONALS & CREATORS',
    price: {
      monthly: { USD: 39, INR: 39 * USD_TO_INR },
      annual: { USD: 39 * 12 * 0.8, INR: 39 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerMonth: 20,
      blueprintsSaved: 20,
      rolloverMonths: 12
    },
    savings: {
      amount: 1.85,
      percentage: 49
    },
    targetAudience: 'Individual L&D professionals who need more capacity',
    features: [
      'Everything in Explorer',
      'Save $1.85 per generation (49% cheaper)',
      'Priority support (24h response)'
    ],
    ctaText: 'Get Started for Free',
    ctaAction: '/signup',
    isPopular: true,
    isHighlighted: true,
    badge: 'MOST POPULAR'
  },
  {
    id: 'voyager',
    tier: 'voyager',
    category: 'individual',
    name: 'Voyager',
    label: 'FOR POWER USERS & CONSULTANTS',
    price: {
      monthly: { USD: 79, INR: 79 * USD_TO_INR },
      annual: { USD: 79 * 12 * 0.8, INR: 79 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerMonth: 50,
      blueprintsSaved: 50,
      rolloverMonths: 12
    },
    savings: {
      amount: 2.22,
      percentage: 58
    },
    targetAudience: 'For power users who need more generation and storage capacity',
    features: [
      'Everything in Navigator',
      'Save $2.22 per generation (58% cheaper)'
    ],
    ctaText: 'Get Started for Free',
    ctaAction: '/signup',
    isHighlighted: false
  }
];

// Team Plans
export const TEAM_PLANS: PricingPlan[] = [
  {
    id: 'crew',
    tier: 'crew',
    category: 'team',
    name: 'Crew',
    label: 'SMALL TEAMS, BIG IMPACT',
    price: {
      monthly: { USD: 24, INR: 24 * USD_TO_INR },
      annual: { USD: 24 * 12 * 0.8, INR: 24 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerUserPerMonth: 10,
      blueprintsSavedPerUser: 10,
      rolloverMonthsPerUser: 12
    },
    targetAudience: 'Perfect for small teams just getting started with collaborative learning design',
    features: [
      'Shared team workspace',
      'Real-time collaboration',
      'Role-based permissions',
      'Team analytics dashboard',
      'Bulk export to Word & PDF',
      'Priority email support'
    ],
    ctaText: 'Reach Out',
    ctaAction: '/contact-sales',
    isHighlighted: false
  },
  {
    id: 'fleet',
    tier: 'fleet',
    category: 'team',
    name: 'Fleet',
    label: 'SCALE YOUR OPERATIONS',
    price: {
      monthly: { USD: 64, INR: 64 * USD_TO_INR },
      annual: { USD: 64 * 12 * 0.8, INR: 64 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerUserPerMonth: 30,
      blueprintsSavedPerUser: 30,
      rolloverMonthsPerUser: 12
    },
    targetAudience: 'For growing L&D teams scaling their learning programs with increased usage capacity',
    features: [
      'Everything in Crew',
      'SSO with OAuth/SAML',
      'Advanced user management',
      'Priority support (4-6 HR response)',
      'Custom onboarding session',
      'Advanced team analytics',
      'Audit logs'
    ],
    ctaText: 'Reach Out',
    ctaAction: '/contact-sales',
    isPopular: true,
    isHighlighted: true,
    badge: 'POPULAR CHOICE'
  },
  {
    id: 'armada',
    tier: 'armada',
    category: 'team',
    name: 'Armada',
    label: 'DEPARTMENT & ORGANIZATION SCALE',
    price: {
      monthly: { USD: 129, INR: 129 * USD_TO_INR },
      annual: { USD: 129 * 12 * 0.8, INR: 129 * 12 * 0.8 * USD_TO_INR }
    },
    allocation: {
      blueprintsPerUserPerMonth: 60,
      blueprintsSavedPerUser: 60,
      rolloverMonthsPerUser: 12
    },
    targetAudience: 'Enterprise-grade solution for larger L&D organizations requiring maximum usage capacity',
    features: [
      'Everything in Fleet',
      'Dedicated success manager',
      'Quarterly business reviews',
      'Custom integrations & API',
      'Advanced security controls',
      'Custom usage alerts',
      'SLA with uptime guarantee',
      'Training & workshops'
    ],
    ctaText: 'Reach Out',
    ctaAction: '/contact-sales',
    isHighlighted: false
  }
];

// Common features across all plans
export const COMMON_FEATURES = [
  {
    icon: Sparkles,
    title: 'Solara-Powered Generation',
    description: 'Advanced AI with intelligent processing'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and data protection'
  },
  {
    icon: Save,
    title: 'Auto-Save',
    description: 'Never lose your progress with automatic saves'
  },
  {
    icon: FileText,
    title: 'Comprehensive Blueprints',
    description: 'Executive summaries, objectives, and KPIs'
  },
  {
    icon: Clock,
    title: 'Quick Generation',
    description: 'Complete blueprints in 2-3 minutes'
  },
  {
    icon: Lock,
    title: 'Data Privacy',
    description: 'Your data never used for AI training'
  }
];

// Solara product lineup
export const SOLARA_PRODUCTS: SolaraProductItem[] = [
  {
    id: 'polaris',
    name: 'Polaris',
    description: 'AI-Powered Learning Blueprint Generator',
    status: 'live',
    available: true
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'Coming Soon',
    status: 'coming-soon',
    available: false
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Coming Soon',
    status: 'coming-soon',
    available: false
  },
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'Coming Soon',
    status: 'coming-soon',
    available: false
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Coming Soon',
    status: 'coming-soon',
    available: false
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    description: 'Coming Soon',
    status: 'coming-soon',
    available: false
  }
];
```

---

## 4. Tailwind CSS Configuration

Add custom colors to `frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      colors: {
        // Pricing page color palette
        'pricing-bg': 'rgb(2, 12, 27)',
        'pricing-text': 'rgb(224, 224, 224)',
        'pricing-accent': 'rgb(167, 218, 219)',
        'pricing-accent-muted': 'rgb(176, 197, 198)',
        'pricing-cta': 'rgb(79, 70, 229)',
        // Card colors
        'card-bg-standard': 'rgba(255, 255, 255, 0.02)',
        'card-border-standard': 'rgba(255, 255, 255, 0.08)',
        'card-bg-highlighted': 'rgba(79, 70, 229, 0.15)',
        'card-border-highlighted': 'rgba(79, 70, 229, 0.3)',
        'card-bg-active': 'rgba(9, 21, 33, 0.4)',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'pricing-card': '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
```

Add fonts to `frontend/app/layout.tsx`:

```typescript
import { Quicksand, Lato } from 'next/font/google';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
});

// Apply in body className: ${quicksand.variable} ${lato.variable}
```

---

## 5. Component Implementation

### 5.1 Main Page Component

Create `frontend/app/(public)/pricing/page.tsx`:

```typescript
import { Metadata } from 'next';
import {
  PricingHeader,
  ProductSelector,
  CurrencyToggle,
  PricingCard,
  CommonFeatures,
  PricingFAQ
} from '@/components/pricing';
import { INDIVIDUAL_PLANS, TEAM_PLANS } from '@/lib/data/pricingPlans';

export const metadata: Metadata = {
  title: 'Pricing - Smartslate Solara',
  description: 'Choose the perfect plan for your learning design needs. Flexible pricing for individuals and teams.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-pricing-bg font-lato">
      {/* Hero Section */}
      <PricingHeader />

      {/* Product Selector */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductSelector />
      </section>

      {/* Currency Toggle */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <CurrencyToggle />
      </section>

      {/* Individual Plans */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-12 font-quicksand text-5xl font-bold text-pricing-accent">
          Individual Plans
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {INDIVIDUAL_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      {/* Team Plans */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-quicksand text-5xl font-bold text-pricing-accent">
          Team Plans
        </h2>
        <p className="mb-12 text-lg text-pricing-text">
          <strong>Important:</strong> Team plan limits are <strong>per user</strong> -
          each team member gets the full allocation, including rollover credits.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {TEAM_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      {/* Common Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <CommonFeatures />
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <PricingFAQ />
      </section>
    </main>
  );
}
```

### 5.2 Pricing Header Component

Create `frontend/components/pricing/PricingHeader.tsx`:

```typescript
export function PricingHeader() {
  return (
    <header className="mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
      <h1 className="mb-6 font-quicksand text-6xl font-bold leading-tight text-pricing-text">
        One Platform. Every Stage of Learning. <br />
        Unlimited Potential.
      </h1>
      <p className="mx-auto mb-4 max-w-3xl text-xl text-pricing-accent">
        Unified pricing for the complete Solara Learning Engine
      </p>
      <p className="mx-auto max-w-3xl text-lg text-pricing-accent-muted">
        The platform transforms educational experiences across multiple touchpoints
        with adaptable pricing models designed to accommodate growth without excessive costs.
      </p>
    </header>
  );
}
```

### 5.3 Product Selector Component (Client Component)

Create `frontend/components/pricing/ProductSelector.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { SOLARA_PRODUCTS } from '@/lib/data/pricingPlans';
import type { SolaraProduct } from '@/types/pricing';

export function ProductSelector() {
  const [selectedProduct, setSelectedProduct] = useState<SolaraProduct>('polaris');

  return (
    <div className="space-y-6">
      <h3 className="text-center font-quicksand text-4xl font-bold text-pricing-accent">
        Choose Your Solara Product
      </h3>
      <div className="flex flex-wrap justify-center gap-4">
        {SOLARA_PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => product.available && setSelectedProduct(product.id)}
            disabled={!product.available}
            className={`
              rounded-xl px-6 py-3 text-sm font-semibold transition-all
              ${
                selectedProduct === product.id && product.available
                  ? 'border border-pricing-accent bg-pricing-accent/15 text-pricing-accent'
                  : product.available
                  ? 'border border-transparent text-pricing-accent-muted hover:text-pricing-accent'
                  : 'cursor-not-allowed text-pricing-accent-muted/50'
              }
            `}
          >
            {product.name}
            {product.status === 'live' && (
              <span className="ml-2 rounded bg-pricing-accent px-2 py-0.5 text-xs font-bold uppercase text-pricing-bg">
                LIVE
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 5.4 Currency Toggle Component (Client Component)

Create `frontend/components/pricing/CurrencyToggle.tsx`:

```typescript
'use client';

import { useState } from 'react';
import type { Currency } from '@/types/pricing';

export function CurrencyToggle() {
  const [currency, setCurrency] = useState<Currency>('USD');

  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={() => setCurrency('USD')}
        className={`
          rounded-lg border px-6 py-2 text-sm font-semibold transition-all
          ${
            currency === 'USD'
              ? 'border-pricing-accent bg-pricing-accent/15 text-pricing-accent'
              : 'border-transparent text-pricing-accent-muted hover:text-pricing-accent'
          }
        `}
      >
        USD
      </button>
      <button
        onClick={() => setCurrency('INR')}
        className={`
          rounded-lg border px-6 py-2 text-sm font-semibold transition-all
          ${
            currency === 'INR'
              ? 'border-pricing-accent bg-pricing-accent/15 text-pricing-accent'
              : 'border-transparent text-pricing-accent-muted hover:text-pricing-accent'
          }
        `}
      >
        INR
      </button>
    </div>
  );
}
```

### 5.5 Pricing Card Component

Create `frontend/components/pricing/PricingCard.tsx`:

```typescript
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { PricingPlan } from '@/types/pricing';
import { PricingBadge } from './PricingBadge';

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const isTeamPlan = plan.category === 'team';
  const allocation = plan.allocation;

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl p-8 shadow-pricing-card transition-transform hover:scale-105
        ${
          plan.isHighlighted
            ? 'border border-card-border-highlighted bg-card-bg-highlighted'
            : 'border border-card-border-standard bg-card-bg-standard'
        }
      `}
    >
      {/* Badge */}
      {plan.badge && <PricingBadge text={plan.badge} />}

      {/* Label */}
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pricing-accent-muted">
        {plan.label}
      </p>

      {/* Plan Name */}
      <h4 className="mb-4 font-quicksand text-2xl font-bold text-pricing-text">
        {plan.name}
      </h4>

      {/* Price */}
      <div className="mb-6">
        <h3 className="font-quicksand text-3xl font-bold text-pricing-accent">
          ${plan.price.monthly.USD}
          <span className="text-lg font-normal text-pricing-accent-muted">/month</span>
        </h3>
      </div>

      {/* Allocation */}
      <div className="mb-6 space-y-2">
        {isTeamPlan ? (
          <>
            <p className="flex items-center text-sm text-pricing-text">
              <span className="mr-2 text-pricing-accent">★</span>
              <strong>
                {(allocation as any).blueprintsPerUserPerMonth} Starmaps/user/month
              </strong>
            </p>
            <p className="text-xs text-pricing-accent-muted">
              (Unused roll over for 12 months per user)
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center text-sm text-pricing-text">
              <span className="mr-2 text-pricing-accent">★</span>
              <strong>{(allocation as any).blueprintsPerMonth} Starmaps/month</strong>
            </p>
            <p className="text-xs text-pricing-accent-muted">
              (Unused roll over for 12 months with {(allocation as any).blueprintsSaved} saved)
            </p>
          </>
        )}
      </div>

      {/* Target Audience */}
      <p className="mb-6 text-sm text-pricing-accent-muted">
        {plan.targetAudience}
      </p>

      {/* Features */}
      <ul className="mb-8 flex-grow space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-pricing-text">
            <Check className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-pricing-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Savings */}
      {plan.savings && (
        <p className="mb-4 text-sm text-pricing-accent-muted">
          Save ${plan.savings.amount} per generation ({plan.savings.percentage}% cheaper)
        </p>
      )}

      {/* CTA Button */}
      <Link
        href={plan.ctaAction}
        className={`
          block rounded px-6 py-3 text-center text-sm font-semibold transition-colors
          ${
            plan.ctaText.includes('Reach Out')
              ? 'border border-pricing-accent text-pricing-accent hover:bg-pricing-accent/10'
              : 'bg-pricing-cta text-pricing-text hover:bg-pricing-cta/90'
          }
        `}
      >
        {plan.ctaText}
      </Link>
    </div>
  );
}
```

### 5.6 Pricing Badge Component

Create `frontend/components/pricing/PricingBadge.tsx`:

```typescript
interface PricingBadgeProps {
  text: string;
}

export function PricingBadge({ text }: PricingBadgeProps) {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
      <span className="inline-block rounded-full bg-pricing-accent px-4 py-2 text-xs font-extrabold uppercase text-pricing-bg">
        {text}
      </span>
    </div>
  );
}
```

### 5.7 Common Features Component

Create `frontend/components/pricing/CommonFeatures.tsx`:

```typescript
import { COMMON_FEATURES } from '@/lib/data/pricingPlans';

export function CommonFeatures() {
  return (
    <div className="space-y-12">
      <h3 className="text-center font-quicksand text-4xl font-bold text-pricing-accent">
        All Plans Include These Features
      </h3>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {COMMON_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-card-border-standard bg-card-bg-standard p-6 text-center"
            >
              <div className="mb-4 flex justify-center">
                <Icon className="h-10 w-10 text-pricing-accent" />
              </div>
              <h4 className="mb-2 font-quicksand text-lg font-bold text-pricing-text">
                {feature.title}
              </h4>
              <p className="text-sm text-pricing-accent-muted">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 5.8 Pricing FAQ Component

Create `frontend/components/pricing/PricingFAQ.tsx`:

```typescript
import Link from 'next/link';

export function PricingFAQ() {
  return (
    <div className="space-y-8 text-center">
      <h4 className="font-quicksand text-2xl font-bold text-pricing-accent">
        Questions About Pricing?
      </h4>
      <p className="text-pricing-accent-muted">
        Our team is here to help you find the perfect plan for your organization.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/contact-sales"
          className="rounded bg-pricing-accent/15 px-6 py-3 font-semibold text-pricing-accent transition-colors hover:bg-pricing-accent/25"
        >
          Contact Sales
        </Link>
        <Link
          href="/features"
          className="rounded border border-pricing-accent px-6 py-3 font-semibold text-pricing-accent transition-colors hover:bg-pricing-accent/10"
        >
          View All Features
        </Link>
      </div>
    </div>
  );
}
```

### 5.9 Barrel Export

Create `frontend/components/pricing/index.ts`:

```typescript
export { PricingHeader } from './PricingHeader';
export { ProductSelector } from './ProductSelector';
export { CurrencyToggle } from './CurrencyToggle';
export { PricingCard } from './PricingCard';
export { PricingBadge } from './PricingBadge';
export { CommonFeatures } from './CommonFeatures';
export { PricingFAQ } from './PricingFAQ';
```

---

## 6. Responsive Design Considerations

Add responsive utilities throughout:

```typescript
// Mobile: Single column (default)
// Tablet: 2 columns (md:grid-cols-2)
// Desktop: 3 columns (lg:grid-cols-3)

<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>

// Header text responsive sizing
<h1 className="text-4xl sm:text-5xl md:text-6xl">
  Title
</h1>

// Container padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

---

## 7. Accessibility Requirements

Ensure the following accessibility features:

1. **Semantic HTML**: Use `<main>`, `<section>`, `<header>` tags
2. **ARIA Labels**: Add `aria-label` to interactive elements
3. **Keyboard Navigation**: All buttons/links focusable via Tab
4. **Focus Indicators**: Add `focus:ring-2 focus:ring-pricing-accent` to interactive elements
5. **Color Contrast**: Ensure WCAG AA compliance (already met with current colors)
6. **Screen Reader Text**: Add visually hidden labels where needed

Example with accessibility:

```typescript
<button
  aria-label={`Select ${product.name} product`}
  aria-pressed={selectedProduct === product.id}
  className="... focus:outline-none focus:ring-2 focus:ring-pricing-accent"
>
  {product.name}
</button>
```

---

## 8. State Management (Optional)

If you need global currency/billing cycle state, use Zustand:

Create `frontend/lib/stores/pricingStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/types/pricing';

type BillingCycle = 'monthly' | 'annual';

interface PricingState {
  currency: Currency;
  billingCycle: BillingCycle;
  setCurrency: (currency: Currency) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
}

export const usePricingStore = create<PricingState>()(
  persist(
    (set) => ({
      currency: 'USD',
      billingCycle: 'monthly',
      setCurrency: (currency) => set({ currency }),
      setBillingCycle: (billingCycle) => set({ billingCycle }),
    }),
    {
      name: 'pricing-preferences',
    }
  )
);
```

Use in components:

```typescript
'use client';

import { usePricingStore } from '@/lib/stores/pricingStore';

export function CurrencyToggle() {
  const { currency, setCurrency } = usePricingStore();
  // ...
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

Create `frontend/__tests__/components/pricing/PricingCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { INDIVIDUAL_PLANS } from '@/lib/data/pricingPlans';

describe('PricingCard', () => {
  it('renders plan name and price', () => {
    const plan = INDIVIDUAL_PLANS[0];
    render(<PricingCard plan={plan} />);

    expect(screen.getByText(plan.name)).toBeInTheDocument();
    expect(screen.getByText(`$${plan.price.monthly.USD}`)).toBeInTheDocument();
  });

  it('shows badge for popular plans', () => {
    const popularPlan = INDIVIDUAL_PLANS.find((p) => p.isPopular);
    if (popularPlan) {
      render(<PricingCard plan={popularPlan} />);
      expect(screen.getByText(popularPlan.badge!)).toBeInTheDocument();
    }
  });

  it('renders all features', () => {
    const plan = INDIVIDUAL_PLANS[0];
    render(<PricingCard plan={plan} />);

    plan.features.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });
});
```

### 9.2 Integration Tests

Test the full page rendering and interactions.

---

## 10. Performance Optimizations

1. **Server Components**: Most components are Server Components (no client-side JS)
2. **Lazy Loading**: Lazy load icons if needed
3. **Image Optimization**: Use Next.js `Image` component for any images
4. **Code Splitting**: Client components auto-split
5. **Font Optimization**: Next.js font optimization with `next/font`

---

## 11. Database Schema (Optional)

If you want to store pricing data in Supabase:

Create migration `supabase/migrations/XXXX_pricing_tiers.sql`:

```sql
-- Pricing tiers table
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('individual', 'team')),
  price_usd_monthly DECIMAL(10, 2) NOT NULL,
  price_inr_monthly DECIMAL(10, 2) NOT NULL,
  price_usd_annual DECIMAL(10, 2) NOT NULL,
  price_inr_annual DECIMAL(10, 2) NOT NULL,
  blueprints_per_month INTEGER,
  blueprints_per_user_per_month INTEGER,
  blueprints_saved INTEGER,
  rollover_months INTEGER DEFAULT 12,
  features JSONB NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_highlighted BOOLEAN DEFAULT FALSE,
  badge_text TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on tier_name for faster lookups
CREATE INDEX idx_pricing_tiers_tier_name ON pricing_tiers(tier_name);

-- Enable RLS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access (pricing is public information)
CREATE POLICY "Pricing tiers are viewable by everyone"
  ON pricing_tiers
  FOR SELECT
  USING (true);

-- Only admins can modify (implement based on your admin logic)
CREATE POLICY "Only admins can modify pricing tiers"
  ON pricing_tiers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

Seed the data:

```sql
INSERT INTO pricing_tiers (tier_name, category, price_usd_monthly, price_inr_monthly, price_usd_annual, price_inr_annual, blueprints_per_month, blueprints_saved, features, display_order)
VALUES
  ('explorer', 'individual', 19, 1577, 182.40, 15139.20, 5, 5, '["Solara-powered blueprint generation", "Professional templates & formatting", "Export to PDF & Word", "Community support"]', 1),
  ('navigator', 'individual', 39, 3237, 374.40, 31075.20, 20, 20, '["Everything in Explorer", "Save $1.85 per generation (49% cheaper)", "Priority support (24h response)"]', 2);
-- Add more rows...
```

Create API route `frontend/app/api/pricing/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: tiers, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('display_order');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    );
  }

  return NextResponse.json({ tiers });
}
```

---

## 12. Deployment Checklist

Before deploying:

- [ ] Test responsive design on mobile, tablet, desktop
- [ ] Verify all links work (signup, contact sales, features)
- [ ] Check accessibility with screen reader
- [ ] Test keyboard navigation
- [ ] Verify color contrast ratios
- [ ] Test currency toggle functionality
- [ ] Ensure fonts load correctly
- [ ] Optimize images (if any)
- [ ] Add meta tags for SEO
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Run Lighthouse audit
- [ ] Test loading performance

---

## 13. Next Steps

1. **Analytics**: Add tracking for button clicks and plan selections
2. **A/B Testing**: Test different pricing copy or layouts
3. **Internationalization**: Add i18n for multiple languages
4. **Dynamic Pricing**: Implement regional pricing based on user location
5. **Comparison Tool**: Add plan comparison matrix
6. **Testimonials**: Add social proof near pricing cards
7. **FAQ Accordion**: Expand FAQ section with Radix Accordion
8. **Annual Toggle**: Add billing cycle toggle (monthly vs annual)
9. **Trial Period**: Add "Start Free Trial" flow
10. **Razorpay Integration**: Connect payment processing for INR

---

## 14. Code Quality Standards

Follow these standards from CLAUDE.md:

✅ **DO:**
- Use Server Components by default
- Explicit TypeScript types (no `any`)
- Tailwind utility classes
- Absolute imports with `@/` prefix
- Component composition over large files
- Semantic HTML elements
- WCAG AA accessibility compliance

❌ **DON'T:**
- Use `any` type
- Inline styles
- Hardcoded values (use constants)
- Client Components unnecessarily
- Skip accessibility attributes
- Ignore responsive design

---

## 15. Maintenance

Update pricing:
1. Modify constants in `frontend/lib/data/pricingPlans.ts`
2. Run type checking: `npm run typecheck`
3. Test locally: `npm run dev`
4. Commit changes with descriptive message
5. Deploy to staging for QA
6. Deploy to production

---

## Reference

- Design Source: `/pricing.md`
- Tech Stack: CLAUDE.md
- Component Patterns: `.cursor/rules/nextjs_app.mdc`
- Styling Guide: `.cursor/rules/tailwind.mdc`
- TypeScript Guide: `.cursor/rules/typescript.mdc`
