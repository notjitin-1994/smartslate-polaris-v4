'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { QuestionnaireSelect } from '@/components/wizard/static-questions/QuestionnaireSelect';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';
import {
  CheckboxPillGroup,
  CheckboxCardGroup,
  RadioCardGroup,
  ToggleSwitch,
  LabeledSlider,
  NumberSpinner,
  ConditionalFields,
} from '@/components/wizard/inputs';

const LEVEL1_METHODS = [
  { value: 'post-survey', label: 'Post-Training Survey' },
  { value: 'polls', label: 'Real-Time Polls' },
  { value: 'interviews', label: '1:1 Interviews' },
  { value: 'nps', label: 'NPS Score' },
  { value: 'none', label: 'Not planning to measure' },
];

const LEVEL2_METHODS = [
  {
    value: 'pre-post',
    label: 'Pre/Post Tests',
    description: 'Measure knowledge gain',
  },
  {
    value: 'quizzes',
    label: 'Embedded Quizzes',
    description: 'Check understanding throughout',
  },
  {
    value: 'scenarios',
    label: 'Scenario-Based',
    description: 'Apply knowledge in context',
  },
  {
    value: 'simulations',
    label: 'Simulations',
    description: 'Demonstrate skills',
  },
  {
    value: 'presentations',
    label: 'Presentations/Demos',
    description: 'Show what they learned',
  },
  {
    value: 'none',
    label: 'No formal assessment',
    description: 'Training only, no testing',
  },
];

const LEVEL3_METHODS = [
  {
    value: 'manager-obs',
    label: 'Manager Observations',
    description: 'Managers track behavior changes',
  },
  {
    value: 'self-report',
    label: 'Self-Reporting',
    description: 'Learners log their application',
  },
  {
    value: 'peer-review',
    label: 'Peer Review',
    description: 'Colleagues provide feedback',
  },
  {
    value: 'metrics',
    label: 'Performance Metrics',
    description: 'Track key performance indicators',
  },
  {
    value: 'work-samples',
    label: 'Work Samples',
    description: 'Review actual work outputs',
  },
];

const CERTIFICATION_OPTIONS = [
  {
    value: 'internal',
    label: 'Internal Certificate',
    description: 'Company-issued completion certificate',
  },
  {
    value: 'industry',
    label: 'Industry Certification Prep',
    description: 'Prepare for external certification exam',
  },
  {
    value: 'ceu',
    label: 'CEU/CPE Credits',
    description: 'Continuing education units',
  },
  {
    value: 'pdh',
    label: 'Professional Development Hours',
    description: 'Counts toward development requirements',
  },
  {
    value: 'none',
    label: 'No Certification',
    description: 'Completion tracking only',
  },
];

