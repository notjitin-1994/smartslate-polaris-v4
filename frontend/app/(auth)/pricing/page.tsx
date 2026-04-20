'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Save,
  FileText,
  Clock,
  Lock,
  Check,
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Zap,
  CheckCircle,
  Target,
  Users,
  FileCheck,
  ScanSearch,
  ArrowRightLeft,
  Download,
} from 'lucide-react';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import CurrencyToggle from '@/components/pricing/pricing/CurrencyToggle';
import BillingCycleToggle from '@/components/pricing/pricing/BillingCycleToggle';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAvailableUpgradePlans } from '@/lib/utils/tierDisplay';
import { CustomCheckoutButton } from '@/components/pricing/CustomCheckoutButton';
import { RazorpayProvider } from '@/components/providers/RazorpayProvider';
import { ToastProvider } from '@/src/components/ui/Toast';
import { getPlanPrice } from '@/lib/config/razorpayPlans';
import { Footer } from '@/components/layout/Footer';
import TeamPlanModal from '@/components/pricing/TeamPlanModal';
import { openRazorpayCheckout } from '@/lib/services/razorpayCheckoutService';

interface Plan {
  id: string;
  name: string;
  label: string;
  priceUSD: number; // Price in USD (base currency)
  priceINR: number; // Price in INR (for Razorpay)
  badge?: string;
  starmaps: number;
  rollover: number;
  savings?: string;
  features: string[];
  isPopular?: boolean;
}

const individualPlans: Plan[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    label: 'PERFECT FOR GETTING STARTED',
    priceUSD: 19, // USD price
    priceINR: 1599, // Total with GST in INR (₹1,599)
    starmaps: 5,
    rollover: 12,
    savings: 'Start here before upgrading to higher tiers',
    features: [
      '15x Faster Time-to-Launch',
      '1-Hour Blueprint Delivery',
      'Zero Revision Cycles',
      '100% Requirements Captured',
      'Perfect Stakeholder Alignment',
      'Production-Ready Documentation',
      'Automated Gap Analysis',
      'Business-to-Learning Translation',
      'Multi-Format Export',
    ],
  },
  {
    id: 'navigator',
    name: 'Navigator',
    label: 'FOR PROFESSIONALS & CREATORS',
    priceUSD: 39, // USD price
    priceINR: 3499, // Total with GST in INR (₹3,499)
    badge: 'MOST POPULAR',
    starmaps: 25,
    rollover: 12,
    savings: 'Save $1.85 per generation (49% cheaper)',
    features: [
      'Everything in Explorer',
      '5x more starmaps per month',
      'Priority support (24h response)',
    ],
    isPopular: true,
  },
  {
    id: 'voyager',
    name: 'Voyager',
    label: 'FOR POWER USERS & CONSULTANTS',
    priceUSD: 79, // USD price
    priceINR: 6999, // Total with GST in INR (₹6,999)
    starmaps: 50,
    rollover: 12,
    savings: 'Save $2.22 per generation (58% cheaper)',
    features: [
      'Everything in Navigator',
      '10x more starmaps per month',
      'Priority support (12h response)',
    ],
  },
];

const teamPlans: Plan[] = [
  {
    id: 'crew',
    name: 'Crew',
    label: 'SMALL TEAMS, BIG IMPACT',
    priceUSD: 24, // USD price
    priceINR: 1999, // Total with GST in INR (₹1,999) per seat
    starmaps: 10,
    rollover: 12,
    features: [
      '15x Faster Time-to-Launch',
      '1-Hour Blueprint Delivery',
      'Zero Revision Cycles',
      '100% Requirements Captured',
      'Perfect Stakeholder Alignment',
      'Production-Ready Documentation',
      'Automated Gap Analysis',
      'Business-to-Learning Translation',
      'Multi-Format Export',
    ],
  },
  {
    id: 'fleet',
    name: 'Fleet',
    label: 'SCALE YOUR OPERATIONS',
    priceUSD: 64, // USD price
    priceINR: 5399, // Total with GST in INR (₹5,399) per seat
    badge: 'POPULAR CHOICE',
    starmaps: 30,
    rollover: 12,
    features: [
      'Everything in Crew',
      '3x more blueprints per user',
      'Priority support (24h response)',
      'Access to Solara Learning Engine Pro Coming Soon',
    ],
    isPopular: true,
  },
  {
    id: 'armada',
    name: 'Armada',
    label: 'DEPARTMENT & ORGANIZATION SCALE',
    priceUSD: 129, // USD price
    priceINR: 10899, // Total with GST in INR (₹10,899) per seat
    starmaps: 60,
    rollover: 12,
    features: [
      'Everything in Fleet',
      '6x more blueprints per user',
      'Priority support (12h response)',
      'Access to Solara Learning Engine Pro Coming Soon',
    ],
  },
];

