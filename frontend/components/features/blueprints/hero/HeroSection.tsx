'use client';

import React from 'react';
import { Sparkles, FileText } from 'lucide-react';
import StaticBackground from './StaticBackground';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  executiveSummary?: string;
  showCTA?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Learning Blueprint',
  subtitle = 'Interactive Learning Blueprint',
  executiveSummary,
  showCTA = true,
}) => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Static Background */}
      <StaticBackground />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Main Hero Content */}
        <div className="mb-16 w-full text-left">
          {/* Static Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white/80">
              Powered by Advanced AI Technology
            </span>
          </div>

          {/* Main Title */}
          <h1 className="mb-6 text-5xl leading-tight font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-xl leading-relaxed text-white/80 sm:text-2xl md:text-3xl">
            {subtitle}
          </p>

          {/* Brand Statement */}
          <div className="mb-12 space-y-4">
            <div className="space-y-4 text-lg leading-relaxed text-white/70">
              <p>
                This comprehensive blueprint is powered by{' '}
                <span className="inline-block font-semibold text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all hover:scale-105 hover:text-yellow-300">
                  Solara
                </span>
                , our advanced AI platform that transforms learning objectives into actionable
                blueprints.
              </p>
              <p>
                Built by{' '}
                <span className="inline-block font-semibold text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:scale-105 hover:text-cyan-300">
                  Smartslate
                </span>
                , it integrates cutting-edge technology with proven educational methodologies to
                create personalized learning journeys that maximize knowledge retention and
                practical application.
              </p>
            </div>
          </div>

          {/* Executive Summary */}
          {executiveSummary && (
            <div className="mb-3">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-transparent p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2">
                    <FileText className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Executive Summary</h3>
                </div>
                <div className="prose prose-invert prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-ul:text-white/80 prose-li:text-white/80 max-w-none space-y-4 text-base leading-relaxed text-white/80 sm:text-lg">
                  {executiveSummary.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
