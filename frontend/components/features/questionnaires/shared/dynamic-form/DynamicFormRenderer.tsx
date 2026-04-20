'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider, FieldValues, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormSchema, DynamicFormRendererProps, DynamicFormRef } from '@/lib/dynamic-form';
import { validateFormData } from '@/lib/dynamic-form/validation';
import { getInputComponent } from './inputs';
import { cn } from '@/lib/utils';
import { DynamicFormLayout } from './DynamicFormLayout';
import { DynamicFormCard } from './DynamicFormCard';
import { DynamicFormProgress } from './DynamicFormProgress';
import { DynamicFormButton } from './DynamicFormButton';

// Error boundary component
class FormErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div
    className="rounded-xl border border-red-400/50 p-6"
    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
  >
    <h3 className="mb-2 text-lg font-semibold text-red-400">Form Error</h3>
    <p className="mb-4 text-white/70">
      There was an error rendering the form. Please try refreshing the page.
    </p>
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-red-300">Error Details</summary>
      <pre className="mt-2 overflow-auto rounded bg-black/20 p-2 text-xs text-red-200">
        {error.message}
      </pre>
    </details>
  </div>
);

// Create Zod schema from form schema
const createZodSchema = (formSchema: FormSchema): z.ZodSchema => {
  // Add defensive programming to handle undefined sections
  if (!formSchema.sections || !Array.isArray(formSchema.sections)) {
    console.warn('Form schema sections are not properly defined:', formSchema.sections);
    return z.object({});
  }

  const questionSchemas = formSchema.sections.flatMap((section) => {
    // Skip undefined sections
    if (!section || !section.questions || !Array.isArray(section.questions)) {
      console.warn('Section or questions are not properly defined:', section);
      return [];
    }

    return section.questions
      .map((question) => {
        // Skip undefined questions
        if (!question || !question.id) {
          console.warn('Question is not properly defined:', question);
          return null;
        }

        let fieldSchema: z.ZodTypeAny;
        const labelText = question.label || question.id;
        const requiredMsg = `${labelText} is required`;

        switch (question.type) {
          case 'text':
          case 'textarea':
          case 'email':
          case 'url':
            if (question.required) {
              fieldSchema = z.string().min(1, requiredMsg);
            } else {
              fieldSchema = z.string().optional();
            }
            break;

          case 'number':
            if (question.required) {
              fieldSchema = z.number().min(0, requiredMsg);
            } else {
              fieldSchema = z.number().optional();
            }
            break;

          case 'select':
            if (question.required) {
              fieldSchema = z.string().min(1, requiredMsg);
            } else {
              fieldSchema = z.string().optional();
            }
            break;

          case 'multiselect':
            if (question.required) {
              fieldSchema = z.array(z.string()).min(1, requiredMsg);
            } else {
              fieldSchema = z.array(z.string()).optional();
            }
            break;

          case 'scale':
            if (question.required) {
              fieldSchema = z.number().min(question.scaleConfig?.min || 1, requiredMsg);
            } else {
              fieldSchema = z.number().optional();
            }
            break;

          case 'date':
            if (question.required) {
              fieldSchema = z.string().min(1, requiredMsg);
            } else {
              fieldSchema = z.string().optional();
            }
            break;

          default:
            fieldSchema = z.any().optional();
        }

        return [question.id, fieldSchema] as const;
      })
      .filter((item): item is [string, any] => item !== null); // Remove null entries
  });

  return z.object(Object.fromEntries(questionSchemas));
};

