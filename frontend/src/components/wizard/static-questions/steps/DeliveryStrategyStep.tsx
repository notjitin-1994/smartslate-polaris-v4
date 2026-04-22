'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  RadioCardGroup,
  RadioPillGroup,
  EnhancedScale,
  CheckboxCardGroup,
  ConditionalFields,
  LabeledSlider,
} from '@/components/wizard/inputs';

const MODALITIES = [
  {
    value: 'self-paced',
    label: 'Self-Paced eLearning',
    description: 'Asynchronous, flexible, scalable online learning',
  },
  {
    value: 'ilt',
    label: 'Instructor-Led Training',
    description: 'Live sessions with instructor (in-person or virtual)',
  },
  {
    value: 'blended',
    label: 'Blended Learning',
    description: 'Mix of self-paced and instructor-led components',
  },
  {
    value: 'microlearning',
    label: 'Microlearning',
    description: 'Bite-sized lessons (2-10 minutes each)',
  },
  {
    value: 'simulation',
    label: 'Simulation/VR',
    description: 'Immersive practice in safe environment',
  },
  {
    value: 'video',
    label: 'Video-Based Learning',
    description: 'Video lectures, demonstrations, or series',
  },
];

const SESSION_STRUCTURES = [
  { value: '1-day', label: '1-Day Workshop' },
  { value: 'multi-day', label: 'Multi-Day Program' },
  { value: 'weekly', label: 'Weekly Sessions' },
  { value: 'monthly', label: 'Monthly Cohort' },
];

const PRACTICE_OPPORTUNITIES = [
  {
    value: 'knowledge-checks',
    label: 'Knowledge Checks',
    description: 'Quick quizzes throughout',
  },
  {
    value: 'scenarios',
    label: 'Branching Scenarios',
    description: 'Decision-making practice',
  },
  {
    value: 'simulations',
    label: 'Simulations',
    description: 'Software or process simulations',
  },
  {
    value: 'role-plays',
    label: 'Role-Plays',
    description: 'Practice conversations',
  },
  {
    value: 'case-studies',
    label: 'Case Studies',
    description: 'Real-world problem solving',
  },
  {
    value: 'projects',
    label: 'Real Projects',
    description: 'Apply to actual work',
  },
];

const REINFORCEMENT_OPTIONS = [
  {
    value: 'none',
    label: 'None',
    description: 'One-time training event',
  },
  {
    value: 'emails',
    label: 'Email Reminders',
    description: 'Periodic tips and reminders',
  },
  {
    value: 'microlearning',
    label: 'Spaced Microlearning',
    description: 'Follow-up bite-sized lessons',
  },
  {
    value: 'coaching',
    label: 'Manager Coaching',
    description: 'Manager support and check-ins',
  },
  {
    value: 'community',
    label: 'Community of Practice',
    description: 'Ongoing peer learning',
  },
];

export function DeliveryStrategyStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  // CRITICAL: Register all nested fields
  React.useEffect(() => {
    register('deliveryStrategy.modality', { required: 'Delivery modality is required' });
    register('deliveryStrategy.duration');
    register('deliveryStrategy.sessionStructure');
    register('deliveryStrategy.interactivityLevel', {
      required: 'Interactivity level is required',
    });
    register('deliveryStrategy.practiceOpportunities');
    register('deliveryStrategy.socialLearning');
    register('deliveryStrategy.reinforcement', { required: 'Reinforcement strategy is required' });
  }, [register]);

  const deliveryStrategy = watch('deliveryStrategy') || {};
  const modality = deliveryStrategy.modality || '';

  return (
    <div className="animate-fade-in-up space-y-6">
      <RadioCardGroup
        label="What's your preferred delivery method?"
        value={modality}
        onChange={(value) => setValue('deliveryStrategy.modality', value)}
        options={MODALITIES}
        error={errors.deliveryStrategy?.modality?.message as string}
        required
      />

      <ConditionalFields showWhen={['self-paced', 'blended', 'microlearning'].includes(modality)}>
        <LabeledSlider
          label="Estimated learning duration"
          value={deliveryStrategy.duration || 60}
          onChange={(value) => setValue('deliveryStrategy.duration', value)}
          min={15}
          max={240}
          step={15}
          unit=" minutes"
          markers={[
            { value: 30, label: '30 min' },
            { value: 60, label: '1 hour' },
            { value: 120, label: '2 hours' },
            { value: 180, label: '3 hours' },
          ]}
          helpText="Total time for a learner to complete"
        />
      </ConditionalFields>

      <ConditionalFields showWhen={['ilt', 'blended'].includes(modality)}>
        <RadioPillGroup
          label="Session structure"
          value={deliveryStrategy.sessionStructure || ''}
          onChange={(value) => setValue('deliveryStrategy.sessionStructure', value)}
          options={SESSION_STRUCTURES}
        />
      </ConditionalFields>

      <EnhancedScale
        label="Desired interactivity level"
        value={deliveryStrategy.interactivityLevel || 3}
        onChange={(value) => setValue('deliveryStrategy.interactivityLevel', value)}
        min={1}
        max={5}
        minLabel="Passive (Watch/Read)"
        maxLabel="Highly Interactive (Practice/Apply)"
        helpText="How hands-on should the learning experience be?"
        icons={['📖', '💬', '🎮', '🛠️', '🎯']}
        colors={['#94a3b8', '#64748b', '#eab308', '#84cc16', '#22c55e']}
        error={errors.deliveryStrategy?.interactivityLevel?.message as string}
        required
      />

      <CheckboxCardGroup
        label="What practice opportunities should we include?"
        value={deliveryStrategy.practiceOpportunities || []}
        onChange={(value) => setValue('deliveryStrategy.practiceOpportunities', value)}
        options={PRACTICE_OPPORTUNITIES}
        helpText="Select all that apply"
        allowMultiple
      />

      <RadioCardGroup
        label="Post-learning reinforcement"
        value={deliveryStrategy.reinforcement || ''}
        onChange={(value) => setValue('deliveryStrategy.reinforcement', value)}
        options={REINFORCEMENT_OPTIONS}
        error={errors.deliveryStrategy?.reinforcement?.message as string}
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
            <p className="mb-2 font-medium">🎓 Delivery design principles:</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-white/70">
              <li>
                <strong>Large, distributed teams:</strong> Self-paced + optional live Q&A
              </li>
              <li>
                <strong>Complex skills:</strong> Blended with hands-on practice
              </li>
              <li>
                <strong>Quick updates:</strong> Microlearning or video series
              </li>
              <li>
                <strong>High-stakes:</strong> Simulation + instructor-led debrief
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
