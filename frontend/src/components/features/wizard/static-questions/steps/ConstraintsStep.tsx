'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';

const COMMON_CONSTRAINTS = [
  'Limited timeline (< 3 months)',
  'Extended timeline (> 6 months)',
  'Remote learners only',
  'Multiple time zones',
  'Limited budget',
  'Compliance requirements (HIPAA, GDPR, etc.)',
  'Completion certificates required',
  'No mobile app development',
  'Intranet/offline only',
  'Limited SME availability',
  'No dedicated support staff',
  'Legacy system integration',
  'Limited technical resources',
];

export function ConstraintsStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // CRITICAL: Register the field
  React.useEffect(() => {
    register('constraints');
  }, [register]);

  const constraints = watch('constraints') || [];
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customConstraint, setCustomConstraint] = useState('');

  const toggleConstraint = (constraint: string): void => {
    const currentConstraints = constraints as string[];
    if (currentConstraints.includes(constraint)) {
      setValue(
        'constraints',
        currentConstraints.filter((c) => c !== constraint),
        { shouldValidate: true }
      );
    } else {
      setValue('constraints', [...currentConstraints, constraint], { shouldValidate: true });
    }
  };

  const addCustomConstraint = (): void => {
    if (customConstraint.trim()) {
      const currentConstraints = constraints as string[];
      if (!currentConstraints.includes(customConstraint.trim())) {
        setValue('constraints', [...currentConstraints, customConstraint.trim()], {
          shouldValidate: true,
        });
      }
      setCustomConstraint('');
      setShowCustomInput(false);
    }
  };

  const removeConstraint = (constraint: string): void => {
    const currentConstraints = constraints as string[];
    setValue(
      'constraints',
      currentConstraints.filter((c) => c !== constraint),
      { shouldValidate: true }
    );
  };

  const isSelected = (constraint: string): boolean => {
    return (constraints as string[]).includes(constraint);
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="space-y-2">
        <label className="block text-sm text-white/70">
          What are your constraints?
          <span className="text-primary-400 ml-1">*</span>
        </label>
        <p className="text-xs text-white/50">
          Select common constraints or add your own. Timeline, delivery, organizational, or
          technical constraints that impact this initiative.
        </p>
      </div>

      {/* Common Constraints Bubbles */}
      <div className="flex flex-wrap gap-2">
        {COMMON_CONSTRAINTS.map((constraint) => (
          <button
            key={constraint}
            type="button"
            onClick={() => toggleConstraint(constraint)}
            className={`focus-visible:ring-primary-400 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isSelected(constraint)
                ? 'bg-primary-500 shadow-primary-500/25 text-white shadow-md'
                : 'border border-white/10 bg-white/10 text-white/80 hover:bg-white/15'
            } `}
          >
            {constraint}
          </button>
        ))}
      </div>

      {/* Add Your Own Button */}
      {!showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="focus-visible:ring-primary-400 flex items-center gap-2 rounded-full border border-dashed border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add your own
        </button>
      )}

      {/* Custom Input Field */}
      {showCustomInput && (
        <div className="animate-fade-in flex gap-2">
          <input
            type="text"
            value={customConstraint}
            onChange={(e) => setCustomConstraint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomConstraint();
              } else if (e.key === 'Escape') {
                setCustomConstraint('');
                setShowCustomInput(false);
              }
            }}
            placeholder="Enter custom constraint..."
            className="focus:ring-primary-400 focus:border-primary-400 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 ring-0 transition outline-none focus:ring-[1.2px]"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustomConstraint}
            className="bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-400 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomConstraint('');
              setShowCustomInput(false);
            }}
            className="focus-visible:ring-primary-400 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected Constraints Display */}
      {constraints.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm text-white/70">Selected constraints:</p>
          <div className="flex flex-wrap gap-2">
            {(constraints as string[]).map((constraint) => (
              <span
                key={constraint}
                className="bg-primary-500/20 text-primary-300 border-primary-400/30 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              >
                {constraint}
                <button
                  type="button"
                  onClick={() => removeConstraint(constraint)}
                  className="hover:bg-primary-400/30 focus-visible:ring-primary-400 rounded-full p-0.5 transition-colors focus-visible:ring-2"
                  aria-label={`Remove ${constraint}`}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.constraints?.message && (
        <p className="animate-fade-in flex items-center gap-1 text-sm text-red-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errors.constraints.message}
        </p>
      )}

      {/* Help Section */}
      <div
        className="animate-fade-in rounded-lg p-4"
        style={{
          backgroundColor: 'rgba(167, 218, 219, 0.1)',
          border: '1px solid rgba(167, 218, 219, 0.2)',
        }}
      >
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0"
            style={{ color: '#a7dadb' }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm" style={{ color: '#d0edf0' }}>
            <p className="mb-2 font-medium">Tips for identifying constraints:</p>
            <ul className="list-inside list-disc space-y-1.5 text-xs text-white/70">
              <li>
                <strong>Time:</strong> Deadlines, available learning time per week, project duration
              </li>
              <li>
                <strong>Location/Access:</strong> Remote vs. on-site, time zones, internet
                connectivity
              </li>
              <li>
                <strong>Compliance:</strong> Regulatory requirements, certifications, documentation
                needs
              </li>
              <li>
                <strong>Technical:</strong> Platform limitations, existing systems, device
                restrictions
              </li>
              <li>
                <strong>People:</strong> SME availability, support resources, team capacity
              </li>
            </ul>
            <p className="mt-2 text-xs text-white/60">
              Being upfront about constraints helps us create achievable solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
