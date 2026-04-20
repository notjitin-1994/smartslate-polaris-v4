'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import {
  DynamicQuestionsLoader,
  DynamicQuestionsLoaderCard,
} from '@/components/wizard/dynamic-questions';
import { QuestionnaireLayout } from '@/components/wizard/static-questions/QuestionnaireLayout';

/**
 * Demo page showcasing the DynamicQuestionsLoader component
 *
 * This page demonstrates:
 * 1. Inline loader variant
 * 2. Card loader variant
 * 3. Full-page loader with layout
 * 4. Dynamic message updates
 */
export default function LoadingScreenDemoPage(): React.JSX.Element {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDemo, setShowDemo] = useState<'inline' | 'card' | 'fullpage'>('inline');

  const phases = [
    { message: 'Initializing AI analysis...', status: 'Starting' },
    { message: 'Analyzing your responses...', status: 'Analyzing' },
    { message: 'Identifying knowledge gaps...', status: 'Processing' },
    { message: 'Generating targeted questions...', status: 'Generating' },
    { message: 'Finalizing your personalized questionnaire...', status: 'Finalizing' },
  ];

  // Cycle through phases automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [phases.length]);

  const currentPhaseData = phases[currentPhase];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Demo Controls */}
      <div className="bg-paper sticky top-0 z-50 border-b border-neutral-300 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-foreground font-heading text-2xl font-bold">
                Loading Screen Demo
              </h1>
              <p className="text-text-secondary mt-1 text-sm">
                Exact replica from smartslate-polaris adapted to frontend design system
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDemo('inline')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  showDemo === 'inline'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-surface text-foreground hover:bg-neutral-200'
                }`}
              >
                Inline
              </button>
              <button
                onClick={() => setShowDemo('card')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  showDemo === 'card'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-surface text-foreground hover:bg-neutral-200'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setShowDemo('fullpage')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  showDemo === 'fullpage'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-surface text-foreground hover:bg-neutral-200'
                }`}
              >
                Full Page
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      {showDemo === 'inline' && (
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8">
            <h2 className="text-foreground mb-2 text-xl font-semibold">Inline Loader Variant</h2>
            <p className="text-text-secondary">
              Use this variant within existing containers or sections.
            </p>
          </div>

          <div className="glass-card p-8">
            <DynamicQuestionsLoader
              message={currentPhaseData.message}
              statusText={currentPhaseData.status}
            />
          </div>

          <div className="glass-card mt-8 p-6">
            <h3 className="text-foreground mb-4 text-lg font-semibold">Props</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">message:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;{currentPhaseData.message}&rdquo;
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">statusText:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;{currentPhaseData.status}&rdquo;
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">showStatusIndicator:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">true</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDemo === 'card' && (
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8">
            <h2 className="text-foreground mb-2 text-xl font-semibold">Card Loader Variant</h2>
            <p className="text-text-secondary">
              Full card wrapper with glass effect and header section, matching the WizardContainer
              pattern.
            </p>
          </div>

          <DynamicQuestionsLoaderCard
            title="Preparing Your Blueprint"
            description="Setting up the AI analysis pipeline and preparing your personalized questions."
            message={currentPhaseData.message}
            statusText={currentPhaseData.status}
          />

          <div className="glass-card mt-8 p-6">
            <h3 className="text-foreground mb-4 text-lg font-semibold">Props</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-text-secondary min-w-[120px]">title:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;Preparing Your Blueprint&rdquo;
                </code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-text-secondary min-w-[120px]">description:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;Setting up the AI analysis...&rdquo;
                </code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-text-secondary min-w-[120px]">message:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;{currentPhaseData.message}&rdquo;
                </code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-text-secondary min-w-[120px]">statusText:</span>
                <code className="bg-surface text-primary rounded px-2 py-1 text-xs">
                  &ldquo;{currentPhaseData.status}&rdquo;
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDemo === 'fullpage' && (
        <QuestionnaireLayout currentStep={3} totalSteps={5}>
          <DynamicQuestionsLoaderCard
            title="Preparing Your Starmap"
            description="Setting up the AI analysis pipeline and preparing your personalized questions."
            message={currentPhaseData.message}
            statusText={currentPhaseData.status}
          />

          <div className="glass-card mt-8 p-6">
            <h3 className="text-foreground mb-2 text-lg font-semibold">Full Page Layout</h3>
            <p className="text-text-secondary text-sm">
              Wrapped in QuestionnaireLayout with swirl background for immersive full-page
              experience.
            </p>
          </div>
        </QuestionnaireLayout>
      )}

      {/* Phase Indicator */}
      <div className="bg-paper fixed right-4 bottom-4 max-w-xs rounded-lg border border-neutral-300 p-4 shadow-lg">
        <div className="text-text-secondary mb-2 text-xs">Current Phase:</div>
        <div className="text-foreground mb-1 text-sm font-medium">{currentPhaseData.status}</div>
        <div className="text-text-secondary text-xs">
          Phase {currentPhase + 1} of {phases.length}
        </div>
        <div className="mt-3 flex gap-1">
          {phases.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index === currentPhase
                  ? 'bg-primary'
                  : index < currentPhase
                    ? 'bg-primary/50'
                    : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
