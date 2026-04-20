/**
 * Dynamic Questions Loading Page
export const dynamic = 'force-dynamic';
 * Displays loading state while Perplexity/Ollama generates dynamic questions
 */

'use client';

import { useEffect, useState, use } from 'react';
import type React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, CheckCircle, AlertCircle, Sparkles, Orbit } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('ui');

interface LoadingPageProps {
  params: Promise<{ id: string }>;
}

function LoadingContent({ id }: { id: string }): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing your questions...');
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [_generationSource, setGenerationSource] = useState<'perplexity' | 'ollama' | null>(null);
  const [_fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    let completed = false;

    // Validate blueprint id is a UUID before proceeding
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      setError('Invalid or missing blueprint ID');
      setStatus('Failed to generate dynamic questions');
      setProgress(100);
      return;
    }

    // Real trajectory computation steps that match backend processing
    const trajectorySteps = [
      { step: 1, message: 'Analyzing your mission parameters', progress: 10 },
      { step: 2, message: 'Cross-referencing stellar archives', progress: 30 },
      { step: 3, message: 'Calibrating personalized vectors', progress: 50 },
      { step: 4, message: 'Assembling your navigation chart', progress: 90 },
    ];

    // Progress through real steps based on time elapsed
    const startProgress = () => {
      let stepIndex = 0;

      progressInterval = setInterval(() => {
        if (completed) return;

        const currentStepInfo = trajectorySteps[stepIndex];
        if (currentStepInfo) {
          setCurrentStep(currentStepInfo.step);
          setStatus(currentStepInfo.message);
          setProgress(currentStepInfo.progress);

          // Move to next step after appropriate time
          if (stepIndex < trajectorySteps.length - 1) {
            stepIndex++;
          }
        }
      }, 4000); // Progress through each step every 4 seconds
    };

    const stopIntervals = () => {
      if (progressInterval) clearInterval(progressInterval);
    };

    const generateDynamicQuestions = async () => {
      const startTime = Date.now();

      try {
        // ========================================================================
        // DECISION TREE: Check if dynamic questionnaire exists and is complete
        // ========================================================================
        // Path 1: Questionnaire EXISTS and is COMPLETE → Load existing (fast)
        // Path 2: Questionnaire EXISTS but is INCOMPLETE → Regenerate
        // Path 3: Questionnaire DOES NOT EXIST → Generate new
        // ========================================================================

        logger.info('dynamic_questions.check.start', 'Checking for existing dynamic questions', {
          blueprintId: id,
        });

        const checkResponse = await fetch(`/api/dynamic-questions/${id}`);

        if (checkResponse.ok) {
          const existingData = await checkResponse.json();

          // Validate questionnaire completeness
          const isQuestionnaireComplete = (data: any): boolean => {
            // Must have sections
            if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
              return false;
            }

            // Each section must have questions
            for (const section of data.sections) {
              if (
                !section.questions ||
                !Array.isArray(section.questions) ||
                section.questions.length === 0
              ) {
                return false;
              }

              // Each question must have required fields
              for (const question of section.questions) {
                if (!question.id || !question.label || !question.type) {
                  return false;
                }
              }
            }

            // Must have exactly 10 sections (V2.0 requirement)
            if (data.sections.length !== 10) {
              logger.warn(
                'dynamic_questions.incomplete',
                'Expected exactly 10 sections, considering incomplete',
                {
                  blueprintId: id,
                  sectionCount: data.sections.length,
                  expected: 10,
                }
              );
              return false;
            }

            return true;
          };

          // ========================================================================
          // PATH 1: Questionnaire EXISTS and is COMPLETE → Load existing
          // ========================================================================
          if (isQuestionnaireComplete(existingData)) {
            const totalQuestions = existingData.sections.reduce(
              (sum: number, section: any) => sum + (section.questions?.length || 0),
              0
            );

            logger.info(
              'dynamic_questions.exists_and_complete',
              '✓ Path 1: Complete questionnaire found, loading existing',
              {
                blueprintId: id,
                sectionCount: existingData.sections.length,
                totalQuestions,
                hasExistingAnswers:
                  !!existingData.existingAnswers &&
                  Object.keys(existingData.existingAnswers).length > 0,
              }
            );

            completed = true;
            stopIntervals();
            setProgress(100);
            setStatus('Loading existing questionnaire...');

            // Redirect immediately to the questionnaire
            setTimeout(() => {
              router.push(`/dynamic-wizard/${id}`);
            }, 500);
            return; // Exit early, skip generation
          } else {
            // ========================================================================
            // PATH 2: Questionnaire EXISTS but is INCOMPLETE → Regenerate
            // ========================================================================
            logger.warn(
              'dynamic_questions.incomplete',
              '⚠ Path 2: Incomplete questionnaire detected, regenerating',
              {
                blueprintId: id,
                hasSections: !!existingData.sections,
                sectionCount: existingData.sections?.length || 0,
              }
            );
            // Will fall through to generation logic below
          }
        }

        // ========================================================================
        // PATH 3: Questionnaire DOES NOT EXIST → Generate new
        // PATH 2 (continued): Or questionnaire was incomplete → Regenerate
        // ========================================================================
        logger.info('dynamic_questions.generation.start', '→ Generating dynamic questions', {
          blueprintId: id,
          reason: checkResponse.ok ? 'incomplete_existing' : 'no_existing',
        });

        startProgress();

        // Call the NEW Perplexity-powered API
        const response = await fetch('/api/dynamic-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blueprintId: id,
            // Static answers will be fetched from DB by the API
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          logger.error('dynamic_questions.generation.error', 'Question generation failed', {
            blueprintId: id,
            statusCode: response.status,
            error: errorData.error,
            duration: Date.now() - startTime,
          });

          throw new Error(errorData.error || 'Failed to generate dynamic questions');
        }

        // Parse response
        const result = await response.json();

        // Capture generation metadata
        if (result.metadata) {
          setGenerationSource(result.metadata.source);
          setFallbackUsed(result.metadata.fallbackUsed || false);

          logger.info('dynamic_questions.generation.complete', 'Questions generated successfully', {
            blueprintId: id,
            source: result.metadata.source,
            fallbackUsed: result.metadata.fallbackUsed,
            sectionCount: result.sections?.length,
            duration: Date.now() - startTime,
          });
        }

        completed = true;
        stopIntervals();
        setProgress(100);
        setStatus('Questions generated successfully!');

        // Redirect to dynamic questionnaire
        setTimeout(() => {
          router.push(`/dynamic-wizard/${id}`);
        }, 1500);
      } catch (err) {
        console.error('Error generating dynamic questions:', err);

        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

        logger.error('dynamic_questions.generation.error', 'Question generation failed in UI', {
          blueprintId: id,
          error: errorMessage,
          duration: Date.now() - startTime,
        });

        setError(errorMessage);
        setStatus('Failed to generate dynamic questions');
        setProgress(100);
        completed = true;
      } finally {
        stopIntervals();
      }
    };

    void generateDynamicQuestions();

    return () => {
      stopIntervals();
    };
  }, [router, id, user?.id, attemptCount]);

  const handleTryAgain = () => {
    setError(null);
    setProgress(0);
    setStatus('Restarting trajectory plotting...');
    setCurrentStep(1);
    setAttemptCount((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020C1B] via-[#0A1B2A] to-[#020C1B]">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Primary gradient overlay */}
        <div className="bg-primary/[0.02] absolute inset-0" />

        {/* Floating orbital elements */}
        <motion.div
          className="border-primary/10 absolute top-1/4 left-1/4 h-32 w-32 rounded-full border"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-primary/60 absolute top-0 left-1/2 h-2 w-2 -translate-x-1 -translate-y-1 rounded-full" />
        </motion.div>

        <motion.div
          className="border-secondary/10 absolute right-1/4 bottom-1/3 h-24 w-24 rounded-full border"
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-secondary/60 absolute top-1/2 left-0 h-1 w-1 -translate-x-0.5 -translate-y-0.5 rounded-full" />
        </motion.div>

        {/* Sparkle effects */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-primary/40 absolute h-1 w-1 rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Header */}

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Main Loading Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card animate-scale-in space-y-8 rounded-3xl p-8 md:p-10"
            >
              {/* Icon Section */}
              <div className="relative mb-8 flex justify-center">
                <div className="relative">
                  {error ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-error/10 ring-error/20 flex h-24 w-24 items-center justify-center rounded-full ring-2"
                    >
                      <AlertCircle className="text-error h-12 w-12" />
                    </motion.div>
                  ) : progress === 100 && !error ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                      className="bg-success/10 ring-success/20 flex h-24 w-24 items-center justify-center rounded-full ring-2"
                    >
                      <CheckCircle className="text-success h-12 w-12" />
                    </motion.div>
                  ) : (
                    <div className="relative">
                      <motion.div
                        className="bg-primary/10 ring-primary/20 flex h-24 w-24 items-center justify-center rounded-full ring-2"
                        animate={{
                          boxShadow: [
                            '0 0 0 0 rgba(59, 130, 246, 0.2)',
                            '0 0 0 8px rgba(59, 130, 246, 0)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Telescope className="text-primary h-12 w-12" />
                      </motion.div>

                      {/* Pulsing rings */}
                      <motion.div
                        className="border-primary/30 absolute inset-0 rounded-full border-2"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={error ? 'error' : progress === 100 ? 'complete' : 'loading'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-display text-foreground mb-2"
                  >
                    {error
                      ? 'Trajectory Calculation Failed'
                      : progress === 100
                        ? 'Trajectory Plotted Successfully'
                        : 'Plotting Trajectory'}
                  </motion.h1>
                </AnimatePresence>

                <motion.p
                  className="text-body text-text-secondary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {error || status}
                </motion.p>
              </div>

              {/* Progress Section */}
              {!error && (
                <div className="space-y-6">
                  <div className="mx-auto max-w-sm">
                    <div className="text-text-secondary mb-3 flex justify-between text-sm font-medium">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-surface/50 h-3 overflow-hidden rounded-full backdrop-blur-sm">
                      <motion.div
                        className="h-full rounded-full bg-[var(--primary-accent)]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4].map((step) => (
                      <motion.div
                        key={step}
                        className={`relative h-3 w-3 rounded-full ${
                          step < currentStep
                            ? 'bg-[var(--primary-accent-dark)]'
                            : step === currentStep
                              ? 'bg-[var(--primary-accent)] shadow-lg'
                              : 'bg-surface/60'
                        }`}
                        animate={
                          step === currentStep
                            ? {
                                scale: [1, 1.4, 1],
                                boxShadow: [
                                  '0 0 0 0 rgba(167, 218, 219, 0.4)',
                                  '0 0 0 8px rgba(167, 218, 219, 0)',
                                ],
                              }
                            : {}
                        }
                        transition={{
                          duration: 1.5,
                          repeat: step === currentStep ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      >
                        {step < currentStep && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 rounded-full bg-[var(--primary-accent-dark)]"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Powered by Solara Badge */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="glass-strong rounded-full px-6 py-3 text-sm backdrop-blur-md">
                  <span className="text-text-secondary">Powered by </span>
                  <span className="font-semibold text-yellow-400 brightness-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    Solara
                  </span>
                  <Sparkles className="ml-1 inline h-3 w-3 text-yellow-400" />
                </div>
              </motion.div>

              {/* Error Actions */}
              {error && (
                <motion.div
                  className="flex justify-center gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={() => router.push('/')}
                    className="bg-surface text-foreground hover:bg-surface/80 focus-visible:ring-surface/50 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus-visible:ring-2"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus-visible:ring-2"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Trajectory Computation Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-2xl p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-2">
                <Orbit className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold">Trajectory Computation</h3>
              </div>

              <div className="space-y-3">
                {[
                  'Analyzing your mission parameters',
                  'Cross-referencing stellar archives',
                  'Calibrating personalized vectors',
                  'Assembling your navigation chart',
                ].map((stepText, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  const isFuture = stepNumber > currentStep;

                  return (
                    <motion.div
                      key={stepNumber}
                      className={`flex items-start gap-3 rounded-lg p-2 transition-colors ${
                        isCurrent ? 'bg-primary/5' : ''
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                          >
                            <CheckCircle className="text-success h-4 w-4" />
                          </motion.div>
                        ) : isCurrent ? (
                          <motion.div
                            className="border-primary h-4 w-4 rounded-full border-2 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <div className="border-surface h-4 w-4 rounded-full border-2" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isFuture ? 'text-text-disabled' : 'text-text-secondary'
                        }`}
                      >
                        {stepText}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoadingPage({ params }: LoadingPageProps): React.JSX.Element {
  const unwrappedParams = use(params);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <LoadingContent id={unwrappedParams.id} />
      </ProtectedRoute>
    </AuthProvider>
  );
}
