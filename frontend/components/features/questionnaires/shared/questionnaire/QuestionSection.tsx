'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useQuestionnaire } from './QuestionnaireProvider';
import { DynamicQuestionRenderer } from '@/components/demo-dynamicv2/DynamicQuestionRenderer';
import { QuestionField } from './QuestionField';

interface QuestionSectionProps {
  className?: string;
  showValidation?: 'always' | 'touched' | 'submitted';
}

export function QuestionSection({ className, showValidation = 'touched' }: QuestionSectionProps) {
  const { sections, currentSection, errors } = useQuestionnaire();
  const { watch, setValue, trigger, formState } = useFormContext();

  const currentSectionData = sections[currentSection];

  const sectionTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  };

  const sectionErrorCount = Object.keys(errors).filter((id) =>
    currentSectionData.questions.some((q) => q.id === id)
  ).length;

  const requiredFieldCount = currentSectionData.questions.filter((q) => q.required).length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSection}
        {...sectionTransition}
        className={cn('space-y-8', className)}
        role="region"
        aria-label={`Section ${currentSection + 1}: ${currentSectionData.title}`}
      >
        {/* Enhanced Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.15] to-white/[0.08] p-8 shadow-2xl shadow-black/20 backdrop-blur-md"
        >
          {/* Decorative gradient accent */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-bl from-cyan-500/20 via-teal-500/10 to-transparent blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-transparent blur-2xl" />

          <div className="relative space-y-4">
            {/* Section badge and stats */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30">
                  <span className="text-lg font-bold text-white">{currentSection + 1}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                  <span className="text-sm font-semibold text-cyan-400">In Progress</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {requiredFieldCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                    <svg
                      className="h-4 w-4 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="font-medium text-white/95">{requiredFieldCount} required</span>
                  </div>
                )}
                {sectionErrorCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 backdrop-blur-sm">
                    <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-red-400">
                      {sectionErrorCount} {sectionErrorCount === 1 ? 'error' : 'errors'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section title and description */}
            <div className="space-y-2">
              <h2 className="text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
                {currentSectionData.title}
              </h2>
              {currentSectionData.description && (
                <p className="max-w-3xl text-base leading-relaxed text-white/95 md:text-lg">
                  {currentSectionData.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Questions with staggered animation */}
        <div className="space-y-5">
          {currentSectionData.questions.map((question, index) => {
            const fieldValue = watch(question.id);
            const fieldError = errors[question.id];
            const isTouched = formState.touchedFields[question.id];

            const shouldShowError =
              showValidation === 'always' ||
              (showValidation === 'touched' && isTouched) ||
              (showValidation === 'submitted' && formState.isSubmitted);

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                id={`question-${question.id}`}
                className="scroll-mt-24"
              >
                <QuestionField question={question} priority={question.required ? 'high' : 'normal'}>
                  <DynamicQuestionRenderer
                    question={question}
                    value={fieldValue}
                    onChange={(value) => {
                      setValue(question.id, value, {
                        shouldTouch: true,
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    error={
                      shouldShowError && fieldError
                        ? (fieldError.message as string) || 'This field has an error'
                        : undefined
                    }
                    touched={isTouched}
                    onBlur={() => trigger(question.id)}
                  />
                </QuestionField>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