// Main DynamicFormRenderer component
export const DynamicFormRenderer = React.forwardRef<DynamicFormRef, DynamicFormRendererProps>(
  (
    {
      formSchema,
      initialData = {},
      onSubmit,
      onSave,
      onValidationChange,
      className,
      disabled = false,
      showProgress = true,
      autoSave = true,
    },
    ref
  ) => {
    // State management
    const [currentSection, setCurrentSection] = useState<string>(formSchema.sections[0]?.id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Debug: Log current section
    console.log('Current section:', currentSection);
    console.log(
      'Form schema sections:',
      formSchema.sections.map((s) => s.id)
    );

    // Create Zod schema for validation
    const zodSchema = useMemo(() => createZodSchema(formSchema), [formSchema]);

    // Prepare default values with proper initialization
    const defaultValues = useMemo(() => {
      const values: FieldValues = { ...initialData };

      // Initialize all required fields with empty strings to avoid undefined
      formSchema.sections.forEach((section) => {
        section.questions.forEach((question) => {
          if (question.required && !(question.id in values)) {
            switch (question.type) {
              case 'text':
              case 'textarea':
              case 'email':
              case 'url':
              case 'select':
              case 'date':
                values[question.id] = '';
                break;
              case 'number':
              case 'scale':
                values[question.id] = 0;
                break;
              case 'multiselect':
                values[question.id] = [];
                break;
              default:
                values[question.id] = '';
            }
          }
        });
      });

      return values;
    }, [initialData, formSchema]);

    // Initialize React Hook Form
    const methods = useForm<FieldValues>({
      resolver: zodResolver(zodSchema as any) as any,
      defaultValues,
      mode: 'onChange',
    });

    const {
      handleSubmit,
      watch,
      formState: { isValid },
      setValue,
      reset,
      trigger,
    } = methods;

    // Validation engine
    // const validationEngine = useMemo(() => createValidationEngine(formSchema), [formSchema]);

    // Watch form data for changes
    const formData = watch();

    // Handle form data changes
    useEffect(() => {
      setHasUnsavedChanges(true);

      // Validate form and notify parent
      if (onValidationChange) {
        const validationResult = validateFormData(formSchema, formData);
        onValidationChange(validationResult.isValid, validationResult.errors);
      }
    }, [formData, formSchema, onValidationChange]);

    // Trigger validation on mount
    useEffect(() => {
      trigger();
    }, [trigger]);

    // Auto-save functionality
    useEffect(() => {
      if (!autoSave || !hasUnsavedChanges) return;

      const timeoutId = setTimeout(async () => {
        if (onSave) {
          try {
            setIsSaving(true);
            await onSave(formData);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setIsSaving(false);
          }
        }
      }, formSchema.settings?.autoSaveInterval || 2000);

      return () => clearTimeout(timeoutId);
    }, [formData, autoSave, hasUnsavedChanges, onSave, formSchema.settings?.autoSaveInterval]);

    // Handle form submission
    const handleFormSubmit = useCallback(
      async (data: FieldValues) => {
        if (isSubmitting) return;

        try {
          setIsSubmitting(true);
          // Validate the form before submission
          const isValid = await trigger();
          if (isValid && onSubmit) {
            await onSubmit(data);
          }
        } catch (error) {
          console.error('Form submission failed:', error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [onSubmit, isSubmitting, trigger]
    );

    // Handle manual save
    const handleManualSave = useCallback(async () => {
      if (!onSave || isSaving) return;

      try {
        setIsSaving(true);
        await onSave(formData);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Manual save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, [onSave, formData, isSaving]);

    // Handle section navigation
    const goToSection = useCallback(
      (sectionId: string) => {
        const section = formSchema.sections.find((s) => s.id === sectionId);
        if (section) {
          setCurrentSection(sectionId);
        }
      },
      [formSchema.sections]
    );

    const nextSection = useCallback(() => {
      const currentIndex = formSchema.sections.findIndex((s) => s.id === currentSection);
      if (currentIndex < formSchema.sections.length - 1) {
        setCurrentSection(formSchema.sections[currentIndex + 1].id);
      }
    }, [currentSection, formSchema.sections]);

    const previousSection = useCallback(() => {
      const currentIndex = formSchema.sections.findIndex((s) => s.id === currentSection);
      if (currentIndex > 0) {
        setCurrentSection(formSchema.sections[currentIndex - 1].id);
      }
    }, [currentSection, formSchema.sections]);

    // Calculate progress
    const progress = useMemo(() => {
      const totalQuestions = formSchema.sections.reduce(
        (acc, section) => acc + section.questions.length,
        0
      );
      const answeredQuestions = Object.keys(formData).filter((key) => {
        const value = formData[key];
        return value !== undefined && value !== null && value !== '';
      }).length;

      return {
        current: answeredQuestions,
        total: totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      };
    }, [formData, formSchema.sections]);

    // Section index helpers
    const currentIndex = useMemo(
      () => formSchema.sections.findIndex((s) => s.id === currentSection),
      [formSchema.sections, currentSection]
    );
    const isFirstSection = currentIndex <= 0;
    const isLastSection = currentIndex === formSchema.sections.length - 1;
    const nextSectionTitle = !isLastSection
      ? formSchema.sections[currentIndex + 1]?.title || `Section ${currentIndex + 2}`
      : undefined;

    // Expose methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        submit: handleFormSubmit as any,
        save: handleManualSave,
        reset: () => {
          reset();
          setCurrentSection(formSchema.sections[0]?.id || '');
          setHasUnsavedChanges(false);
        },
        validate: () => validateFormData(formSchema, formData),
        getData: () => formData,
        setData: (data: Record<string, unknown>) => {
          Object.entries(data).forEach(([key, value]) => {
            setValue(key, value);
          });
        },
        goToSection,
        nextSection,
        previousSection,
      }),
      [
        handleFormSubmit,
        handleManualSave,
        reset,
        formSchema,
        formData,
        setValue,
        goToSection,
        nextSection,
        previousSection,
      ]
    );

    const currentSectionIndex = formSchema.sections.findIndex((s) => s.id === currentSection);
    const currentSectionData = formSchema.sections[currentSectionIndex];

    return (
      <FormErrorBoundary>
        {/* Form Content */}
        <div className="w-full">
          <DynamicFormCard showLogo={false}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Form Title and Description */}
                {formSchema.title && (
                  <div className="animate-fade-in-up mb-10 space-y-6">
                    <div className="text-center">
                      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                        {formSchema.title}
                      </h1>
                      {formSchema.description && (
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                          {formSchema.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress indicator */}
                <DynamicFormProgress
                  currentSection={currentSectionIndex}
                  totalSections={formSchema.sections.length}
                  sectionTitle={currentSectionData?.title}
                  sectionDescription={currentSectionData?.description}
                />

                {/* Form sections */}
                {formSchema.sections && Array.isArray(formSchema.sections) ? (
                  formSchema.sections
                    .map((section, sectionIndex) => {
                      // Skip undefined sections
                      if (!section || !section.id) {
                        return null;
                      }

                      const isHidden = currentSection !== section.id;
                      const className = cn('space-y-6', isHidden && 'hidden');

                      return (
                        <div
                          key={`section-${sectionIndex}-${section.id}`}
                          className={className}
                          style={{ display: isHidden ? 'none' : 'block' }}
                        >
                          <div className="animate-fade-in-up space-y-6">
                            {section.questions && Array.isArray(section.questions) ? (
                              section.questions
                                .map((question, questionIndex) => {
                                  // Skip undefined questions
                                  if (!question || !question.id) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={`question-${sectionIndex}-${questionIndex}-${question.id}`}
                                      className="space-y-2"
                                    >
                                      {/* Render actual input components based on question type (components include their own label/help) */}
                                      <Controller
                                        name={question.id}
                                        control={methods.control}
                                        render={({ field, fieldState }) => {
                                          const InputComponent = getInputComponent(question.type);
                                          return (
                                            <InputComponent
                                              key={`input-${sectionIndex}-${questionIndex}-${question.id}`}
                                              question={question}
                                              value={field.value}
                                              onChange={async (value) => {
                                                field.onChange(value);
                                                await trigger(question.id);
                                                // Real-time persist: delegate to onSave if provided
                                                try {
                                                  if (onSave) {
                                                    await onSave({
                                                      ...methods.getValues(),
                                                      [question.id]: value,
                                                    });
                                                  }
                                                } catch (e) {
                                                  // Save failed silently
                                                }
                                              }}
                                              onBlur={() => {
                                                field.onBlur();
                                                trigger(question.id);
                                              }}
                                              error={fieldState.error?.message}
                                              disabled={disabled}
                                            />
                                          );
                                        }}
                                      />
                                    </div>
                                  );
                                })
                                .filter(Boolean) // Remove null entries
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">
                                No questions available in this section.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean) // Remove null entries
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No sections available. Please try refreshing the page.
                    </p>
                  </div>
                )}

                {/* Save Status */}
                <div className="flex items-center justify-start py-2">
                  {isSaving && (
                    <div
                      className="animate-fade-in flex items-center gap-2"
                      style={{ color: '#d0edf0' }}
                    >
                      <div
                        className="h-3 w-3 animate-spin rounded-full border-2"
                        style={{
                          borderColor: 'rgba(167, 218, 219, 0.3)',
                          borderTopColor: '#a7dadb',
                        }}
                      />
                      <span className="text-xs font-medium">Saving...</span>
                    </div>
                  )}
                  {!isSaving && lastSaved && (
                    <div className="animate-fade-in text-success flex items-center gap-2">
                      <div className="bg-success flex h-3 w-3 items-center justify-center rounded-full">
                        <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">All changes saved</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div
                  className="flex items-center justify-end pt-6"
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex space-x-2">
                    <DynamicFormButton
                      type="button"
                      onClick={previousSection}
                      disabled={disabled || isFirstSection}
                      variant="ghost"
                    >
                      Previous
                    </DynamicFormButton>
                    {isLastSection ? (
                      <DynamicFormButton
                        type="submit"
                        disabled={disabled || isSubmitting}
                        loading={isSubmitting}
                        variant="primary"
                      >
                        {formSchema.settings?.submitButtonText || 'Complete Blueprint'}
                      </DynamicFormButton>
                    ) : (
                      <DynamicFormButton
                        type="button"
                        onClick={nextSection}
                        variant="primary"
                        disabled={disabled}
                      >
                        Next
                      </DynamicFormButton>
                    )}
                  </div>
                </div>
              </form>
            </FormProvider>
          </DynamicFormCard>
        </div>
      </FormErrorBoundary>
    );
  }
);

DynamicFormRenderer.displayName = 'DynamicFormRenderer';

export default DynamicFormRenderer;
