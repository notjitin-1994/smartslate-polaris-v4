'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';

export function AssessmentTypeStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<StaticQuestionsFormValues>();

  const assessmentExamples = [
    'Multiple choice quizzes',
    'Practical projects',
    'Code reviews',
    'Peer assessments',
    'Written assignments',
    'Live presentations',
    'Portfolio reviews',
    'Self-assessments',
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="constraints" className="text-primary block text-lg font-semibold">
          What constraints apply?
        </label>
        <p className="text-secondary text-sm">
          Include timelines, delivery requirements, approvals, regulatory constraints, or other
          blockers.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          id="constraints"
          {...register('constraints')}
          className={`min-h-24 w-full resize-none rounded-lg border-2 p-4 text-base transition-colors ${
            errors.constraints
              ? 'border-red-300 bg-red-50 focus-visible:border-red-500 focus-visible:ring-red-500/50 dark:border-red-700 dark:bg-red-900/20'
              : 'focus-visible:border-secondary focus-visible:ring-secondary/50 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
          } placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500`}
          placeholder="e.g., Launch by Q4, mobile-first constraints, SCORM compliance, limited SME time, requires legal review"
          aria-invalid={!!errors.constraints}
          aria-describedby={errors.constraints ? 'constraints-error' : undefined}
        />
        {errors.constraints && (
          <p
            id="constraints-error"
            className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.constraints.message}
          </p>
        )}
      </div>

      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg
            className="text-secondary dark:text-secondary-light mt-0.5 h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-secondary-dark dark:text-secondary-light text-sm">
            <p className="mb-2 font-medium">Tips:</p>
            <p className="text-xs">
              Constraints guide scope and sequencing. Be realistic to avoid infeasible blueprints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