const commonFeatures = [
  {
    icon: Zap,
    title: '15x Faster Time-to-Launch',
    description:
      'Cut weeks of planning down to hours. Launch learning programs at unprecedented speed',
  },
  {
    icon: Clock,
    title: '1-Hour Design Delivery',
    description:
      'Complete, production-ready learning experience designs created in under 60 minutes',
  },
  {
    icon: CheckCircle,
    title: 'Zero Revision Cycles',
    description:
      'First draft is final. AI-Assisted accuracy eliminates endless back-and-forth revisions',
  },
  {
    icon: Target,
    title: '100% Requirements Captured',
    description:
      'Nothing falls through the cracks. Every stakeholder need documented and addressed',
  },
  {
    icon: Users,
    title: 'Perfect Stakeholder Alignment',
    description:
      'Get buy-in faster with learning designs that speak to every stakeholder perspective',
  },
  {
    icon: FileCheck,
    title: 'Production-Ready Documentation',
    description:
      'Polished, professional learning designs ready to present to leadership on day one',
  },
  {
    icon: ScanSearch,
    title: 'Automated Gap Analysis',
    description:
      'AI identifies missing requirements and potential issues before they become problems',
  },
  {
    icon: ArrowRightLeft,
    title: 'Business-to-Learning Translation',
    description: 'Transforms business objectives into actionable learning outcomes automatically',
  },
  {
    icon: Download,
    title: 'Multi-Format Export',
    description:
      'Download learning designs in PDF, Word, or JSON. Share instantly with any stakeholder',
  },
];

