'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  RadioPillGroup,
  CheckboxPillGroup,
  CheckboxCardGroup,
  EnhancedScale,
  LabeledSlider,
} from '@/components/wizard/inputs';

const AUDIENCE_SIZES = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-1000', label: '201-1,000' },
  { value: '1000+', label: '1,000+' },
];

const MOTIVATION_TYPES = [
  { value: 'mandatory', label: 'Mandatory/Compliance' },
  { value: 'career', label: 'Career Growth' },
  { value: 'performance', label: 'Performance Improvement' },
  { value: 'certification', label: 'Certification' },
  { value: 'personal', label: 'Personal Interest' },
];

const ENVIRONMENTS = [
  { value: 'office', label: 'Office/Desk', description: 'Traditional office setting' },
  { value: 'remote', label: 'Remote/WFH', description: 'Work from home' },
  { value: 'field', label: 'Field/Mobile', description: 'On the move' },
  { value: 'customer', label: 'Customer Sites', description: 'Client locations' },
  { value: 'manufacturing', label: 'Manufacturing Floor', description: 'Factory setting' },
  { value: 'healthcare', label: 'Healthcare Setting', description: 'Hospital/clinic' },
];

const DEVICES = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'smartphone', label: 'Smartphone' },
];

export function LearnerProfileStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  // CRITICAL: Register all nested fields
  React.useEffect(() => {
    register('learnerProfile.audienceSize', { required: 'Audience size is required' });
    register('learnerProfile.priorKnowledge', { required: 'Prior knowledge level is required' });
    register('learnerProfile.motivation', { required: 'At least one motivation is required' });
    register('learnerProfile.environment', { required: 'At least one environment is required' });
    register('learnerProfile.devices', { required: 'At least one device is required' });
    register('learnerProfile.timeAvailable', { required: 'Time available is required' });
    register('learnerProfile.accessibility');
  }, [register]);

  const learnerProfile = watch('learnerProfile') || {};

  return (
    <div className="animate-fade-in-up space-y-6">
      <RadioPillGroup
        label="How many learners will participate?"
        value={learnerProfile.audienceSize || ''}
        onChange={(value) => setValue('learnerProfile.audienceSize', value)}
        options={AUDIENCE_SIZES}
        error={errors.learnerProfile?.audienceSize?.message as string}
        required
      />

      <EnhancedScale
        label="Learners' current knowledge of this topic"
        value={learnerProfile.priorKnowledge || 3}
        onChange={(value) => setValue('learnerProfile.priorKnowledge', value)}
        min={1}
        max={5}
        minLabel="No Knowledge"
        maxLabel="Expert Level"
        icons={['😵', '🤔', '😊', '😄', '🎓']}
        colors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']}
        helpText="Estimate the average knowledge level across your target audience"
        error={errors.learnerProfile?.priorKnowledge?.message as string}
        required
      />

      <CheckboxPillGroup
        label="What motivates these learners?"
        value={learnerProfile.motivation || []}
        onChange={(value) => setValue('learnerProfile.motivation', value)}
        options={MOTIVATION_TYPES}
        error={errors.learnerProfile?.motivation?.message as string}
        helpText="Select all that apply (up to 3)"
        maxSelections={3}
        required
      />

      <CheckboxCardGroup
        label="Where will learners access training?"
        value={learnerProfile.environment || []}
        onChange={(value) => setValue('learnerProfile.environment', value)}
        options={ENVIRONMENTS}
        error={errors.learnerProfile?.environment?.message as string}
        allowMultiple
        required
      />

      <CheckboxPillGroup
        label="What devices can learners use?"
        value={learnerProfile.devices || []}
        onChange={(value) => setValue('learnerProfile.devices', value)}
        options={DEVICES}
        error={errors.learnerProfile?.devices?.message as string}
        required
      />

      <LabeledSlider
        label="How many hours per week can learners dedicate?"
        value={learnerProfile.timeAvailable || 0}
        onChange={(value) => setValue('learnerProfile.timeAvailable', value)}
        min={0}
        max={20}
        step={1}
        unit=" hours"
        markers={[
          { value: 0, label: 'None' },
          { value: 2, label: 'Very Limited' },
          { value: 5, label: 'Moderate' },
          { value: 10, label: 'Substantial' },
          { value: 20, label: 'Full-time' },
        ]}
        helpText="Consider realistic time availability, not just ideal scenarios"
        error={errors.learnerProfile?.timeAvailable?.message as string}
        required
      />

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
            <p className="mb-2 font-medium">🎓 Why learner analysis matters:</p>
            <p className="text-white/70">
              Understanding your learners helps us match content to their existing knowledge level,
              design for their actual learning environment, and respect their time and motivation
              constraints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