export function EvaluationStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  // Register all nested fields
  React.useEffect(() => {
    register('evaluation.level1.methods', { required: 'At least one feedback method is required' });
    register('evaluation.level1.satisfactionTarget', {
      required: 'Satisfaction target is required',
    });
    register('evaluation.level2.assessmentMethods', {
      required: 'At least one assessment method is required',
    });
    register('evaluation.level2.passingRequired', {
      required: 'Passing requirement must be specified',
    });
    register('evaluation.level2.passingScore');
    register('evaluation.level2.attemptsAllowed');
    register('evaluation.level3.measureBehavior');
    register('evaluation.level3.methods');
    register('evaluation.level3.followUpTiming');
    register('evaluation.level3.behaviors');
    register('evaluation.level4.measureROI');
    register('evaluation.level4.metrics');
    register('evaluation.level4.owner');
    register('evaluation.level4.timing');
    register('evaluation.certification', { required: 'Certification type must be specified' });
  }, [register]);

  const evaluation = watch('evaluation') || {};
  const level1 = evaluation.level1 || {};
  const level2 = evaluation.level2 || {};
  const level3 = evaluation.level3 || {};
  const level4 = evaluation.level4 || {};

  return (
    <div className="animate-fade-in-up space-y-8">
      <p className="text-body text-text-secondary leading-relaxed">
        Let's plan how you'll measure the success of this learning initiative across 4 levels
        (Kirkpatrick Model)
      </p>

      {/* LEVEL 1: REACTION */}
      <div className="border-success/30 bg-success/5 space-y-4 rounded-xl border-[1.5px] p-6">
        <h3 className="text-heading text-foreground font-heading font-semibold">
          Level 1: Reaction
        </h3>
        <p className="text-body text-text-secondary">
          How satisfied and engaged are learners with the training?
        </p>

        <CheckboxPillGroup
          label="How will you gather feedback?"
          value={level1.methods || []}
          onChange={(value) => setValue('evaluation.level1.methods', value)}
          options={LEVEL1_METHODS}
          error={errors.evaluation?.level1?.methods?.message as string}
          required
        />

        <LabeledSlider
          label="Target satisfaction level"
          value={level1.satisfactionTarget || 80}
          onChange={(value) => setValue('evaluation.level1.satisfactionTarget', value)}
          min={60}
          max={100}
          step={5}
          unit="%"
          helpText="What % of learners should rate the training positively?"
          error={errors.evaluation?.level1?.satisfactionTarget?.message as string}
          required
        />
      </div>

      {/* LEVEL 2: LEARNING */}
      <div className="border-info/30 bg-info/5 space-y-4 rounded-xl border-[1.5px] p-6">
        <h3 className="text-heading text-foreground font-heading font-semibold">
          Level 2: Learning
        </h3>
        <p className="text-body text-text-secondary">
          Did learners acquire the intended knowledge and skills?
        </p>

        <CheckboxCardGroup
          label="How will you assess learning?"
          value={level2.assessmentMethods || []}
          onChange={(value) => setValue('evaluation.level2.assessmentMethods', value)}
          options={LEVEL2_METHODS}
          error={errors.evaluation?.level2?.assessmentMethods?.message as string}
          allowMultiple
          required
        />

        <ConditionalFields
          showWhen={!((level2.assessmentMethods || []) as string[]).includes('none')}
        >
          <ToggleSwitch
            label="Is passing required?"
            value={level2.passingRequired ? 'yes' : 'no'}
            onChange={(value) => setValue('evaluation.level2.passingRequired', value === 'yes')}
            options={[
              { value: 'yes', label: 'Yes - Must Pass' },
              { value: 'no', label: 'No - Knowledge Check Only' },
            ]}
          />

          <ConditionalFields showWhen={level2.passingRequired}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledSlider
                label="Minimum passing score"
                value={level2.passingScore || 80}
                onChange={(value) => setValue('evaluation.level2.passingScore', value)}
                min={60}
                max={100}
                step={5}
                unit="%"
              />

              <NumberSpinner
                label="Attempts allowed"
                value={level2.attemptsAllowed || 2}
                onChange={(value) => setValue('evaluation.level2.attemptsAllowed', value)}
                min={1}
                max={5}
                suffix="attempts"
              />
            </div>
          </ConditionalFields>
        </ConditionalFields>
      </div>

      {/* LEVEL 3: BEHAVIOR */}
      <div className="border-warning/30 bg-warning/5 space-y-4 rounded-xl border-[1.5px] p-6">
        <h3 className="text-heading text-foreground font-heading font-semibold">
          Level 3: Behavior (Transfer)
        </h3>
        <p className="text-body text-text-secondary">
          Are learners applying what they learned on the job?
        </p>

        <ToggleSwitch
          label="Will you measure on-the-job behavior change?"
          value={level3.measureBehavior ? 'yes' : 'no'}
          onChange={(value) => setValue('evaluation.level3.measureBehavior', value === 'yes')}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No / Not Yet' },
          ]}
          helpText="Level 3 is where learning becomes performance"
        />

        <ConditionalFields showWhen={level3.measureBehavior}>
          <CheckboxCardGroup
            label="How will you measure application?"
            value={level3.methods || []}
            onChange={(value) => setValue('evaluation.level3.methods', value)}
            options={LEVEL3_METHODS}
            allowMultiple
          />

          <QuestionnaireSelect
            label="When will you follow up?"
            value={level3.followUpTiming || ''}
            onChange={(value) => setValue('evaluation.level3.followUpTiming', value)}
            options={[
              { value: '2-weeks', label: '2 weeks after training' },
              { value: '30-days', label: '30 days after training' },
              { value: '60-days', label: '60 days after training' },
              { value: '90-days', label: '90 days after training' },
              { value: '6-months', label: '6 months after training' },
              { value: 'ongoing', label: 'Ongoing/Continuous' },
            ]}
            placeholder="Select timing..."
          />

          <QuestionnaireInput
            label="What specific behaviors will you observe?"
            value={level3.behaviors || ''}
            onChange={(value) => setValue('evaluation.level3.behaviors', value)}
            placeholder="e.g., Using new software daily, Following updated safety protocols, Applying coaching techniques in team meetings"
            helpText="Be specific about observable actions"
            multiline
            rows={3}
          />
        </ConditionalFields>
      </div>

      {/* LEVEL 4: RESULTS */}
      <div className="border-secondary/30 bg-secondary/5 space-y-4 rounded-xl border-[1.5px] p-6">
        <h3 className="text-heading text-foreground font-heading font-semibold">
          Level 4: Results (Business Impact)
        </h3>
        <p className="text-body text-text-secondary">
          What business results will this training impact?
        </p>

        <ToggleSwitch
          label="Will you measure business impact/ROI?"
          value={level4.measureROI ? 'yes' : 'no'}
          onChange={(value) => setValue('evaluation.level4.measureROI', value === 'yes')}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No / Not Required' },
          ]}
          helpText="Level 4 connects training to business outcomes"
        />

        <ConditionalFields showWhen={level4.measureROI}>
          <div className="space-y-3">
            <label className="text-foreground block text-[15px] font-medium">
              What metrics will you track?
            </label>
            <p className="text-text-secondary text-[13px]">
              Type business KPIs and press Enter to add (e.g., "Sales revenue", "Error reduction %")
            </p>
            <div className="flex flex-wrap gap-2">
              {((level4.metrics || []) as string[]).map((metric, index) => (
                <span
                  key={index}
                  className="border-primary/30 bg-primary/10 text-primary-accent inline-flex items-center gap-2 rounded-full border-[1.5px] px-3.5 py-1.5 text-[14px] font-medium"
                >
                  {metric}
                  <button
                    type="button"
                    onClick={() => {
                      const current = (level4.metrics || []) as string[];
                      setValue(
                        'evaluation.level4.metrics',
                        current.filter((_m, i) => i !== index)
                      );
                    }}
                    className="rounded-full p-0.5 transition-colors hover:bg-white/10"
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
            <input
              type="text"
              placeholder="Type metric and press Enter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    const current = (level4.metrics || []) as string[];
                    setValue('evaluation.level4.metrics', [...current, value]);
                    e.currentTarget.value = '';
                  }
                }
              }}
              className="text-foreground placeholder-text-disabled focus:border-primary h-[3.25rem] w-full rounded-[0.875rem] border-[1.5px] border-neutral-200 bg-[rgba(13,27,42,0.4)] px-4 text-base transition-all duration-300 outline-none focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15)]"
            />
          </div>

          <QuestionnaireInput
            label="Who owns business metrics tracking?"
            value={level4.owner || ''}
            onChange={(value) => setValue('evaluation.level4.owner', value)}
            placeholder="e.g., Sales Manager, Operations Director, HR Analytics"
            helpText="Who will provide the performance data?"
          />

          <QuestionnaireSelect
            label="When will results be measured?"
            value={level4.timing || ''}
            onChange={(value) => setValue('evaluation.level4.timing', value)}
            options={[
              { value: '1-quarter', label: '1 quarter after training' },
              { value: '2-quarters', label: '2 quarters after training' },
              { value: '6-months', label: '6 months after training' },
              { value: '1-year', label: '1 year after training' },
              { value: 'ongoing', label: 'Ongoing/Continuous tracking' },
            ]}
            placeholder="Select timing..."
          />
        </ConditionalFields>
      </div>

      {/* CERTIFICATION */}
      <div className="space-y-4">
        <RadioCardGroup
          label="Certification or credentials"
          value={evaluation.certification || ''}
          onChange={(value) => setValue('evaluation.certification', value)}
          options={CERTIFICATION_OPTIONS}
          error={errors.evaluation?.certification?.message as string}
          required
        />
      </div>

      {/* Info Box */}
      <QuestionnaireInfoBox title="Why evaluation matters">
        <ul className="list-inside list-disc space-y-1.5 text-[13px]">
          <li>
            <strong className="text-foreground font-semibold">Level 1:</strong> Improve training
            quality and engagement
          </li>
          <li>
            <strong className="text-foreground font-semibold">Level 2:</strong> Ensure learning
            actually happened
          </li>
          <li>
            <strong className="text-foreground font-semibold">Level 3:</strong> Confirm skills
            transfer to the job
          </li>
          <li>
            <strong className="text-foreground font-semibold">Level 4:</strong> Demonstrate business
            value and ROI
          </li>
        </ul>
        <p className="mt-3 text-[13px]">
          Not every program needs all 4 levels - focus on what matters for your goals
        </p>
      </QuestionnaireInfoBox>
    </div>
  );
}
