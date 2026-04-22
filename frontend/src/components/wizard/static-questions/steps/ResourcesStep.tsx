'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';
import {
  CurrencyInput,
  ToggleSwitch,
  LabeledSlider,
  NumberSpinner,
  EnhancedScale,
  RadioPillGroup,
  RadioCardGroup,
} from '@/components/wizard/inputs';

const LMS_OPTIONS = [
  'Moodle',
  'Canvas',
  'Blackboard',
  'TalentLMS',
  'Docebo',
  'Cornerstone',
  'SAP SuccessFactors',
  'Absorb',
  'iSpring',
  'No LMS (standalone)',
  'Other',
];

const AUTHORING_TOOLS = [
  'Articulate Storyline',
  'Articulate Rise',
  'Adobe Captivate',
  'Camtasia',
  'Vyond',
  'iSpring Suite',
  'Lectora',
  'H5P',
  'PowerPoint',
  'Other',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const CONTENT_SOURCES = [
  {
    value: 'scratch',
    label: 'Create from Scratch',
    description: 'Build all content from ground up',
  },
  {
    value: 'adapt',
    label: 'Adapt Existing Content',
    description: 'Revise and modernize current materials',
  },
  {
    value: 'license',
    label: 'License External Content',
    description: 'Purchase off-the-shelf courses',
  },
  {
    value: 'curate',
    label: 'Curate OER',
    description: 'Use open educational resources',
  },
  {
    value: 'hybrid',
    label: 'Hybrid Approach',
    description: 'Mix of multiple sources',
  },
];

export function ResourcesStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // CRITICAL: Register all nested fields
  React.useEffect(() => {
    register('resources.budget.amount', { required: 'Budget amount is required' });
    register('resources.budget.flexibility', { required: 'Budget flexibility is required' });
    register('resources.timeline.targetDate', { required: 'Target date is required' });
    register('resources.timeline.flexibility', { required: 'Timeline flexibility is required' });
    register('resources.timeline.duration', { required: 'Duration is required' });
    register('resources.team.instructionalDesigners');
    register('resources.team.contentDevelopers');
    register('resources.team.multimediaSpecialists');
    register('resources.team.smeAvailability', { required: 'SME availability is required' });
    register('resources.team.experienceLevel', { required: 'Experience level is required' });
    register('resources.technology.lms', { required: 'LMS selection is required' });
    register('resources.technology.authoringTools');
    register('resources.technology.otherTools');
    register('resources.contentStrategy.source', { required: 'Content source is required' });
    register('resources.contentStrategy.existingMaterials');
  }, [register]);

  const resources = watch('resources') || {};
  const budget = resources.budget || {};
  const timeline = resources.timeline || {};
  const team = resources.team || {};
  const technology = resources.technology || {};
  const contentStrategy = resources.contentStrategy || {};

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* BUDGET SECTION */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>💰</span> Budget
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrencyInput
            label="Total budget available"
            value={budget.amount || 0}
            onChange={(value) => setValue('resources.budget.amount', value)}
            currency="USD"
            placeholder="50000"
            helpText="Include all costs: people, tools, content, platform"
            allowApproximate
            error={errors.resources?.budget?.amount?.message as string}
            required
          />

          <ToggleSwitch
            label="Budget flexibility"
            value={budget.flexibility || 'flexible'}
            onChange={(value) => setValue('resources.budget.flexibility', value)}
            options={[
              { value: 'fixed', label: 'Fixed', icon: '🔒' },
              { value: 'flexible', label: 'Flexible', icon: '🔄' },
            ]}
            error={errors.resources?.budget?.flexibility?.message as string}
            required
          />
        </div>
      </div>

      {/* TIMELINE SECTION */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>📅</span> Timeline
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm text-white/70">
              Target launch date <span style={{ color: '#a7dadb' }}>*</span>
            </label>
            <input
              type="date"
              value={timeline.targetDate || ''}
              onChange={(e) => setValue('resources.timeline.targetDate', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition outline-none focus:border-[#d0edf0] focus:ring-[1.2px] focus:ring-[#d0edf0]"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e0e0e0' }}
            />
            {errors.resources?.timeline?.targetDate && (
              <p className="animate-fade-in text-sm text-red-400">
                {errors.resources.timeline.targetDate.message as string}
              </p>
            )}
          </div>

          <ToggleSwitch
            label="Timeline flexibility"
            value={timeline.flexibility || 'flexible'}
            onChange={(value) => setValue('resources.timeline.flexibility', value)}
            options={[
              { value: 'fixed', label: 'Fixed Deadline', icon: '⏰' },
              { value: 'flexible', label: 'Flexible', icon: '📆' },
            ]}
            error={errors.resources?.timeline?.flexibility?.message as string}
            required
          />
        </div>

        <LabeledSlider
          label="Total project duration estimate"
          value={timeline.duration || 12}
          onChange={(value) => setValue('resources.timeline.duration', value)}
          min={1}
          max={52}
          step={1}
          unit=" weeks"
          markers={[
            { value: 4, label: '1 month' },
            { value: 12, label: '3 months' },
            { value: 26, label: '6 months' },
            { value: 52, label: '1 year' },
          ]}
          helpText="From kickoff to launch"
          error={errors.resources?.timeline?.duration?.message as string}
          required
        />
      </div>

      {/* TEAM SECTION */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>👥</span> Team & Subject Matter Experts
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumberSpinner
            label="Instructional Designers"
            value={team.instructionalDesigners || 0}
            onChange={(value) => setValue('resources.team.instructionalDesigners', value)}
            min={0}
            max={10}
            suffix="people"
            icon="✏️"
            error={errors.resources?.team?.instructionalDesigners?.message as string}
          />

          <NumberSpinner
            label="Content Developers"
            value={team.contentDevelopers || 0}
            onChange={(value) => setValue('resources.team.contentDevelopers', value)}
            min={0}
            max={10}
            suffix="people"
            icon="📝"
            error={errors.resources?.team?.contentDevelopers?.message as string}
          />

          <NumberSpinner
            label="Multimedia Specialists"
            value={team.multimediaSpecialists || 0}
            onChange={(value) => setValue('resources.team.multimediaSpecialists', value)}
            min={0}
            max={10}
            suffix="people"
            icon="🎨"
            error={errors.resources?.team?.multimediaSpecialists?.message as string}
          />
        </div>

        <EnhancedScale
          label="SME availability & involvement"
          value={team.smeAvailability || 3}
          onChange={(value) => setValue('resources.team.smeAvailability', value)}
          min={1}
          max={5}
          minLabel="Limited Access"
          maxLabel="Dedicated Partnership"
          helpText="How available are subject matter experts?"
          icons={['🚫', '⏰', '📅', '🤝', '🎯']}
          error={errors.resources?.team?.smeAvailability?.message as string}
          required
        />

        <RadioPillGroup
          label="Team experience level"
          value={team.experienceLevel || ''}
          onChange={(value) => setValue('resources.team.experienceLevel', value)}
          options={EXPERIENCE_LEVELS}
          error={errors.resources?.team?.experienceLevel?.message as string}
          required
        />
      </div>

      {/* TECHNOLOGY SECTION */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>🛠️</span> Technology & Tools
        </h3>

        <div className="space-y-2">
          <label className="block text-sm text-white/70">
            Learning Management System (LMS) <span style={{ color: '#a7dadb' }}>*</span>
          </label>
          <select
            value={technology.lms || ''}
            onChange={(e) => setValue('resources.technology.lms', e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition outline-none focus:border-[#d0edf0] focus:ring-[1.2px] focus:ring-[#d0edf0]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a7dadb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
          >
            <option value="" disabled className="bg-[#0d1b2a] text-white/50">
              Select your LMS...
            </option>
            {LMS_OPTIONS.map((lms) => (
              <option key={lms} value={lms} className="bg-[#0d1b2a] text-white">
                {lms}
              </option>
            ))}
          </select>
          {errors.resources?.technology?.lms && (
            <p className="animate-fade-in text-sm text-red-400">
              {errors.resources.technology.lms.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-white/70">Authoring tools available</label>
          <p className="text-xs text-white/50">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {AUTHORING_TOOLS.map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => {
                  const current = (technology.authoringTools || []) as string[];
                  const isSelected = current.includes(tool);
                  setValue(
                    'resources.technology.authoringTools',
                    isSelected ? current.filter((t) => t !== tool) : [...current, tool]
                  );
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  ((technology.authoringTools || []) as string[]).includes(tool)
                    ? 'bg-[#a7dadb] text-[#020C1B] shadow-md'
                    : 'border border-white/10 bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT STRATEGY SECTION */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>📚</span> Content Strategy
        </h3>

        <RadioCardGroup
          label="Primary content source"
          value={contentStrategy.source || ''}
          onChange={(value) => setValue('resources.contentStrategy.source', value)}
          options={CONTENT_SOURCES}
          error={errors.resources?.contentStrategy?.source?.message as string}
          required
        />
      </div>

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
            <p className="mb-2 font-medium">💡 Resource planning tips:</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-white/70">
              <li>
                <strong>Budget:</strong> Even rough estimates help create realistic recommendations
              </li>
              <li>
                <strong>Timeline:</strong> Factor in reviews, revisions, and pilot testing
              </li>
              <li>
                <strong>Team:</strong> Be honest about capacity and skill levels
              </li>
              <li>
                <strong>Tools:</strong> We&apos;ll work with what you have or recommend alternatives
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
