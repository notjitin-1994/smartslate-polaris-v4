'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { RadioCardGroup, CheckboxPillGroup, EnhancedScale } from '@/components/wizard/inputs';

const GAP_TYPES = [
  {
    value: 'knowledge',
    label: 'Knowledge Gap',
    description: "They don't know the information",
    example: 'New product features, policies, procedures',
  },
  {
    value: 'skill',
    label: 'Skill Gap',
    description: "They can't perform the task",
    example: 'Software usage, presentation skills',
  },
  {
    value: 'behavior',
    label: 'Behavior Gap',
    description: "They know and can, but don't do it",
    example: 'Following protocols, safety practices',
  },
  {
    value: 'performance',
    label: 'Performance Gap',
    description: 'Complex mix of knowledge, skill, and motivation',
    example: 'Leadership development, change management',
  },
];

const IMPACT_AREAS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'customer', label: 'Customer Satisfaction' },
  { value: 'safety', label: 'Safety' },
  { value: 'quality', label: 'Quality' },
  { value: 'retention', label: 'Employee Retention' },
];

const BLOOMS_LEVELS = [
  {
    value: 'remember',
    label: 'Remember',
    description: 'Recall facts and basic concepts',
    example: 'List, identify, name, recall',
  },
  {
    value: 'understand',
    label: 'Understand',
    description: 'Explain ideas or concepts',
    example: 'Explain, summarize, describe, classify',
  },
  {
    value: 'apply',
    label: 'Apply',
    description: 'Use information in new situations',
    example: 'Execute, implement, use, demonstrate',
  },
  {
    value: 'analyze',
    label: 'Analyze',
    description: 'Draw connections and distinctions',
    example: 'Compare, examine, differentiate, test',
  },
  {
    value: 'evaluate',
    label: 'Evaluate',
    description: 'Justify decisions or courses of action',
    example: 'Assess, critique, justify, judge',
  },
  {
    value: 'create',
    label: 'Create',
    description: 'Produce new or original work',
    example: 'Design, formulate, construct, develop',
  },
];

export function LearningGapStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // CRITICAL: Register all nested fields
  React.useEffect(() => {
    register('learningGap.description', { required: 'Learning gap description is required' });
    register('learningGap.gapType', { required: 'Gap type is required' });
    register('learningGap.urgency', { required: 'Urgency level is required' });
    register('learningGap.impact', { required: 'Impact level is required' });
    register('learningGap.impactAreas', { required: 'At least one impact area is required' });
    register('learningGap.bloomsLevel', { required: 'Blooms taxonomy level is required' });
    register('learningGap.objectives', { required: 'Learning objectives are required' });
  }, [register]);

  const learningGap = watch('learningGap') || {};

  return (
    <div className="animate-fade-in-up space-y-6">
      <QuestionnaireInput
        label="Describe the skills or knowledge gap"
        value={learningGap.description || ''}
        onChange={(value) => setValue('learningGap.description', value)}
        placeholder="e.g., Our sales team can't effectively demonstrate our product's new AI features to potential clients, leading to missed opportunities and longer sales cycles."
        error={errors.learningGap?.description?.message as string}
        helpText="What do learners struggle with? How does it impact performance?"
        required
        multiline
        rows={5}
      />

      <RadioCardGroup
        label="What type of gap is this?"
        value={learningGap.gapType || ''}
        onChange={(value) => setValue('learningGap.gapType', value)}
        options={GAP_TYPES}
        error={errors.learningGap?.gapType?.message as string}
        helpText="This helps us design the right type of intervention"
        required
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EnhancedScale
          label="How urgent is this?"
          value={learningGap.urgency || 3}
          onChange={(value) => setValue('learningGap.urgency', value)}
          min={1}
          max={5}
          minLabel="Low Priority"
          maxLabel="Critical"
          icons={['⏰', '⏰', '🔥', '🔥', '🚨']}
          colors={['#94a3b8', '#64748b', '#f59e0b', '#f97316', '#ef4444']}
          error={errors.learningGap?.urgency?.message as string}
          required
        />

        <EnhancedScale
          label="Business impact if not addressed?"
          value={learningGap.impact || 3}
          onChange={(value) => setValue('learningGap.impact', value)}
          min={1}
          max={5}
          minLabel="Minimal"
          maxLabel="Severe"
          icons={['😐', '😕', '😟', '😰', '🚨']}
          colors={['#94a3b8', '#64748b', '#f59e0b', '#f97316', '#ef4444']}
          error={errors.learningGap?.impact?.message as string}
          required
        />
      </div>

      <CheckboxPillGroup
        label="Which areas are impacted?"
        value={learningGap.impactAreas || []}
        onChange={(value) => setValue('learningGap.impactAreas', value)}
        options={IMPACT_AREAS}
        error={errors.learningGap?.impactAreas?.message as string}
        required
      />

      <RadioCardGroup
        label="What cognitive level should learners achieve? (Bloom's Taxonomy)"
        value={learningGap.bloomsLevel || ''}
        onChange={(value) => setValue('learningGap.bloomsLevel', value)}
        options={BLOOMS_LEVELS}
        error={errors.learningGap?.bloomsLevel?.message as string}
        helpText="Select the highest level learners need to demonstrate"
        required
      />

      <QuestionnaireInput
        label="Desired learning outcomes"
        value={learningGap.objectives || ''}
        onChange={(value) => setValue('learningGap.objectives', value)}
        placeholder="Upon completion, learners will be able to..."
        error={errors.learningGap?.objectives?.message as string}
        helpText="Start with an action verb (e.g., demonstrate, analyze, create)"
        required
        multiline
        rows={4}
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
            <p className="mb-2 font-medium">Writing effective learning objectives (ABCD format):</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-white/70">
              <li>
                <strong>A</strong>udience: Who (the learner)
              </li>
              <li>
                <strong>B</strong>ehavior: Will do what (action verb from Bloom&apos;s)
              </li>
              <li>
                <strong>C</strong>ondition: Under what circumstances
              </li>
              <li>
                <strong>D</strong>egree: How well (criteria for success)
              </li>
            </ul>
            <p className="mt-2 text-xs text-white/60 italic">
              Example: &quot;Sales reps will demonstrate the AI features to clients during product
              demos with 90% accuracy&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
