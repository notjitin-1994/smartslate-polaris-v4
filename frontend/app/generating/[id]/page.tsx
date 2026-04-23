/**
 * Blueprint Generation Loading Page
export const dynamic = 'force-dynamic';
 * Displays loading state while Gemini generates the learning blueprint
 */

'use client';

import { useEffect, useState, use } from 'react';
import type React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, CheckCircle, AlertCircle, Sparkles, Orbit, Rocket } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('ui');

interface GeneratingPageProps {
  params: Promise<{ id: string }>;
}

function GeneratingContent({ id }: { id: string }): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing learning design creation...');
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [_model, setModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.1-pro-preview' | 'ollama' | null>(null);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    let completed = false;

    // Real blueprint generation steps that match backend processing
    const blueprintSteps = [
      { step: 1, message: 'Analyzing questionnaire responses', progress: 10 },
      { step: 2, message: 'Creating learning objectives', progress: 30 },
      { step: 3, message: 'Mapping your learning universe', progress: 50 },
      { step: 4, message: 'Creating content outline', progress: 70 },
      { step: 5, message: 'Planning resources and timeline', progress: 90 },
      { step: 6, message: 'Finalizing assessment strategy', progress: 95 },
    ];

    // Progress through real steps based on time elapsed
    const startProgress = () => {
      let stepIndex = 0;

      progressInterval = setInterval(() => {
        if (completed) return;

        const currentStepInfo = blueprintSteps[stepIndex];
        if (currentStepInfo) {
          setCurrentStep(currentStepInfo.step);
          setStatus(currentStepInfo.message);
          setProgress(currentStepInfo.progress);

          // Move to next step after appropriate time
          if (stepIndex < blueprintSteps.length - 1) {
            stepIndex++;
          }
        }
      }, 5000); // Progress through each step every 5 seconds
    };

    const stopIntervals = () => {
      if (progressInterval) clearInterval(progressInterval);
    };

    const generateBlueprint = async () => {
      const startTime = Date.now();

      try {
        startProgress();

        logger.info('blueprint.generation.ui.start', 'Starting blueprint generation from UI', {
          blueprintId: id,
          userId: user?.id,
        });

        // Validate inputs before API call
        if (!id) {
          throw new Error('Blueprint ID is missing');
        }

        if (!user?.id) {
          throw new Error('User authentication is required');
        }

        logger.info('blueprint.generation.ui.preparing_request', 'Preparing API request', {
          blueprintId: id,
          userId: user.id,
        });

        // Call blueprint generation endpoint
        let response;
        try {
          logger.info('blueprint.generation.ui.making_request', 'Making API request', {
            blueprintId: id,
            endpoint: '/api/starmaps/generate',
            method: 'POST',
          });

          response = await fetch('/api/starmaps/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              blueprintId: id,
            }),
          });

          logger.info('blueprint.generation.ui.response_received', 'API response received', {
            blueprintId: id,
            status: response.status,
            statusText: response.statusText,
          });
        } catch (fetchError) {
          // Network error, server unreachable, or other fetch-related issues
          const errorMessage = `Network error: Unable to connect to generation server. Please check your internet connection and try again.`;
          const errorDetails = {
            blueprintId: id,
            errorType: 'network_error',
            errorMessage: (fetchError as Error).message,
            duration: Date.now() - startTime,
          };

          logger.error(
            'blueprint.generation.ui.network_error',
            'Network error during blueprint generation',
            errorDetails
          );

          throw new Error(errorMessage);
        }

        if (!response.ok) {
          let errorMessage = 'Failed to generate blueprint';
          let errorDetails = {};

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;

            // Add more context based on status code
            switch (response.status) {
              case 400:
                errorMessage = `Invalid request: ${errorMessage}`;
                break;
              case 401:
                errorMessage = `Authentication required: ${errorMessage}`;
                break;
              case 404:
                errorMessage = `Blueprint not found: ${errorMessage}`;
                break;
              case 429:
                errorMessage = `Usage limit exceeded: ${errorMessage}`;
                break;
              case 500:
                errorMessage = `Server error: ${errorMessage}`;
                break;
              default:
                errorMessage = `HTTP ${response.status}: ${errorMessage}`;
            }

            errorDetails = {
              statusCode: response.status,
              errorData,
            };
          } catch (parseError) {
            errorMessage = `HTTP ${response.status}: Unable to parse error response`;
            errorDetails = {
              statusCode: response.status,
              parseError: (parseError as Error).message,
            };
          }

          logger.error('blueprint.generation.ui.error', 'Blueprint generation failed', {
            blueprintId: id,
            duration: Date.now() - startTime,
            ...errorDetails,
          });

          throw new Error(errorMessage);
        }

        const result = await response.json();

        logger.info('blueprint.generation.ui.response_parsed', 'Response parsed successfully', {
          blueprintId: id,
          hasBlueprint: !!result.blueprint,
          hasMetadata: !!result.metadata,
          metadataModel: result.metadata?.model,
        });

        completed = true;
        stopIntervals();

        setProgress(100);
        setStatus('Blueprint generated successfully!');
        setModel(result.metadata?.model);

        logger.info('blueprint.generation.ui.complete', 'Blueprint generated successfully', {
          blueprintId: id,
          model: result.metadata?.model,
          duration: Date.now() - startTime,
          fallbackUsed: result.metadata?.fallbackUsed,
        });

        // Redirect to blueprint viewer
        setTimeout(() => {
          router.push(`/starmaps/${id}`);
        }, 1500);
      } catch (error) {
        completed = true;
        stopIntervals();

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorDetails = {
          blueprintId: id,
          duration: Date.now() - startTime,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        };

        setError(errorMessage);
        setStatus('Generation failed');
        setProgress(100);

        logger.error(
          'blueprint.generation.ui.fatal_error',
          'Fatal error during generation',
          errorDetails
        );

        // Also log to console in development for immediate debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('Blueprint generation failed:', errorDetails);
        }
      }
    };

    generateBlueprint();

    return () => {
      stopIntervals();
    };
  }, [id, router, user?.id]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020C1B] via-[#0A1B2A] to-[#020C1B]">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Primary gradient overlay */}
        <div className="bg-primary/[0.02] absolute inset-0" />

        {/* Floating orbital elements */}
        <motion.div
          className="border-secondary/10 absolute top-1/3 right-1/4 h-28 w-28 rounded-full border"
          animate={{
            rotate: -360,
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-secondary/60 absolute top-0 right-1/2 h-2 w-2 -translate-x-1 -translate-y-1 rounded-full" />
        </motion.div>

        <motion.div
          className="border-primary/10 absolute bottom-1/4 left-1/3 h-20 w-20 rounded-full border"
          animate={{
            rotate: 360,
            scale: [1, 1.3, 1],
          }}
          transition={{
            rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="bg-primary/60 absolute bottom-0 left-1/2 h-1 w-1 -translate-x-0.5 translate-y-0.5 rounded-full" />
        </motion.div>

        {/* Sparkle effects */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-secondary/40 absolute h-1 w-1 rounded-full"
            style={{
              top: `${15 + i * 12}%`,
              right: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.25,
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
                        <Compass className="text-primary h-12 w-12" />
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
                      ? 'Starmap Generation Failed'
                      : progress === 100
                        ? 'Starmap Constructed Successfully'
                        : 'Plotting Stellar Coordinates'}
                  </motion.h1>
                </AnimatePresence>

                <motion.p
                  className="text-body text-text-secondary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {error || status}
                </motion.p>
                
                {progress === 100 && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6"
                  >
                    <button
                      onClick={() => router.push(`/starmaps/${id}`)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 flex items-center gap-2 mx-auto rounded-xl px-8 py-4 text-base font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:ring-2"
                    >
                      <Rocket className="h-5 w-5" />
                      View Your Starmap
                    </button>
                    <p className="mt-4 text-xs text-text-disabled animate-pulse">
                      Redirecting you automatically in a few seconds...
                    </p>
                  </motion.div>
                )}
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
                    {[1, 2, 3, 4, 5, 6].map((step) => (
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
                    onClick={() => {
                      // Reset error state and reload the page to re-trigger generation
                      setError(null);
                      setProgress(0);
                      setCurrentStep(1);
                      setStatus('Initializing learning design creation...');
                      window.location.reload();
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus-visible:ring-2"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Mission Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-2xl p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-2">
                <Orbit className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold">Mission Status</h3>
              </div>

              <div className="space-y-3">
                {[
                  'Synthesizing navigation data',
                  'Plotting personalized learning coordinates',
                  'Designing orbital trajectory strategies',
                  'Assembling your complete starmap',
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

export default function GeneratingPage({ params }: GeneratingPageProps): React.JSX.Element {
  const unwrappedParams = use(params);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <GeneratingContent id={unwrappedParams.id} />
      </ProtectedRoute>
    </AuthProvider>
  );
}
