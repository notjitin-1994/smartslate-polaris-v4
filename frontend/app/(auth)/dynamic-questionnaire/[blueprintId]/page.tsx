'use client';

export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection';
import { DesktopOnlyModal } from '@/components/modals/DesktopOnlyModal';
import { DynamicFormRenderer } from '@/components/dynamic-form/DynamicFormRenderer';
import { FormSchema } from '@/lib/dynamic-form';
import { useToast } from '@/components/ui/use-toast';
import '@/styles/dynamic-questionnaire.css';

interface BlueprintData {
  id: string;
  dynamic_questions: unknown;
  dynamic_answers: unknown;
  status: string;
}

function DynamicQuestionnaireContent({
  params,
}: {
  params: Promise<{ blueprintId: string }>;
}): React.JSX.Element {
  const { user } = useAuth();
  const router = useRouter();
  const { isNonDesktop, isMounted } = useDeviceDetection();
  const { toast } = useToast();
  const [showDesktopOnlyModal, setShowDesktopOnlyModal] = useState(false);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setBlueprintId(p.blueprintId));
  }, [params]);

  // Show desktop-only modal if user is on mobile/tablet
  useEffect(() => {
    if (isNonDesktop && isMounted) {
      setShowDesktopOnlyModal(true);
    }
  }, [isNonDesktop, isMounted]);

  // Fetch blueprint data
  useEffect(() => {
    if (!blueprintId || !user) return;

    const fetchBlueprint = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dynamic-questions/${blueprintId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Blueprint not found');
            setTimeout(() => router.push('/dashboard'), 2000);
            return;
          }
          throw new Error('Failed to fetch blueprint');
        }

        const data = await response.json();

        // Check if dynamic questions exist
        if (!data.sections || data.sections.length === 0) {
          setError('No dynamic questions found. Generating questions now...');
          setTimeout(() => router.push(`/loading/${blueprintId}`), 2000);
          return;
        }

        // Transform API response to blueprint format
        setBlueprint({
          id: blueprintId,
          dynamic_questions: data.sections,
          dynamic_answers: data.existingAnswers || {},
          status: data.status || 'draft',
        });
      } catch (err) {
        console.error('[DynamicQuestionnaire] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questionnaire');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlueprint();
  }, [blueprintId, user, router]);

  // Handle form submission
  const handleSubmit = async (answers: Record<string, unknown>) => {
    if (!blueprintId) return;

    try {
      const response = await fetch('/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers,
        }),
      });

      // Parse response data
      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with detailed messages
        if (data.validationErrors || data.missingRequired) {
          const errorCount = data.errorSummary?.totalErrors || 0;
          const missingCount = data.errorSummary?.requiredFieldsMissing || 0;

          let errorMessage = data.message || 'Please complete all required fields';

          if (missingCount > 0) {
            errorMessage = `Please complete ${missingCount} required field${missingCount > 1 ? 's' : ''} before submitting.`;
          } else if (errorCount > 0) {
            errorMessage = `Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting.`;
          }

          toast({
            title: 'Incomplete Questionnaire',
            description: errorMessage,
            variant: 'destructive',
          });

          // Log detailed errors for debugging
          console.error('[DynamicQuestionnaire] Validation errors:', {
            errors: data.validationErrors,
            missing: data.missingRequired,
            details: data.errorDetails,
          });

          return; // Keep user on questionnaire page
        }

        throw new Error(data.error || 'Failed to save questionnaire');
      }

      // Only navigate if validation succeeded
      if (data.success) {
        toast({
          title: 'Questionnaire Complete',
          description: 'Your answers have been saved successfully.',
          variant: 'default',
        });

        // Navigate to generation page
        router.push(`/generating/${blueprintId}`);
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('[DynamicQuestionnaire] Submit error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save questionnaire',
        variant: 'destructive',
      });
    }
  };

  // Handle auto-save
  const handleSave = async (partialAnswers: Record<string, unknown>) => {
    if (!blueprintId) return;

    try {
      await fetch('/api/dynamic-questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: partialAnswers,
          completed: false,
        }),
      });
    } catch (err) {
      console.error('[DynamicQuestionnaire] Auto-save error:', err);
      // Silent fail for auto-save
    }
  };

  // Show loading state
  if (isLoading || !blueprint) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card flex items-center gap-4 px-8 py-6">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{
              borderColor: 'rgba(167, 218, 219, 0.3)',
              borderTopColor: '#a7dadb',
            }}
          />
          <p className="text-lg text-white/90">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card max-w-md space-y-4 p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Error</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  // Transform blueprint data to FormSchema format (exactly like dynamic-wizard)
  const formSchema: FormSchema = {
    id: `dynamic-${blueprint.id}`,
    title: 'Dynamic Questionnaire',
    description: 'Please answer the following questions based on your learning needs',
    sections: Array.isArray(blueprint.dynamic_questions)
      ? (blueprint.dynamic_questions as Array<Record<string, unknown>>).map((section) => ({
          id: String(section.id ?? ''),
          title: String(section.title ?? ''),
          description: section.description ? String(section.description) : undefined,
          questions: Array.isArray(section.questions) ? section.questions : [],
          order: typeof section.order === 'number' ? section.order : undefined,
          isCollapsible: typeof section.isCollapsible === 'boolean' ? section.isCollapsible : true,
          isRequired: typeof section.isRequired === 'boolean' ? section.isRequired : true,
          metadata: section.metadata as Record<string, unknown> | undefined,
        }))
      : [],
    settings: {
      allowSaveProgress: true,
      autoSaveInterval: 2000,
      showProgress: true,
      allowSectionJump: true,
      submitButtonText: 'Complete Questionnaire',
      saveButtonText: 'Save Progress',
      theme: 'auto',
    },
  };

  return (
    <>
      <DesktopOnlyModal
        open={showDesktopOnlyModal}
        onOpenChange={setShowDesktopOnlyModal}
        featureName="Dynamic Questionnaire"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Dynamic Questionnaire</h1>
                <p className="mt-1 text-sm text-white/60">
                  Answer questions to generate your personalized learning blueprint
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DynamicFormRenderer
              formSchema={formSchema}
              initialData={(blueprint.dynamic_answers as Record<string, unknown>) || {}}
              onSubmit={handleSubmit}
              onSave={handleSave}
              autoSave={true}
              showProgress={true}
            />
          </motion.div>
        </main>
      </div>
    </>
  );
}

export default function DynamicQuestionnairePage({
  params,
}: {
  params: Promise<{ blueprintId: string }>;
}): React.JSX.Element {
  return (
    <ProtectedRoute>
      <DynamicQuestionnaireContent params={params} />
    </ProtectedRoute>
  );
}