function PricingCardComponent({
  plan,
  isTeam,
  billingCycle,
  onTeamPlanClick,
}: {
  plan: Plan;
  isTeam?: boolean;
  billingCycle?: 'monthly' | 'yearly';
  onTeamPlanClick?: (plan: Plan) => void;
}) {
  const { currency } = useCurrency();

  // Get the base monthly price based on selected currency
  const monthlyPrice = currency === 'USD' ? plan.priceUSD : plan.priceINR;

  // Calculate price based on billing cycle (yearly = 10x monthly)
  const displayPrice = billingCycle === 'yearly' ? monthlyPrice * 10 : monthlyPrice;
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`relative flex h-full flex-col rounded-2xl p-8 ${
        plan.isPopular
          ? 'border border-[rgba(79,70,229,0.3)] bg-[rgba(79,70,229,0.15)]'
          : 'border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]'
      } shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
          <span className="rounded-full bg-[rgb(167,218,219)] px-4 py-2 text-xs font-extrabold text-[rgb(2,12,27)] uppercase">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan name and label */}
      <div className="mb-6">
        <h4 className="mb-2 text-2xl font-bold text-[rgb(224,224,224)]">{plan.name}</h4>
        <p className="text-sm font-semibold text-[rgb(176,197,198)]">{plan.label}</p>
      </div>

      {/* Price - displays in selected currency (USD or INR) and billing cycle */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-[rgb(167,218,219)]">
            {currencySymbol}
            {currency === 'INR'
              ? displayPrice.toLocaleString('en-IN')
              : displayPrice.toLocaleString('en-US')}
          </span>
          <span className="text-lg text-[rgb(176,197,198)]">
            /{billingCycle === 'yearly' ? 'year' : 'month'}
          </span>
        </div>
        {billingCycle === 'yearly' && (
          <p className="mt-2 text-sm text-[rgb(167,218,219)]">
            {currencySymbol}
            {currency === 'INR'
              ? monthlyPrice.toLocaleString('en-IN')
              : monthlyPrice.toLocaleString('en-US')}{' '}
            per month, billed annually
          </p>
        )}
      </div>

      {/* Starmaps/Blueprints allocation */}
      <div className="mb-6 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] p-4">
        <p className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">
          {plan.starmaps} {isTeam ? 'Blueprints per user' : 'Starmaps'}/month
        </p>
        <p className="text-xs text-[rgb(176,197,198)]">
          Unused roll over for {plan.rollover} months with {plan.starmaps} saved
          {isTeam && ' per user'}
        </p>
      </div>

      {/* Savings */}
      {plan.savings && <p className="mb-6 text-sm text-[rgb(167,218,219)]">{plan.savings}</p>}

      {/* CTA Button */}
      {isTeam ? (
        <button
          onClick={() => onTeamPlanClick?.(plan)}
          className={`mb-8 flex w-full items-center justify-center gap-2 rounded-md bg-[rgb(79,70,229)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[rgb(67,56,202)] active:scale-95`}
        >
          Upgrade Now
          <ArrowUpRight className="h-4 w-4" />
        </button>
      ) : (
        <>
          <CustomCheckoutButton
            planId={plan.id}
            tier={plan.id} // Using custom checkout modal with brand compliance
            billingCycle={billingCycle === 'yearly' ? 'annual' : 'monthly'}
            disabled={false}
            variant="primary"
            size="md"
            className="mb-8 w-full"
            buttonText="Upgrade Now"
            onCheckoutSuccess={() => {
              console.log(`Successfully upgraded to ${plan.name} plan`);
            }}
            onCheckoutError={(error) => {
              console.error(`Failed to upgrade to ${plan.name} plan:`, error);
            }}
          />
        </>
      )}

      {/* Features */}
      <ul className="mt-auto space-y-4">
        {plan.features.map((feature, index) => {
          // Special styling for Solara Learning Engine Pro feature
          if (feature.includes('Solara Learning Engine Pro Coming Soon')) {
            return (
              <li key={index} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                <span className="flex flex-wrap items-center gap-1 text-sm text-[rgb(224,224,224)]">
                  <span>
                    Access to{' '}
                    <span
                      className="font-semibold text-[rgb(167,218,219)]"
                      style={{
                        textShadow:
                          '0 0 10px rgba(167, 218, 219, 0.5), 0 0 20px rgba(167, 218, 219, 0.3)',
                      }}
                    >
                      Solara Learning Engine Pro
                    </span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[rgba(167,218,219,0.4)] bg-[rgba(167,218,219,0.12)] px-1.5 py-[2px] text-[10px] font-medium tracking-tight text-[rgb(167,218,219)] uppercase">
                    Soon
                  </span>
                </span>
              </li>
            );
          }

          // Regular feature rendering
          return (
            <li key={index} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
              <span className="text-sm text-[rgb(224,224,224)]">{feature}</span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

function PricingPageContent() {
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedTeamPlan, setSelectedTeamPlan] = useState<{
    tierName: 'Crew' | 'Fleet' | 'Armada';
    tierLabel: string;
    priceUSD: number;
    priceINR: number;
  } | null>(null);

  useEffect(() => {
    async function fetchUserTier() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setUserTier(profile.subscription_tier || 'free');
          }
        }
      } catch (error) {
        console.error('Error fetching user tier:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserTier();
  }, []);

  // Get filtered plans based on user's current tier
  const { individualPlans: availableIndividualPlans, teamPlans: availableTeamPlans } =
    getAvailableUpgradePlans(userTier);

  // Filter the plans to show only upgrade options
  const filteredIndividualPlans = individualPlans.filter((plan) =>
    availableIndividualPlans.includes(plan.id)
  );
  const filteredTeamPlans = teamPlans.filter((plan) => availableTeamPlans.includes(plan.id));

  return (
    <div className="min-h-screen bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      {/* Hero Section */}
      <div className="px-4 pt-24 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Column - Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-block rounded-full border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] px-4 py-2"
              >
                <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                  Learning Experience Design: Powered by{' '}
                  <span
                    className="text-[rgb(255,215,0)]"
                    style={{
                      textShadow:
                        '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)',
                    }}
                  >
                    Solara
                  </span>
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-heading mb-6 text-6xl leading-tight font-bold"
              >
                Transform Ideas into{' '}
                <span className="text-[rgb(167,218,219)]">Launch-Ready Learning Designs</span> in
                Hours
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 text-lg leading-relaxed text-[rgb(176,197,198)]"
              >
                Polaris eliminates weeks of planning with AI-Assisted Learning Experience Design.
                From stakeholder interviews to production-ready documentation, we automate the
                entire learning design process. No more revision cycles. No more misalignment. Just
                comprehensive, actionable learning designs delivered in 1 hour.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                    <Clock className="h-6 w-6 text-[rgb(167,218,219)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[rgb(167,218,219)]">15x</div>
                    <div className="text-sm text-[rgb(176,197,198)]">Faster Launch</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                    <Check className="h-6 w-6 text-[rgb(167,218,219)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[rgb(167,218,219)]">Zero</div>
                    <div className="text-sm text-[rgb(176,197,198)]">Revisions</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                    <Sparkles className="h-6 w-6 text-[rgb(167,218,219)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[rgb(167,218,219)]">100%</div>
                    <div className="text-sm text-[rgb(176,197,198)]">Accurate</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Infographic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8">
                {/* Process Flow Infographic */}
                <div className="space-y-2">
                  {[
                    {
                      step: '01',
                      title: 'Requirements In',
                      desc: 'Upload stakeholder needs',
                      icon: FileText,
                    },
                    {
                      step: '02',
                      title: 'AI Analysis',
                      desc: 'Automated gap detection',
                      icon: Sparkles,
                    },
                    {
                      step: '03',
                      title: 'Blueprint Out',
                      desc: 'Production-ready in 1 hour',
                      icon: Check,
                    },
                  ].map((item, index) => (
                    <React.Fragment key={item.step}>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-4 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                          <item.icon className="h-6 w-6 text-[rgb(167,218,219)]" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-[rgb(167,218,219)]">
                              {item.step}
                            </span>
                            <span className="text-sm font-bold text-[rgb(224,224,224)]">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-xs text-[rgb(176,197,198)]">{item.desc}</p>
                        </div>
                      </motion.div>
                      {index < 2 && (
                        <div className="flex justify-center">
                          <ArrowDown className="h-6 w-6 text-[rgb(167,218,219)]" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-[rgba(167,218,219,0.1)] blur-3xl" />
                <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-[rgba(79,70,229,0.1)] blur-3xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Individual Plans Section */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Currency and Billing Cycle Toggles */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-wrap items-center gap-4"
          >
            <CurrencyToggle />
            <BillingCycleToggle
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
            />
          </motion.div>

          <h3 className="font-heading mb-12 text-left text-4xl font-bold text-[rgb(167,218,219)]">
            Individual Plans
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(167,218,219)] border-t-transparent" />
            </div>
          ) : filteredIndividualPlans.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {filteredIndividualPlans.map((plan) => (
                <PricingCardComponent key={plan.id} plan={plan} billingCycle={billingCycle} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 text-center">
              <p className="text-lg text-[rgb(176,197,198)]">
                You&apos;re already at the highest individual tier! 🎉
              </p>
              <p className="mt-2 text-sm text-[rgb(176,197,198)]">
                Check out our team plans below for collaborative options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Plans */}
      <div className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h3 className="font-heading mb-4 text-left text-4xl font-bold text-[rgb(167,218,219)]">
            Team Plans
          </h3>
          <p className="mb-12 max-w-2xl text-left text-[rgb(176,197,198)]">
            Team plan limits are <strong>per user</strong> - each team member gets the full
            allocation, including rollover credits.
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(167,218,219)] border-t-transparent" />
            </div>
          ) : filteredTeamPlans.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {filteredTeamPlans.map((plan) => (
                <PricingCardComponent
                  key={plan.id}
                  plan={plan}
                  isTeam
                  billingCycle={billingCycle}
                  onTeamPlanClick={(selectedPlan) => {
                    setSelectedTeamPlan({
                      tierName: selectedPlan.name as 'Crew' | 'Fleet' | 'Armada',
                      tierLabel: selectedPlan.label,
                      priceUSD: selectedPlan.priceUSD,
                      priceINR: selectedPlan.priceINR,
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-8 text-center">
              <p className="text-lg text-[rgb(176,197,198)]">
                You&apos;re already at the highest team tier! 🎉
              </p>
              <p className="mt-2 text-sm text-[rgb(176,197,198)]">
                Contact sales for enterprise options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All Plans Include */}
      <div className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h3 className="font-heading mb-4 text-left text-4xl font-bold text-[rgb(167,218,219)]">
            Every Plan Includes
          </h3>
          <p className="mb-12 text-left text-lg text-[rgb(176,197,198)]">
            Core features that power your AI-Assisted Learning Experience Design
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {commonFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group flex flex-col items-start rounded-2xl border border-[rgba(167,218,219,0.1)] bg-[rgba(255,255,255,0.02)] p-6 transition-all duration-300 hover:border-[rgba(167,218,219,0.3)] hover:bg-[rgba(167,218,219,0.05)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(167,218,219,0.15)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[rgba(167,218,219,0.25)]">
                  <feature.icon className="h-6 w-6 text-[rgb(167,218,219)]" />
                </div>
                <h5 className="mb-2 text-lg font-bold text-[rgb(224,224,224)]">{feature.title}</h5>
                <p className="text-sm leading-relaxed text-[rgb(176,197,198)]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Team Plan Modal */}
      {selectedTeamPlan && (
        <TeamPlanModal
          isOpen={!!selectedTeamPlan}
          onClose={() => setSelectedTeamPlan(null)}
          tierName={selectedTeamPlan.tierName}
          tierLabel={selectedTeamPlan.tierLabel}
          priceUSD={selectedTeamPlan.priceUSD}
          priceINR={selectedTeamPlan.priceINR}
          isProcessing={isProcessingCheckout}
          onNext={async (seats, totalUSD, totalINR, currency, billingCycle) => {
            if (isProcessingCheckout) return;

            setIsProcessingCheckout(true);

            try {
              // Use INR amount for Razorpay (Razorpay only supports INR)
              const totalAmount = totalINR;
              const tierKey = selectedTeamPlan.tierName.toLowerCase() as
                | 'crew'
                | 'fleet'
                | 'armada';
              const billingCycleKey = billingCycle === 'yearly' ? 'annual' : 'monthly';

              console.log('Opening Razorpay checkout:', {
                tier: tierKey,
                billingCycle: billingCycleKey,
                seats,
                totalAmount,
              });

              const result = await openRazorpayCheckout(
                tierKey,
                billingCycleKey,
                totalAmount,
                seats // Pass seats for team plan pricing
              );

              console.log('Payment successful:', result);

              // Close modal after successful payment
              setSelectedTeamPlan(null);

              // Redirect to dashboard
              setTimeout(() => {
                window.location.href = result.redirectUrl || '/dashboard';
              }, 1000);
            } catch (error) {
              console.error('Payment failed:', error);
              const errorMessage =
                error instanceof Error ? error.message : 'Payment failed. Please try again.';

              // Only show error if not cancelled by user
              if (!errorMessage.includes('cancelled')) {
                alert(`Payment failed: ${errorMessage}`);
              }
            } finally {
              setIsProcessingCheckout(false);
            }
          }}
        />
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <CurrencyProvider>
      <ToastProvider>
        <RazorpayProvider>
          <PricingPageContent />
        </RazorpayProvider>
      </ToastProvider>
    </CurrencyProvider>
  );
}
