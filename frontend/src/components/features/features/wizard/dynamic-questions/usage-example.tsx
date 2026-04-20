/**
 * Usage Example: DynamicQuestionsLoader in a Wizard Flow
 *
 * This example demonstrates how to integrate the loading screen
 * into the actual dynamic questionnaire generation flow.
 */

'use client';

import { useState, useEffect } from 'react';
import { DynamicQuestionsLoader } from './DynamicQuestionsLoader';
import type { Question } from '@/lib/dynamic-form/types';

interface DynamicQuestionsStepProps {
  /** Existing static answers to inform question generation */
  staticAnswers: Record<string, unknown>;
  /** Callback when questions are generated */
  onQuestionsGenerated?: (questions: Question[]) => void;
  /** Callback when user completes this step */
  onComplete?: (answers: Record<string, unknown>) => void;
}

/**
 * Example implementation showing how to use the loader
 * in a real dynamic questions step within a wizard.
 */
export function DynamicQuestionsStepExample({
  staticAnswers,
  onQuestionsGenerated,
  onComplete,
}: DynamicQuestionsStepProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [generationPhase, setGenerationPhase] = useState('Initializing AI analysis...');
  const [statusText, setStatusText] = useState('Preparing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  // Generate dynamic questions on mount
  useEffect(() => {
    async function generateQuestions() {
      try {
        // Phase 1: Analyzing
        setGenerationPhase('Analyzing your responses...');
        setStatusText('Analyzing');
        await simulateDelay(1500);

        // Phase 2: Processing
        setGenerationPhase('Identifying knowledge gaps...');
        setStatusText('Processing');
        await simulateDelay(1500);

        // Phase 3: Generating
        setGenerationPhase('Generating targeted questions...');
        setStatusText('Generating');

        // Call your actual API endpoint here
        const response = await fetch('/api/generate-dynamic-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staticAnswers }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate questions');
        }

        const data = await response.json();
        const generatedQuestions = data.questions || [];

        // Phase 4: Finalizing
        setGenerationPhase('Finalizing your questionnaire...');
        setStatusText('Finalizing');
        await simulateDelay(800);

        setQuestions(generatedQuestions);
        onQuestionsGenerated?.(generatedQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      } finally {
        setLoading(false);
      }
    }

    void generateQuestions();
  }, [staticAnswers, onQuestionsGenerated]);

  // Show loading screen while generating
  if (loading) {
    return (
      <div className="space-y-6">
        <DynamicQuestionsLoader message={generationPhase} statusText={statusText} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="text-error mb-4 text-4xl">⚠️</div>
        <h3 className="text-foreground mb-2 text-xl font-semibold">Generation Failed</h3>
        <p className="text-text-secondary mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show generated questions
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-foreground mb-2 text-2xl font-bold">Personalized Questions</h2>
        <p className="text-text-secondary">
          Based on your responses, we've prepared {questions.length} targeted questions to better
          understand your learning needs.
        </p>
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="glass-card p-6">
          <div className="flex items-start gap-3">
            <span className="bg-primary/20 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {index + 1}
            </span>
            <div className="flex-1">
              <label className="text-foreground mb-2 block font-medium">
                {question.label}
                {question.required && <span className="text-error ml-1">*</span>}
              </label>
              {question.description && (
                <p className="text-text-secondary mb-3 text-sm">{question.description}</p>
              )}
              {/* Render appropriate input based on question.type */}
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                className="bg-background text-foreground placeholder:text-text-disabled focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 transition-all focus:ring-2"
                placeholder={question.placeholder}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 border-t border-neutral-300 pt-6">
        <button
          onClick={() => onComplete?.(answers)}
          className="bg-secondary text-secondary-foreground rounded-lg px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          Continue to Next Step
        </button>
      </div>
    </div>
  );
}

/**
 * Utility function to simulate async delays for demo purposes
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Example: Using the Card variant in a full-page context
 */
export function DynamicQuestionsPageExample(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState({
    message: 'Initializing AI analysis...',
    status: 'Preparing',
  });

  useEffect(() => {
    const phases = [
      { message: 'Analyzing your responses...', status: 'Analyzing' },
      { message: 'Identifying knowledge gaps...', status: 'Processing' },
      { message: 'Generating targeted questions...', status: 'Generating' },
      { message: 'Finalizing your questionnaire...', status: 'Finalizing' },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < phases.length) {
        setPhase(phases[currentIndex]);
        currentIndex++;
      } else {
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="glass-card overflow-hidden">
            <div
              className="border-b border-white/10 p-6 md:p-8"
              style={{
                background:
                  'linear-gradient(90deg, rgba(167, 218, 219, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
              }}
            >
              <h2 className="text-foreground font-heading mb-2 text-2xl font-bold md:text-3xl">
                Preparing Your Questions
              </h2>
              <p className="text-text-secondary text-sm md:text-base">
                Setting up the AI analysis pipeline and preparing your personalized questions.
              </p>
            </div>
            <div className="p-6 md:p-8">
              <DynamicQuestionsLoader message={phase.message} statusText={phase.status} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-4">
      {/* Your questions form here */}
      <div className="mx-auto max-w-2xl">
        <h1 className="text-foreground mb-6 text-3xl font-bold">Your Personalized Questions</h1>
        {/* Questions would be rendered here */}
      </div>
    </div>
  );
}
