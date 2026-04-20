'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { QuestionnaireSelect } from '@/components/wizard/static-questions/QuestionnaireSelect';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';

const PREDEFINED_ROLES = [
  'Learning & Development Manager',
  'HR Director',
  'Training Specialist',
  'Instructional Designer',
  'Corporate Trainer',
  'Chief Learning Officer',
  'Talent Development Manager',
  'L&D Consultant',
  'Education Manager',
  'Custom (Specify below)',
];

export function RoleStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // Register the field
  useEffect(() => {
    register('role', { required: 'Role is required' });
  }, []); // Remove register from deps to avoid infinite re-renders

  const role = watch('role');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Initialize selected option based on existing role value
  useEffect(() => {
    if (role) {
      if (PREDEFINED_ROLES.includes(role)) {
        setSelectedOption(role);
        setShowCustomInput(false);
      } else {
        setSelectedOption('Custom (Specify below)');
        setShowCustomInput(true);
      }
    }
  }, []);

  const handleDropdownChange = (value: string) => {
    setSelectedOption(value);

    if (value === 'Custom (Specify below)') {
      setShowCustomInput(true);
      setValue('role', '');
    } else {
      setShowCustomInput(false);
      setValue('role', value);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-7">
      {/* Role Selection */}
      <QuestionnaireSelect
        label="What is your role?"
        value={selectedOption}
        onChange={handleDropdownChange}
        options={PREDEFINED_ROLES.map((r) => ({ value: r, label: r }))}
        placeholder="Select your role..."
        error={errors.role?.message}
        helpText="Your role relevant to this learning initiative"
        required
      />

      {/* Custom Input */}
      {showCustomInput && (
        <div className="animate-fade-in-up">
          <QuestionnaireInput
            label="Specify your custom role"
            value={role}
            onChange={(value) => setValue('role', value)}
            placeholder="e.g., Chief Learning Officer, Curriculum Developer, etc."
            error={errors.role?.message}
            helpText="Enter your specific role title"
            required
          />
        </div>
      )}

      {/* Info Box */}
      <QuestionnaireInfoBox title="Why this matters">
        <p className="mb-3">
          Your role helps us understand your perspective and decision-making authority, so we can
          tailor recommendations to your needs.
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-[13px]">
          <li>
            If you&apos;re a{' '}
            <strong className="text-foreground font-semibold">manager/director</strong>: We&apos;ll
            focus on strategic alignment and ROI
          </li>
          <li>
            If you&apos;re a{' '}
            <strong className="text-foreground font-semibold">designer/specialist</strong>:
            We&apos;ll dive deeper into implementation details
          </li>
          <li>
            If you&apos;re a <strong className="text-foreground font-semibold">consultant</strong>:
            We&apos;ll consider client-facing aspects and scalability
          </li>
        </ul>
      </QuestionnaireInfoBox>
    </div>
  );
}
