/* eslint-disable no-restricted-syntax */
'use client';

import type React from 'react';
import { Shield, Sparkles, Clock } from 'lucide-react';
import { UnifiedAuthContainer } from '@/components/auth/UnifiedAuthContainer';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { SignupFormContent } from '@/components/auth/SignupFormContent';

export default function SignupPageClient(): React.JSX.Element {
  // Mobile marketing teaser - Optimized for height (same as login for consistency)
  const mobileMarketing = (
    <section className="animate-fade-in-up mb-6 lg:hidden" aria-label="Quick platform overview">
      <div className="glass-card space-y-4 p-5">
        <div>
          <h2 className="font-heading mb-1.5 text-xl leading-tight font-bold text-white sm:text-2xl">
            Transform 6-Week Projects
            <span className="mt-1 block text-primary">
              Into 1-Hour Designs
            </span>
          </h2>
          <p className="text-xs text-white/60">
            AI-assisted Learning Experience Design for professionals
          </p>
        </div>

        {/* Key Metrics Grid - Compact */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
            <div className="text-primary mb-1 flex justify-center opacity-70"><Clock className="h-3.5 w-3.5" /></div>
            <div className="text-sm font-bold text-white">15x</div>
            <div className="text-[9px] font-medium text-white/40 uppercase">Faster</div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
            <div className="text-primary mb-1 flex justify-center opacity-70"><Sparkles className="h-3.5 w-3.5" /></div>
            <div className="text-sm font-bold text-white">98%</div>
            <div className="text-[9px] font-medium text-white/40 uppercase">Saved</div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
            <div className="text-primary mb-1 flex justify-center opacity-70"><Shield className="h-3.5 w-3.5" /></div>
            <div className="text-sm font-bold text-white">$0</div>
            <div className="text-[9px] font-medium text-white/40 uppercase">Free</div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <UnifiedAuthContainer initialView="signup" mobileMarketing={mobileMarketing}>
      {(view, setView) => (
        <AuthFormCard>
          {/* Header - Compact */}
          <div className="mb-5 space-y-1 text-left">
            <h1 className="font-heading text-xl font-bold tracking-tight text-white xl:text-2xl">
              Create Your Account
            </h1>
            <p className="text-[11px] text-white/50 xl:text-xs">
              Join professionals transforming their design workflow
            </p>
          </div>

          {/* Signup Form */}
          <SignupFormContent onBackToLogin={() => window.location.href = '/login'} />

          {/* Footer - Compact */}
          <div className="mt-5">
            <p className="text-left text-[10px] leading-tight text-white/30">
              By continuing, you agree to our{' '}
              <a href="#" className="text-white/40 underline hover:text-primary">Terms</a> and <a href="#" className="text-white/40 underline hover:text-primary">Privacy Policy</a>
            </p>
          </div>
        </AuthFormCard>
      )}
    </UnifiedAuthContainer>
  );
}
