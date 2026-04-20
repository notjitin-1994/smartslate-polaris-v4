'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';

export function DurationStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<StaticQuestionsFormValues>();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="role" className="text-primary block text-lg font-semibold">
          What is your role?
        </label>
        <p className="text-secondary text-sm">
          Provide your role relevant to this initiative (e.g., L&D Manager, Instructional Designer,
          Trainer).
        </p>
      </div>

      <div className="space-y-2">
        <input
          id="role"
          type="text"
          {...register('role')}
          className={`w-full rounded-lg border-2 p-4 text-base transition-colors ${
            errors.role
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:bg-red-900/20'
              : 'focus:border-secondary focus:ring-secondary/50 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
          } placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500`}
          placeholder="e.g., Instructional Designer"
          aria-invalid={!!errors.role}
          aria-describedby={errors.role ? 'role-error' : undefined}
        />
        {errors.role && (
          <p
            id="role-error"
            className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {errors.role.message}
          </p>
        )}
      </div>

      <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-9a3 3 0 11-6 0 3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-orange-800 dark:text-orange-200">
            <p className="mb-1 font-medium">Context:</p>
            <p>
              Role influences responsibilities, decision rights, and available levers for change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
