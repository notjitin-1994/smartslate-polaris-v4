/* eslint-disable no-restricted-syntax */
'use client';

import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Sparkles, Clock } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { PolarisPerks } from '@/components/auth/PolarisPerks';
import { LoginMarketingSection } from '@/components/auth/LoginMarketingSection';
import { LoginFormContent } from '@/components/auth/LoginFormContent';

export default function LoginPageClient(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#020C1B] px-2 py-8 md:px-6 lg:px-8 lg:py-12">
      {/* Animated background with enhanced depth */}
      <SwirlBackground />

      {/* Subtle ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(167, 218, 219, 0.08), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* MOBILE VIEW - Outside Desktop Container */}
      <div className="relative z-10 mx-auto w-full max-w-md px-4 xl:hidden">
        {/* MOBILE: Marketing Teaser (Enhanced) */}
        <section className="animate-fade-in-up mb-8" aria-label="Quick platform overview">
          {/* Status Badge */}
          <div className="border-primary/20 bg-primary/10 shadow-primary/5 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            <span className="text-primary text-xs font-semibold tracking-wide uppercase">
              AI-Assisted Learning Experience Design
            </span>
          </div>

          {/* Hero Headline */}
          <div className="glass-card space-y-6 p-6">
            <div>
              <h2 className="font-heading mb-2 text-2xl leading-tight font-bold text-white sm:text-3xl">
                Transform 6-Week Projects
                <span className="from-primary via-primary-light to-primary mt-1 block bg-gradient-to-r bg-clip-text text-transparent">
                  Into 1-Hour Designs
                </span>
              </h2>
              <p className="text-sm text-white/70">
                Join learning professionals who save 15+ hours per design
              </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard value="15x" label="Faster" icon={<Clock className="h-4 w-4" />} />
              <MetricCard value="98%" label="Time Saved" icon={<Sparkles className="h-4 w-4" />} />
              <MetricCard value="$0" label="To Start" icon={<Shield className="h-4 w-4" />} />
            </div>
          </div>
        </section>

        {/* LOGIN FORM: Enhanced Premium Card */}
        <div className="group relative">
          {/* Enhanced outer glow with animation */}
          <div
            className="pointer-events-none absolute -inset-[2px] rounded-3xl opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(135deg, rgba(167,218,219,0.15), rgba(79,70,229,0.1))',
            }}
            aria-hidden="true"
          />

          {/* Main login card - premium glassmorphism with enhanced blur */}
          <div
            className="relative rounded-2xl border border-white/10 p-5 shadow-2xl md:p-6 lg:p-7"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Gradient border overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
              }}
              aria-hidden="true"
            />

            {/* Ambient inner glow */}
            <div
              className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(167,218,219,0.08), transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              {/* HEADER: Title */}
              <div className="mb-6 space-y-2 text-left">
                {/* Title with enhanced typography */}
                <div className="space-y-1.5">
                  <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Welcome Back
                  </h1>
                  <p className="text-xs text-white/60">
                    Sign in to access your Learning Design Blueprints
                  </p>
                </div>
              </div>

              {/* LOGIN FORM */}
              <div className="mb-5">
                <LoginFormContent />
              </div>

              {/* FOOTER: Links + Legal */}
              <div className="space-y-3">
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/10" />
                  </div>
                </div>

                {/* Sign Up Link */}
                <p className="pt-4 text-left text-xs text-white/70">
                  New to Smartslate?{' '}
                  <Link
                    href="/signup"
                    className="text-primary hover:text-primary-light decoration-primary/30 hover:decoration-primary-light/50 font-semibold underline underline-offset-4 transition-colors duration-200"
                  >
                    Create free account
                  </Link>
                </p>

                {/* Legal Links */}
                <p className="text-left text-[11px] leading-relaxed text-white/40">
                  By continuing, you agree to our{' '}
                  <a
                    href="https://www.smartslate.io/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary text-white/50 underline underline-offset-2 transition-colors duration-200"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://www.smartslate.io/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary text-white/50 underline underline-offset-2 transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST INDICATORS (Mobile/Tablet) */}
        <div className="mt-8 space-y-4">
          <TrustBadges />
        </div>
      </div>

      {/* DESKTOP VIEW - Glassmorphic Master Container */}
      <div className="relative z-10 mx-auto hidden w-full xl:flex xl:items-center xl:justify-center xl:px-4 xl:py-6">
        {/* Glassmorphic Master Container */}
        <div
          className="relative flex w-full max-w-[1200px] overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(167, 218, 219, 0.2)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 80px rgba(167, 218, 219, 0.1)',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          {/* Ambient Glow Inside Container */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 30% 50%, rgba(167, 218, 219, 0.2), transparent 70%)',
            }}
            aria-hidden="true"
          />

          {/* Split-screen grid: Marketing (desktop) | Login Form - Minimal gap */}
          <div className="relative z-10 flex h-full w-full">
            {/* LEFT COLUMN: Marketing Section (Desktop Only) */}
            <aside
              className="scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 w-auto flex-shrink-0 overflow-y-auto px-5 py-6 pr-3"
              aria-label="Platform benefits and features"
              style={{ maxHeight: '100%' }}
            >
              <LoginMarketingSection />
            </aside>

            {/* RIGHT COLUMN: Login Form Container (Desktop Only) */}
            <div className="flex flex-1 items-center justify-start py-6 pr-5 pl-5">
              <div className="w-full max-w-md">
                {/* LOGIN FORM: Enhanced Premium Card */}
                <div className="group relative">
                  {/* Enhanced outer glow with animation */}
                  <div
                    className="pointer-events-none absolute -inset-[2px] rounded-3xl opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(167,218,219,0.15), rgba(79,70,229,0.1))',
                    }}
                    aria-hidden="true"
                  />

                  {/* Main login card - premium glassmorphism */}
                  <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-2xl md:p-6 lg:p-7">
                    {/* Gradient border overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                      }}
                      aria-hidden="true"
                    />

                    {/* Ambient inner glow */}
                    <div
                      className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 0%, rgba(167,218,219,0.08), transparent 70%)',
                      }}
                      aria-hidden="true"
                    />

                    <div className="relative z-10">
                      {/* HEADER: Title */}
                      <div className="mb-6 space-y-2 text-left">
                        {/* Title with enhanced typography */}
                        <div className="space-y-1.5">
                          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                            Welcome Back
                          </h1>
                          <p className="text-xs text-white/60">
                            Sign in to access your Learning Design Blueprints
                          </p>
                        </div>
                      </div>

                      {/* LOGIN FORM */}
                      <div className="mb-5">
                        <LoginFormContent />
                      </div>

                      {/* FOOTER: Links + Legal */}
                      <div className="space-y-3">
                        {/* Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/10" />
                          </div>
                        </div>

                        {/* Sign Up Link */}
                        <p className="pt-4 text-left text-xs text-white/70">
                          New to Smartslate?{' '}
                          <Link
                            href="/signup"
                            className="text-primary hover:text-primary-light decoration-primary/30 hover:decoration-primary-light/50 font-semibold underline underline-offset-4 transition-colors duration-200"
                          >
                            Create free account
                          </Link>
                        </p>

                        {/* Legal Links */}
                        <p className="text-left text-[11px] leading-relaxed text-white/40">
                          By continuing, you agree to our{' '}
                          <a
                            href="https://www.smartslate.io/legal/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary text-white/50 underline underline-offset-2 transition-colors duration-200"
                          >
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                            href="https://www.smartslate.io/legal/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary text-white/50 underline underline-offset-2 transition-colors duration-200"
                          >
                            Privacy Policy
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/** Mobile metric card with icon and glassmorphism */
function MetricCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative cursor-default">
      {/* Glow effect on hover */}
      <div
        className="from-primary/20 absolute -inset-0.5 rounded-xl bg-gradient-to-br to-transparent opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Card content */}
      <div className="group-hover:border-primary/20 relative rounded-lg border border-white/10 bg-white/5 p-3.5 text-center backdrop-blur-sm transition-all duration-300 group-hover:bg-white/10">
        <div className="text-primary mb-1.5 flex justify-center opacity-80">{icon}</div>
        <div className="mb-0.5 text-lg font-bold text-white">{value}</div>
        <div className="text-xs font-medium text-white/60">{label}</div>
      </div>
    </div>
  );
}

/** Trust indicators for mobile view */
function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Shield className="h-4 w-4 text-emerald-400" />
        <span>SOC 2 Compliant</span>
      </div>
      <div className="h-4 w-px bg-white/10" aria-hidden="true" />
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Sparkles className="text-primary h-4 w-4" />
        <span>AI-Powered</span>
      </div>
      <div className="h-4 w-px bg-white/10" aria-hidden="true" />
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Clock className="h-4 w-4 text-indigo-400" />
        <span>Save 15+ Hours</span>
      </div>
    </div>
  );
}
