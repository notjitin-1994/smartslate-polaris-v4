'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
}

interface QuestionnaireContextValue {
  // Data
  sections: Section[];
  currentSection: number;
  blueprintId: string | null;

  // Navigation
  goToSection: (index: number) => void;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
  canNavigateToSection: (index: number) => boolean;

  // Progress
  completionPercentage: number;
  sectionCompletionStatus: Record<number, boolean>;
  isFirstSection: boolean;
  isLastSection: boolean;

  // Validation
  errors: Record<string, any>;
  validateSection: (sectionIndex: number) => Promise<boolean>;
  validateAll: () => Promise<boolean>;

  // Save
  isAutosaving: boolean;
  lastSaveTime: Date | null;
  saveProgress: () => Promise<void>;
  submitQuestionnaire: () => Promise<void>;
  isSubmitting: boolean;

  // UI State
  saveError: string | null;
  setSaveError: (error: string | null) => void;
  isLoading: boolean;
}

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(null);

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
  }
  return context;
}

interface QuestionnaireProviderProps {
  children: ReactNode;
  initialData: {
    sections: Section[];
    existingAnswers: Record<string, unknown>;
    currentSection?: number;
    blueprintId: string;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onSave?: (data: Record<string, unknown>) => Promise<void>;
}

export function QuestionnaireProvider({
  children,
  initialData,
  onSubmit,
  onSave,
}: QuestionnaireProviderProps) {
  const [sections] = useState(initialData.sections);
  const [currentSection, setCurrentSection] = useState(initialData.currentSection || 0);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create dynamic schema
  const createDynamicSchema = useCallback((sections: Section[]) => {
    const shape: Record<string, z.ZodTypeAny> = {};

    sections.forEach((section) => {
      section.questions.forEach((question) => {
        let fieldSchema: z.ZodTypeAny = z.any();

        // Apply type-specific validation
        switch (question.type) {
          case 'text':
          case 'textarea':
            fieldSchema = z.string();
            break;
          case 'number':
          case 'slider':
            fieldSchema = z.number();
            break;
          case 'checkbox_pills':
          case 'checkbox_cards':
          case 'multiselect':
            fieldSchema = z.array(z.string());
            break;
          case 'radio_pills':
          case 'radio_cards':
          case 'select':
          case 'toggle_switch':
            fieldSchema = z.string();
            break;
          case 'likert_scale':
            fieldSchema = z.number().min(1).max(10);
            break;
          default:
            fieldSchema = z.any();
        }

        // Apply required validation
        if (!question.required) {
          fieldSchema = fieldSchema.optional();
        }

        // Apply custom validation rules
        if (question.validation) {
          question.validation.forEach((rule) => {
            switch (rule.rule) {
              case 'minLength':
                if (fieldSchema instanceof z.ZodString && typeof rule.value === 'number') {
                  fieldSchema = (fieldSchema as z.ZodString).min(rule.value, rule.message);
                }
                break;
              case 'maxLength':
                if (fieldSchema instanceof z.ZodString && typeof rule.value === 'number') {
                  fieldSchema = (fieldSchema as z.ZodString).max(rule.value, rule.message);
                }
                break;
              case 'minSelections':
                if (fieldSchema instanceof z.ZodArray && typeof rule.value === 'number') {
                  fieldSchema = (fieldSchema as any).min(rule.value, rule.message);
                }
                break;
              case 'maxSelections':
                if (fieldSchema instanceof z.ZodArray && typeof rule.value === 'number') {
                  fieldSchema = (fieldSchema as any).max(rule.value, rule.message);
                }
                break;
            }
          });
        }

        shape[question.id] = fieldSchema;
      });
    });

    return z.object(shape);
  }, []);

  const schema = createDynamicSchema(sections);

  const methods = useForm<Record<string, unknown>>({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: initialData.existingAnswers || {},
  });

  const {
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
    watch,
  } = methods;

  // Calculate completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    const values = getValues();
    let totalRequired = 0;
    let completed = 0;

    sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.required) {
          totalRequired++;
          const value = values[question.id];
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            (!Array.isArray(value) || value.length > 0)
          ) {
            completed++;
          }
        }
      });
    });

    return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;
  }, [sections, getValues]);

  // Calculate section completion status
  const calculateSectionCompletionStatus = useCallback(() => {
    const values = getValues();
    const status: Record<number, boolean> = {};

    sections.forEach((section, index) => {
      const sectionQuestions = section.questions.filter((q) => q.required);
      const completedQuestions = sectionQuestions.filter((q) => {
        const value = values[q.id];
        return (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          (!Array.isArray(value) || value.length > 0)
        );
      });
      status[index] = sectionQuestions.length === completedQuestions.length;
    });

    return status;
  }, [sections, getValues]);

  // Navigation
  const goToSection = useCallback(
    (index: number) => {
      if (index >= 0 && index < sections.length) {
        setCurrentSection(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [sections]
  );

  const goToNextSection = useCallback(async () => {
    const isValid = await validateSection(currentSection);
    if (isValid && currentSection < sections.length - 1) {
      goToSection(currentSection + 1);
    }
  }, [currentSection, sections]);

  const goToPreviousSection = useCallback(() => {
    if (currentSection > 0) {
      goToSection(currentSection - 1);
    }
  }, [currentSection]);

  const canNavigateToSection = useCallback(
    (index: number) => {
      // Allow navigating to any previous section or the next section
      return index <= currentSection + 1 && index >= 0 && index < sections.length;
    },
    [currentSection, sections]
  );

  // Validation
  const validateSection = useCallback(
    async (sectionIndex: number) => {
      const section = sections[sectionIndex];
      const questionIds = section.questions.map((q) => q.id);
      return await trigger(questionIds);
    },
    [sections, trigger]
  );

  const validateAll = useCallback(async () => {
    const allQuestionIds = sections.flatMap((s) => s.questions.map((q) => q.id));
    return await trigger(allQuestionIds);
  }, [sections, trigger]);

  // Save functionality
  const saveProgress = useCallback(async () => {
    if (!onSave || !initialData.blueprintId) return;

    try {
      setIsAutosaving(true);
      setSaveError(null);
      const values = getValues();

      await onSave(values);

      setLastSaveTime(new Date());

      // Save to sessionStorage as backup
      sessionStorage.setItem(
        `questionnaire-${initialData.blueprintId}`,
        JSON.stringify({
          answers: values,
          currentSection,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      setSaveError('Failed to save progress. Your answers are stored locally.');
    } finally {
      setIsAutosaving(false);
    }
  }, [onSave, getValues, currentSection, initialData.blueprintId]);

  // Auto-save on form change
  React.useEffect(() => {
    const subscription = watch(() => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 1000); // 1 second debounce
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [watch, saveProgress]);

  // Submit functionality
  const submitQuestionnaire = useCallback(async () => {
    const isValid = await validateAll();
    if (!isValid) {
      setSaveError('Please complete all required fields before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSaveError(null);
      const values = getValues();
      await onSubmit(values);

      // Clear sessionStorage on successful submission
      sessionStorage.removeItem(`questionnaire-${initialData.blueprintId}`);
    } catch (error) {
      setSaveError('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, getValues, onSubmit, initialData.blueprintId]);

  const contextValue: QuestionnaireContextValue = {
    sections,
    currentSection,
    blueprintId: initialData.blueprintId,
    goToSection,
    goToNextSection,
    goToPreviousSection,
    canNavigateToSection,
    completionPercentage: calculateCompletionPercentage(),
    sectionCompletionStatus: calculateSectionCompletionStatus(),
    isFirstSection: currentSection === 0,
    isLastSection: currentSection === sections.length - 1,
    errors,
    validateSection,
    validateAll,
    isAutosaving,
    lastSaveTime,
    saveProgress,
    submitQuestionnaire,
    isSubmitting,
    saveError,
    setSaveError,
    isLoading,
  };

  return (
    <QuestionnaireContext.Provider value={contextValue}>
      <FormProvider {...methods}>{children}</FormProvider>
    </QuestionnaireContext.Provider>
  );
}
