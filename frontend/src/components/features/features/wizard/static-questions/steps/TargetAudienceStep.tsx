'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';

export function TargetAudienceStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<StaticQuestionsFormValues>();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="organization" className="text-primary block text-lg font-semibold">
          What is your organization/team context?
        </label>
        <p className="text-secondary text-sm">
          Describe the organization, team, or function and any relevant context that affects this
          initiative.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          id="organization"
          {...register('organization')}
          className={`min-h-28 w-full resize-none rounded-lg border-2 p-4 text-base transition-colors ${
            errors.organization
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:bg-red-900/20'
              : 'focus:border-secondary focus:ring-secondary/50 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
          } placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500`}
          placeholder="e.g., Global L&D team in a 2,000-person SaaS org; cross-functional stakeholders across engineering and enablement."
          aria-invalid={!!errors.organization}
          aria-describedby={errors.organization ? 'organization-error' : undefined}
        />
        {errors.organization && (
          <p
            id="organization-error"
            className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.organization.message}
          </p>
        )}
      </div>

      <div className="bg-success/10 dark:bg-success/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg
            className="text-success dark:text-success mt-0.5 h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-success dark:text-success text-sm">
            <p className="mb-1 font-medium">Tip:</p>
            <p>
              Be specific about experience levels and prior knowledge. This helps tailor the content
              appropriately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
