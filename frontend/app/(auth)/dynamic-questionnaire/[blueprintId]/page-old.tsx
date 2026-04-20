'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FormProvider, useForm, useFormContext, useFormState } from 'react-hook-form';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { FormErrorBoundary } from '@/components/error/FormErrorBoundary';
import { useDesignTokens } from '@/lib/design-system/hooks/useDesignTokens';
import { ProgressIndicator as QuestionnaireProgress } from '@/components/questionnaire';

// Import new questionnaire components (prefixed with _ as this is an old/reference file)
import {
  QuestionnaireProvider as _QuestionnaireProvider,
  QuestionnaireLayout as _QuestionnaireLayout,
  QuestionSection as _QuestionSection,
  ProgressIndicator as _ProgressIndicator,
  NavigationControls as _NavigationControls,
  AutoSaveIndicator as _AutoSaveIndicator,
  ValidationFeedback as _ValidationFeedback,
  SaveProgressButton as _SaveProgressButton,
  SuccessNotification as _SuccessNotification,
} from '@/components/questionnaire';
import { QuestionnaireButton } from '@/components/demo-v2-questionnaire/QuestionnaireButton';
import { DynamicQuestionRenderer } from '@/components/demo-dynamicv2/DynamicQuestionRenderer';

// Import accessibility components (prefixed with _ as this is an old/reference file)
import {
  SkipNavigation as _SkipNavigation,
  MainContent as _MainContent,
} from '@/components/questionnaire/accessibility/SkipNavigation';
import { KeyboardHints as _KeyboardHints } from '@/components/questionnaire/accessibility/KeyboardHints';

// Import styles
import '@/styles/design-system.css';
import '@/styles/questionnaire-v2.css';

// Types
interface Question {
  id: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: string;
  }>;
  validation?: Array<{
    rule: string;
    value?: string | number | boolean;
    message: string;
  }>;
}

// Types for questionnaire data
interface DynamicQuestionsData {
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    order: number;
    questions: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      helpText?: string;
      placeholder?: string;
      options?: Array<{
        value: string;
        label: string;
        description?: string;
        icon?: string;
      }>;
      validation?: Array<{
        rule: string;
        value?: string | number | boolean;
        message: string;
      }>;
    }>;
  }>;
  existingAnswers: Record<string, unknown>;
  currentSection?: number;
  metadata?: {
    generatedAt?: string;
    provider?: string;
    model?: string;
    totalQuestions?: number;
    sectionCount?: number;
  };
}

/**
 * Refactored Dynamic Questionnaire Component
 * Uses new component architecture for better maintainability
 */
function DynamicQuestionnaireContent({
  params,
}: {
  params: Promise<{ blueprintId: string }>;
}): React.JSX.Element {
  const { user } = useAuth();
  const router = useRouter();
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState<DynamicQuestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_loadError, _setLoadError] = useState<string | null>(null);
  const [_showSuccess, _setShowSuccess] = useState(false);
  const [_successMessage, _setSuccessMessage] = useState('');
  const [_validationMessages, _setValidationMessages] = useState<
    Array<{
      id: string;
      type: 'error' | 'warning' | 'info' | 'success';
      message: string;
      field?: string;
    }>
  >([]);

  // Form state
  const methods = useForm();
  const { getValues, watch, trigger, handleSubmit } = methods;
  const { errors } = useFormState();
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<string>('');
  const hasUnsavedChangesRef = useRef(false);

  // Apply design tokens
  useDesignTokens();

  // Resolve params
  useEffect(() => {
    params.then((p) => setBlueprintId(p.blueprintId));
  }, [params]);

  // Fetch questionnaire data
  useEffect(() => {
    if (!blueprintId) return;

    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        _setLoadError(null);

        const response = await fetch(`/api/dynamic-questions/${blueprintId}`);

        if (!response.ok) {
          if (response.status === 404) {
            _setLoadError('Blueprint not found. Redirecting...');
            setTimeout(() => router.push('/dashboard'), 2000);
            return;
          }
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();

        // Check if questions exist
        if (!data.sections || data.sections.length === 0) {
          _setLoadError('No questions found. Generating...');
          setTimeout(() => router.push(`/loading/${blueprintId}`), 2000);
          return;
        }

        // Merge with sessionStorage if available
        const sessionKey = `questionnaire-${blueprintId}`;
        const sessionData = sessionStorage.getItem(sessionKey);

        if (sessionData) {
          try {
            const saved = JSON.parse(sessionData);
            data.existingAnswers = { ...data.existingAnswers, ...saved.answers };
            data.currentSection = saved.currentSection || data.currentSection;
          } catch (_e) {
            // Invalid session data, ignore
          }
        }

        setQuestionsData(data);
      } catch (error) {
        _setLoadError('Failed to load questionnaire. Please try again.');
        console.error('Error loading questionnaire:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [blueprintId, router]);

  // Debounced autosave with sessionStorage backup
  const debouncedAutosave = useCallback(async () => {
    if (!blueprintId || !questionsData) return;

    const currentFormData = JSON.stringify(getValues());
    if (currentFormData === lastFormDataRef.current) return;

    lastFormDataRef.current = currentFormData;
    const answers = getValues();

    // Save to sessionStorage immediately as backup
    const sessionKey = `dynamic-answers-${blueprintId}`;
    const sessionSectionKey = `dynamic-section-${blueprintId}`;
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(answers));
      sessionStorage.setItem(sessionSectionKey, currentSection.toString());
    } catch (_error) {
      // Failed to save to sessionStorage
    }

    // Mark as having unsaved changes
    hasUnsavedChangesRef.current = true;

    try {
      setIsAutosaving(true);
      setSaveError(null);

      const response = await fetch('/api/dynamic-answers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers,
          sectionId: questionsData.sections[currentSection]?.id,
          currentSection,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let _errorData;
        try {
          _errorData = JSON.parse(errorText);
        } catch {
          _errorData = { error: errorText };
        }

        // Don't throw, just log - data is safe in sessionStorage
        return;
      }

      const result = await response.json();

      if (result.success) {
        setLastAutosave(new Date());
        hasUnsavedChangesRef.current = false;

        // Clear sessionStorage backup after successful save
        sessionStorage.removeItem(sessionKey);
        sessionStorage.removeItem(sessionSectionKey);
      }
    } catch (_error) {
      // Don't show error to user for auto-save failures
      // Data is safe in sessionStorage
    } finally {
      setIsAutosaving(false);
    }
  }, [blueprintId, getValues, questionsData, currentSection]);

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = watch(() => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        debouncedAutosave();
      }, 500); // 500ms debounce
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [watch, debouncedAutosave]);

  // Auto-save interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      debouncedAutosave();
    }, 30000);

    return () => clearInterval(interval);
  }, [debouncedAutosave]);

  // Warn on unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Section navigation with validation
  const handleNext = async () => {
    if (!questionsData) return;

    const currentSectionData = questionsData.sections[currentSection];
    const sectionQuestionIds = currentSectionData.questions.map((q) => q.id);

    // Trigger validation for all questions in current section
    const isValid = await trigger(sectionQuestionIds);

    if (!isValid) {
      // Find first error field and scroll to it
      const firstErrorField = sectionQuestionIds.find((id) => errors[id]);
      if (firstErrorField) {
        const errorElement = document.getElementById(`question-${firstErrorField}`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Show error message
      setSaveError('Please fix all errors before proceeding to the next section');
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    if (currentSection < questionsData.sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Section jump navigation
  const _handleJumpToSection = (sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < (questionsData?.sections.length || 0)) {
      setCurrentSection(sectionIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Import validation function from DynamicQuestionRenderer logic
  const _validateQuestionValue = (value: unknown, question: Question): string | null => {
    // Required check
    if (question.required) {
      if (value === undefined || value === null || value === '') {
        return 'This field is required';
      }
      if (Array.isArray(value) && value.length === 0) {
        return 'Please select at least one option';
      }
    }

    // Apply custom validation rules
    if (question.validation && value !== undefined && value !== null && value !== '') {
      for (const rule of question.validation) {
        switch (rule.rule) {
          case 'minLength':
            if (
              typeof value === 'string' &&
              typeof rule.value === 'number' &&
              value.length < rule.value
            ) {
              return rule.message;
            }
            break;
          case 'maxLength':
            if (
              typeof value === 'string' &&
              typeof rule.value === 'number' &&
              value.length > rule.value
            ) {
              return rule.message;
            }
            break;
          case 'minSelections':
            if (
              Array.isArray(value) &&
              typeof rule.value === 'number' &&
              value.length < rule.value
            ) {
              return rule.message;
            }
            break;
          case 'maxSelections':
            if (
              Array.isArray(value) &&
              typeof rule.value === 'number' &&
              value.length > rule.value
            ) {
              return rule.message;
            }
            break;
        }
      }
    }

    return null;
  };

  // Final submission with comprehensive validation
  const onSubmit = async (data: Record<string, unknown>) => {
    if (!blueprintId || !questionsData) return;

    setSaveError(null);

    console.log('🔍 Pre-submission validation starting...');
    console.log('📊 Total questions:', questionsData.sections.flatMap((s) => s.questions).length);
    console.log('📝 Submitted answers:', Object.keys(data).length);

    // Pre-validate: Check that all selection answers match valid option values
    const optionMismatches: Array<{ questionId: string; value: unknown; validValues: string[] }> =
      [];

    questionsData.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const answer = data[question.id];

        // For selection types, verify answer matches valid options
        if (question.options && question.options.length > 0) {
          const validValues = question.options.map((opt) => opt.value);

          if (['checkbox_pills', 'checkbox_cards'].includes(question.type)) {
            if (Array.isArray(answer)) {
              const invalidItems = answer.filter((val) => !validValues.includes(String(val)));
              if (invalidItems.length > 0) {
                optionMismatches.push({
                  questionId: question.id,
                  value: answer,
                  validValues,
                });
              }
            }
          } else if (['radio_pills', 'radio_cards', 'toggle_switch'].includes(question.type)) {
            if (answer !== undefined && answer !== null && !validValues.includes(String(answer))) {
              optionMismatches.push({
                questionId: question.id,
                value: answer,
                validValues,
              });
            }
          }
        }
      });
    });

    if (optionMismatches.length > 0) {
      setSaveError(
        `Data error: ${optionMismatches.length} answer${optionMismatches.length > 1 ? 's don&apos;t' : ' doesn&apos;t'} match expected values. This usually means the question options changed. Please refresh the page to reload the latest questions.`
      );
      return;
    }

    // Trigger validation for all fields
    const allQuestionIds = questionsData.sections.flatMap((s) => s.questions.map((q) => q.id));
    const isValid = await trigger(allQuestionIds);

    if (!isValid) {
      // Find sections with errors
      const sectionsWithErrors = new Set<number>();
      let errorCount = 0;

      questionsData.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question) => {
          if (errors[question.id]) {
            sectionsWithErrors.add(sectionIndex);
            errorCount++;
          }
        });
      });

      setSaveError(
        `Cannot submit: ${errorCount} field${errorCount > 1 ? 's have' : ' has'} validation errors across ${sectionsWithErrors.size} section${sectionsWithErrors.size > 1 ? 's' : ''}. Please review and correct them.`
      );

      // Navigate to the first section with errors
      const firstSectionWithError = Math.min(...Array.from(sectionsWithErrors));
      if (firstSectionWithError !== currentSection) {
        setCurrentSection(firstSectionWithError);
        setTimeout(() => {
          // Find first error field in that section
          const sectionQuestions = questionsData.sections[firstSectionWithError].questions;
          const firstErrorField = sectionQuestions.find((q) => errors[q.id]);
          if (firstErrorField) {
            const element = document.getElementById(`question-${firstErrorField.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      } else {
        // Find first error field in current section
        const currentSectionQuestions = questionsData.sections[currentSection].questions;
        const firstErrorField = currentSectionQuestions.find((q) => errors[q.id]);
        if (firstErrorField) {
          const element = document.getElementById(`question-${firstErrorField.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      return; // Block submission
    }

    // All validations passed, proceed with submission
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    const attemptSubmit = async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/dynamic-answers/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprintId,
            answers: data,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }

          throw new Error(
            errorData.message || errorData.error || `Failed to submit answers (${response.status})`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Submission failed');
        }

        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        return false;
      }
    };

    try {
      setIsSubmitting(true);
      setSaveError(null);

      // Retry logic with exponential backoff
      while (attempt < maxRetries) {
        attempt++;

        if (attempt > 1) {
          setSaveError(`Retrying submission (attempt ${attempt} of ${maxRetries})...`);
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        const success = await attemptSubmit();

        if (success) {
          // Clear unsaved changes flag and sessionStorage
          hasUnsavedChangesRef.current = false;
          const sessionKey = `dynamic-answers-${blueprintId}`;
          const sessionSectionKey = `dynamic-section-${blueprintId}`;
          sessionStorage.removeItem(sessionKey);
          sessionStorage.removeItem(sessionSectionKey);
          setRetryCount(0);

          // Redirect to blueprint generation/view
          router.push(`/generating/${blueprintId}`);
          return;
        }
      }

      // All retries failed
      throw lastError || new Error('Submission failed after multiple attempts');
    } catch (error) {
      setRetryCount(attempt);
      setSaveError(
        `${error instanceof Error ? error.message : 'Failed to submit answers'}. ` +
          `Tried ${attempt} times. Your answers are saved locally. Click Submit to try again.`
      );
      setIsSubmitting(false);
    }
  };

  // Validate all sections and submit (ensures feedback even if RHF blocks onSubmit)
  const handleFinalSubmit = async (): Promise<void> => {
    if (!questionsData) return;

    // Validate all fields across all sections
    const allQuestionIds = questionsData.sections.flatMap((s) => s.questions.map((q) => q.id));
    const isValid = await trigger(allQuestionIds);

    if (!isValid) {
      // Mirror the error UX from onSubmit when invalid
      const sectionsWithErrors = new Set<number>();
      let errorCount = 0;

      questionsData.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question) => {
          if (errors[question.id]) {
            sectionsWithErrors.add(sectionIndex);
            errorCount++;
          }
        });
      });

      setSaveError(
        `Cannot submit: ${errorCount} field${errorCount !== 1 ? 's have' : ' has'} validation errors across ${sectionsWithErrors.size} section${sectionsWithErrors.size !== 1 ? 's' : ''}. Please review and correct them.`
      );

      // Navigate to first section with errors and focus first field
      const firstSectionWithError = Math.min(...Array.from(sectionsWithErrors));
      if (Number.isFinite(firstSectionWithError) && firstSectionWithError !== currentSection) {
        setCurrentSection(firstSectionWithError);
        setTimeout(() => {
          const sectionQuestions = questionsData.sections[firstSectionWithError].questions;
          const firstErrorField = sectionQuestions.find((q) => errors[q.id]);
          if (firstErrorField) {
            const element = document.getElementById(`question-${firstErrorField.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
      return;
    }

    // If valid, proceed with the existing submit flow
    methods.handleSubmit(onSubmit)();
  };

  // Loading state
  if (isLoading || !questionsData || !blueprintId) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="space-y-4 text-center">
          <div
            className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"
            aria-hidden="true"
          ></div>
          <p className="text-text-secondary">Loading questionnaire...</p>
          <span className="sr-only">Please wait while we load your questionnaire</span>
        </div>
      </div>
    );
  }

  const currentSectionData = questionsData.sections[currentSection];
  const _isFirstSection = currentSection === 0;
  const isLastSection = currentSection === questionsData.sections.length - 1;

  return (
    <div className="min-h-screen bg-[#020C1B]">
      {/* Header */}
      <StandardHeader
        title="Mission Parameters"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        backButtonStyle="icon-only"
        showDarkModeToggle={false}
        showUserAvatar={false}
        size="compact"
        user={user}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-6xl text-left">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <h1 className="font-heading lg:text-10xl text-7xl font-bold tracking-tight text-white sm:text-8xl md:text-9xl">
                <span>Starmap </span>
                <span className="text-primary">Navigator</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-12"
            >
              <p className="text-xl leading-relaxed text-white/70 sm:text-2xl lg:text-3xl">
                Answer these{' '}
                <span className="text-primary font-medium">personalized questions</span> based on
                your <span className="text-primary font-medium">unique context</span> and{' '}
                <span className="text-primary font-medium">learning objectives</span>.
              </p>
            </motion.div>

            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-primary mt-16 h-px w-24"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FormErrorBoundary>
            <_QuestionnaireProvider
              initialData={{
                sections: questionsData.sections,
                existingAnswers: questionsData.existingAnswers || {},
                currentSection: currentSection,
                blueprintId: blueprintId,
              }}
              onSubmit={onSubmit}
              onSave={async (data) => {
                // Auto-save functionality
                console.log('Saving progress:', data);
              }}
            >
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                {/* Main Questionnaire Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="glass-card space-y-8 p-8 md:p-10"
                >
                  {/* Progress Indicator */}
                  <QuestionnaireProgress />

                  {/* Validation Status and Progress */}
                  {(() => {
                    // Simple validation status calculation
                    const sectionStatus = questionsData.sections.map((section, idx) => {
                      const sectionQuestions = section.questions;
                      const answers = getValues();
                      const completedQuestions = sectionQuestions.filter((q) => {
                        const value = answers[q.id];
                        return q.required
                          ? value !== undefined && value !== null && value !== ''
                          : true;
                      });
                      return {
                        completionPercentage: Math.round(
                          (completedQuestions.length / sectionQuestions.length) * 100
                        ),
                      };
                    });
                    const currentSectionStatus = sectionStatus[currentSection];
                    const overallCompletion = Math.round(
                      questionsData.sections.reduce((acc, section) => {
                        const sectionQuestions = section.questions;
                        const answers = getValues();
                        const completedQuestions = sectionQuestions.filter((q) => {
                          const value = answers[q.id];
                          return q.required
                            ? value !== undefined && value !== null && value !== ''
                            : true;
                        });
                        return acc + (completedQuestions.length / sectionQuestions.length) * 100;
                      }, 0) / questionsData.sections.length
                    );

                    return (
                      <div className="bg-paper/50 space-y-3 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-foreground text-lg font-semibold">
                              {questionsData.sections[currentSection].title}
                            </h3>
                            {questionsData.sections[currentSection].description && (
                              <p className="text-text-secondary text-sm">
                                {questionsData.sections[currentSection].description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-primary text-2xl font-bold">
                              {currentSectionStatus?.completionPercentage || 0}%
                            </div>
                            <div className="text-text-secondary text-xs">Complete</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                          <div
                            className="bg-primary h-full transition-all duration-300 ease-out"
                            style={{ width: `${currentSectionStatus?.completionPercentage || 0}%` }}
                          />
                        </div>

                        {/* Status Messages */}
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            {Object.keys(errors).filter((id) =>
                              questionsData.sections[currentSection].questions.some(
                                (q) => q.id === id
                              )
                            ).length > 0 ? (
                              <span className="text-error">
                                {
                                  Object.keys(errors).filter((id) =>
                                    questionsData.sections[currentSection].questions.some(
                                      (q) => q.id === id
                                    )
                                  ).length
                                }{' '}
                                error
                                {Object.keys(errors).filter((id) =>
                                  questionsData.sections[currentSection].questions.some(
                                    (q) => q.id === id
                                  )
                                ).length !== 1
                                  ? 's'
                                  : ''}{' '}
                                to fix
                              </span>
                            ) : currentSectionStatus?.completionPercentage === 100 ? (
                              <span className="text-success">Section complete!</span>
                            ) : (
                              <span className="text-text-secondary">
                                {
                                  questionsData.sections[currentSection].questions.filter(
                                    (q) => q.required
                                  ).length
                                }{' '}
                                required fields
                              </span>
                            )}
                          </div>
                          <div className="text-text-secondary">
                            Overall: <span className="font-medium">{overallCompletion}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Current Section Questions */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="animate-fade-in-up space-y-7"
                    >
                      {currentSectionData.questions.map((question, index) => {
                        const fieldError = errors[question.id];
                        const isTouched = methods.formState.touchedFields[question.id];
                        const fieldValue = watch(question.id);

                        return (
                          <motion.div
                            key={question.id}
                            id={`question-${question.id}`}
                            className="scroll-mt-24"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <DynamicQuestionRenderer
                              question={question}
                              value={fieldValue}
                              onChange={(value) => {
                                methods.setValue(question.id, value, {
                                  shouldTouch: true,
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              error={errors[question.id]?.message as string | undefined}
                              touched={!!isTouched}
                              onBlur={() => {
                                // Trigger validation on blur
                                methods.trigger(question.id);
                              }}
                            />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {/* Error Display - Only show submission errors */}
                  {saveError && (
                    <div className="bg-error/10 border-error/20 rounded-lg border p-4">
                      <p className="text-error text-sm font-medium">⚠️ {saveError}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-end border-t border-white/10 pt-8">
                    <div className="flex items-center gap-3">
                      {currentSection > 0 && (
                        <QuestionnaireButton
                          type="button"
                          onClick={handlePrevious}
                          variant="ghost"
                          disabled={isSubmitting}
                        >
                          Previous
                        </QuestionnaireButton>
                      )}
                      {!isLastSection ? (
                        <QuestionnaireButton
                          type="button"
                          onClick={handleNext}
                          variant="primary"
                          disabled={isSubmitting}
                        >
                          Next Section
                        </QuestionnaireButton>
                      ) : (
                        <QuestionnaireButton
                          type="button"
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          variant="primary"
                        >
                          {isSubmitting ? 'Processing...' : 'Complete Questionnaire'}
                        </QuestionnaireButton>
                      )}
                    </div>
                  </div>

                  {/* Autosave Status Indicator */}
                  <div className="text-text-secondary mt-4 flex items-center justify-center text-xs">
                    <div className="flex items-center gap-2">
                      {isAutosaving && (
                        <>
                          <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
                          <span>Saving...</span>
                        </>
                      )}
                      {lastAutosave && !isAutosaving && (
                        <>
                          <div className="bg-success h-2 w-2 rounded-full"></div>
                          <span>
                            Saved {Math.floor((Date.now() - lastAutosave.getTime()) / 1000)}s ago
                          </span>
                        </>
                      )}
                      {!lastAutosave && !isAutosaving && (
                        <span className="text-text-disabled">Unsaved changes</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </form>
            </_QuestionnaireProvider>
          </FormErrorBoundary>
        </div>
      </main>
    </div>
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
